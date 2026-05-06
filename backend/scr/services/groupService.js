const { v4: uuidv4 } = require('uuid');
const GroupModel = require('../models/groupModel');

const GroupService = {
  createGroup({ name, subject, description, location, max_members }, adminId) {
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

    return GroupModel.create({
      id: uuidv4(),
      name: name.trim(),
      subject: subject.trim(),
      description: description.trim(),
      location,
      max_members: limit,
      admin_id: adminId,
    });
  },

  searchGroups(filters) {
    return GroupModel.search(filters);
  },

  getGroup(groupId) {
    const group = GroupModel.findById(groupId);
    if (!group) throw new Error('Grupo não encontrado.');
    return group;
  },

  joinGroup(groupId, userId) {
    const group = GroupModel.findById(groupId);
    if (!group) throw new Error('Grupo não encontrado.');

    if (GroupModel.isMember(groupId, userId)) {
      throw new Error('Você já é membro deste grupo.');
    }

    if (group.member_count >= group.max_members) {
      throw new Error('Este grupo já atingiu o limite de participantes.');
    }

    GroupModel.addMember(groupId, userId);
    return { message: 'Você entrou no grupo com sucesso!', group: GroupModel.findById(groupId) };
  },

  leaveGroup(groupId, userId) {
    const group = GroupModel.findById(groupId);
    if (!group) throw new Error('Grupo não encontrado.');

    if (group.admin_id === userId) {
      throw new Error('O administrador não pode sair do grupo. Exclua o grupo ou transfira a administração.');
    }

    if (!GroupModel.isMember(groupId, userId)) {
      throw new Error('Você não é membro deste grupo.');
    }

    GroupModel.removeMember(groupId, userId);
    return { message: 'Você saiu do grupo.' };
  },

  getUserGroups(userId) {
    return GroupModel.getUserGroups(userId);
  },
};

module.exports = GroupService;
