const { v4: uuidv4 } = require('uuid');
const GroupModel      = require('../models/groupModel');

const GroupService = {
  // ------------------------------------------------------------------
  // Adicionar novo grupo no banco de dados
  // ------------------------------------------------------------------
  async createGroup({ name, subject, description, location, max_members }, adminId) {
    if (!name || !subject || !description || !location) {
      throw new Error('Todos os campos obrigatórios devem ser preenchidos.');
    }
    if (!['online', 'presencial'].includes(location)) {
      throw new Error('Local deve ser "online" ou "presencial".');
    }
    const limit = parseInt(max_members, 10);
    if (isNaN(limit) || limit < 2 || limit > 100) {
      throw new Error('Limite de participantes deve ser entre 2 e 100.');
    }

    const group = await GroupModel.create({
      id: uuidv4(),
      name: name.trim(),
      subject: subject.trim(),
      description: description.trim(),
      location,
      max_members: limit,
      admin_id: adminId,
    });

    return group;
  },

  // ------------------------------------------------------------------
  // Consultar grupos no banco de dados
  // Retorna: lista de grupos correspondentes (com member_count, max_members, location)
  //          ou array vazio se nenhum grupo for encontrado
  // ------------------------------------------------------------------
  async searchGroups(filters) {
    const groups = await GroupModel.search(filters);
    // Retorna array (pode ser vazio — o controller trata isso)
    return groups;
  },

  async getGroup(groupId) {
    const group = await GroupModel.findById(groupId);
    if (!group) throw new Error('Grupo não encontrado.');
    return group;
  },

  async joinGroup(groupId, userId) {
    const group = await GroupModel.findById(groupId);
    if (!group) throw new Error('Grupo não encontrado.');

    const already = await GroupModel.isMember(groupId, userId);
    if (already) throw new Error('Você já é membro deste grupo.');

    if (group.member_count >= group.max_members) {
      throw new Error('Este grupo já atingiu o limite de participantes.');
    }

    await GroupModel.addMember(groupId, userId);

    // Retorna o grupo atualizado com o novo member_count
    const updated = await GroupModel.findById(groupId);
    return { message: 'Você entrou no grupo com sucesso!', group: updated };
  },

  // ------------------------------------------------------------------
  // Retirar usuário de um grupo
  // ------------------------------------------------------------------
  async leaveGroup(groupId, userId) {
    const group = await GroupModel.findById(groupId);
    if (!group) throw new Error('Grupo não encontrado.');

    // Admin não pode sair — deve deletar ou transferir primeiro
    if (group.admin_id === userId) {
      throw new Error('O administrador não pode sair do grupo. Exclua o grupo ou transfira a administração.');
    }

    const isMember = await GroupModel.isMember(groupId, userId);
    if (!isMember) throw new Error('Você não é membro deste grupo.');

    const removed = await GroupModel.removeMember(groupId, userId);

    if (removed === 0) {
      throw new Error('Não foi possível remover o usuário do grupo.');
    }

    // Busca o número atualizado de participantes
    const newCount = await GroupModel.getMemberCount(groupId);

    return {
      message: 'Você saiu do grupo com sucesso.',
      group_id: groupId,
      member_count: newCount,   // número atualizado de participantes
    };
  },

  async getUserGroups(userId) {
    return GroupModel.getUserGroups(userId);
  },
};

module.exports = GroupService;
