// ===== NAVEGAÇÃO =====
function showPage(name) {
    document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
    const target = document.getElementById(`page-${name}`);
    if (target) target.classList.add('active');
    window.scrollTo({ top: 0, behavior: 'smooth' });
  
    // Hooks por página
    if (name === 'groups')   loadGroups();
    if (name === 'myGroups') { if (!requireAuthAction()) return; loadMyGroups(); }
    if (name === 'createGroup' && !requireAuthAction()) return;
  }
  
  // ===== TOAST =====
  let toastTimer;
  function showToast(msg, type = '') {
    const el = document.getElementById('toast');
    el.textContent = msg;
    el.className = `toast ${type}`;
    // Force reflow para reiniciar a animação
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => el.classList.remove('show'), 3500);
  }
  
  // ===== MODAL DE DETALHES =====
  function openGroupModal(group, isMember) {
    const fullEl = document.getElementById('groupModal');
    const contentEl = document.getElementById('modalContent');
    const slots = group.max_members - group.member_count;
  
    contentEl.innerHTML = `
      <div class="group-subject">${group.subject}</div>
      <h2 style="margin:8px 0 16px;font-size:1.3rem">${group.name}</h2>
  
      <div class="group-meta" style="margin-bottom:16px">
        <span>${group.location === 'online' ? '🌐' : '📍'} ${group.location}</span>
        <span>👥 ${group.member_count} / ${group.max_members} participantes</span>
        <span>${slots > 0 ? `✅ ${slots} vaga${slots > 1 ? 's' : ''}` : '🔴 Grupo cheio'}</span>
      </div>
  
      <div class="group-admin" style="margin-bottom:20px">
        🎓 Administrador: <strong>${group.admin_name}</strong>
      </div>
  
      <div style="margin-bottom:20px">
        <p style="font-size:.85rem;font-weight:600;color:var(--muted);margin-bottom:6px">DESCRIÇÃO</p>
        <p style="font-size:.9rem;line-height:1.6;color:var(--text)">${group.description}</p>
      </div>
  
      <div style="display:flex;gap:10px;flex-wrap:wrap">
        ${isMember
          ? (group.admin_id === currentUser?.id
              ? `<p style="font-size:.85rem;color:var(--muted)">Você é o administrador deste grupo.</p>`
              : `<button class="btn btn-danger" onclick="handleLeaveGroup('${group.id}')">Sair do grupo</button>`)
          : (slots > 0
              ? `<button class="btn btn-primary" onclick="handleJoinGroup('${group.id}')">Entrar no grupo</button>`
              : `<button class="btn btn-outline" disabled>Grupo cheio</button>`)
        }
        <button class="btn btn-outline" onclick="closeGroupModal()">Fechar</button>
      </div>
    `;
  
    fullEl.style.display = 'flex';
  }
  
  function closeGroupModal() { document.getElementById('groupModal').style.display = 'none'; }
  function closeModal(e) { if (e.target === document.getElementById('groupModal')) closeGroupModal(); }
  
  // ===== GRUPOS =====
  let currentGroups = [];
  let myGroupIds    = new Set();
  
  async function loadMyGroupIds() {
    if (!isLoggedIn()) { myGroupIds = new Set(); return; }
    try {
      const groups = await API.myGroups();
      myGroupIds = new Set(groups.map(g => g.id));
    } catch { myGroupIds = new Set(); }
  }
  
  async function loadGroups() {
    const container = document.getElementById('groupsList');
    container.innerHTML = '<div class="loading">⏳ Carregando grupos...</div>';
  
    const query    = document.getElementById('searchInput')?.value.trim()    || '';
    const location = document.getElementById('filterLocation')?.value         || '';
    const available = document.getElementById('filterAvailable')?.value       || '';
  
    try {
      await loadMyGroupIds();
      const groups = await API.searchGroups({ query, location, available });
      currentGroups = groups;
      renderGroups(container, groups, myGroupIds);
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>Erro ao carregar grupos</h3><p>${err.message}</p></div>`;
    }
  }
  
  function renderGroups(container, groups, memberSet) {
    if (!groups.length) {
      container.innerHTML = `
        <div class="empty-state">
          <div class="icon">🔍</div>
          <h3>Nenhum grupo encontrado</h3>
          <p>Tente outros termos de busca ou crie um novo grupo.</p>
        </div>`;
      return;
    }
  
    container.innerHTML = groups.map(g => groupCard(g, memberSet.has(g.id))).join('');
  }
  
  function groupCard(g, isMember) {
    const slots   = g.max_members - g.member_count;
    const isFull  = slots <= 0;
    const badgeCls = g.location === 'online' ? 'badge-online' : 'badge-presencial';
    const locLabel = g.location === 'online' ? '🌐 Online' : '📍 Presencial';
  
    const joinBtn = isMember
      ? (g.admin_id === currentUser?.id
          ? `<button class="btn btn-outline btn-sm" onclick="openGroupModal(${JSON.stringify(g).replace(/"/g,"'")}, true)">👑 Admin</button>`
          : `<button class="btn btn-danger btn-sm" onclick="handleLeaveGroup('${g.id}')">Sair do grupo</button>`)
      : isFull
        ? `<button class="btn btn-outline btn-sm" disabled>Grupo cheio</button>`
        : `<button class="btn btn-primary btn-sm" onclick="handleJoinGroup('${g.id}')">Entrar no grupo</button>`;
  
    return `
      <div class="group-card" id="card-${g.id}">
        <div class="group-card-header">
          <div>
            <div class="group-subject">${escHtml(g.subject)}</div>
            <div class="group-name">${escHtml(g.name)}</div>
          </div>
          <span class="badge ${badgeCls}">${locLabel}</span>
        </div>
  
        <div class="group-description collapsed" id="desc-${g.id}">
          ${escHtml(g.description)}
        </div>
        <button class="toggle-desc" id="toggle-${g.id}" onclick="toggleDesc('${g.id}')">Ver mais</button>
  
        <div class="group-meta">
          <span>👥 ${g.member_count} / ${g.max_members}</span>
          ${isFull ? '<span class="badge badge-full">Cheio</span>' : `<span style="color:var(--success)">✅ ${slots} vaga${slots !== 1 ? 's' : ''}</span>`}
        </div>
  
        <div class="group-admin">🎓 Admin: <strong>${escHtml(g.admin_name)}</strong></div>
  
        <div class="group-card-footer">
          ${joinBtn}
          <button class="btn btn-outline btn-sm"
            onclick='openGroupModal(${JSON.stringify(g)}, ${isMember})'>
            Ver detalhes
          </button>
        </div>
      </div>`;
  }
  
  function toggleDesc(id) {
    const desc   = document.getElementById(`desc-${id}`);
    const btn    = document.getElementById(`toggle-${id}`);
    const isCollapsed = desc.classList.toggle('collapsed');
    btn.textContent = isCollapsed ? 'Ver mais' : 'Ver menos';
  }
  
  function escHtml(str) {
    return String(str)
      .replace(/&/g,'&amp;').replace(/</g,'&lt;')
      .replace(/>/g,'&gt;').replace(/"/g,'&quot;');
  }
  
  // ===== CRIAR GRUPO =====
  async function handleCreateGroup(e) {
    e.preventDefault();
    if (!requireAuthAction()) return;
  
    const btn = document.getElementById('createGroupBtn');
    btn.disabled = true; btn.textContent = 'Criando...';
  
    try {
      await API.createGroup({
        name:        document.getElementById('grp-name').value.trim(),
        subject:     document.getElementById('grp-subject').value.trim(),
        description: document.getElementById('grp-description').value.trim(),
        location:    document.getElementById('grp-location').value,
        max_members: document.getElementById('grp-max').value,
      });
      showToast('Grupo criado com sucesso! 🎉', 'success');
      document.getElementById('createGroupForm').reset();
      showPage('myGroups');
    } catch (err) {
      showToast(err.message, 'error');
    } finally {
      btn.disabled = false; btn.textContent = 'Criar grupo';
    }
  }
  
  // ===== ENTRAR NO GRUPO =====
  async function handleJoinGroup(groupId) {
    if (!requireAuthAction()) return;
    try {
      const { message } = await API.joinGroup(groupId);
      showToast(message, 'success');
      myGroupIds.add(groupId);
      refreshGroupCard(groupId);
      // Fecha o modal se aberto
      const modal = document.getElementById('groupModal');
      if (modal.style.display !== 'none') {
        const g = await API.getGroup(groupId);
        openGroupModal(g, true);
      }
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
  
  // ===== SAIR DO GRUPO =====
  async function handleLeaveGroup(groupId) {
    if (!requireAuthAction()) return;
    try {
      const { message } = await API.leaveGroup(groupId);
      showToast(message, 'success');
      myGroupIds.delete(groupId);
      // Atualiza card ou lista "Meus grupos"
      const inMyGroups = document.getElementById('page-myGroups').classList.contains('active');
      if (inMyGroups) {
        loadMyGroups();
      } else {
        refreshGroupCard(groupId);
      }
      closeGroupModal();
    } catch (err) {
      showToast(err.message, 'error');
    }
  }
  
  async function refreshGroupCard(groupId) {
    try {
      const g = await API.getGroup(groupId);
      const cardEl = document.getElementById(`card-${groupId}`);
      if (!cardEl) return;
      const isMember = myGroupIds.has(groupId);
      cardEl.outerHTML = groupCard(g, isMember);
      // Restaura estado do toggle
    } catch { /* silencioso */ }
  }
  
  // ===== MEUS GRUPOS =====
  async function loadMyGroups() {
    const container = document.getElementById('myGroupsList');
    container.innerHTML = '<div class="loading">⏳ Carregando seus grupos...</div>';
    try {
      const groups = await API.myGroups();
      myGroupIds = new Set(groups.map(g => g.id));
      if (!groups.length) {
        container.innerHTML = `
          <div class="empty-state">
            <div class="icon">📚</div>
            <h3>Você ainda não participa de nenhum grupo</h3>
            <p>Explore os grupos disponíveis ou crie o seu próprio.</p>
          </div>`;
        return;
      }
      container.innerHTML = groups.map(g => groupCard(g, true)).join('');
    } catch (err) {
      container.innerHTML = `<div class="empty-state"><div class="icon">⚠️</div><h3>${err.message}</h3></div>`;
    }
  }
  
  // ===== BUSCA =====
  function searchGroups() { loadGroups(); }
  
  function clearFilters() {
    document.getElementById('searchInput').value    = '';
    document.getElementById('filterLocation').value = '';
    document.getElementById('filterAvailable').value = '';
    loadGroups();
  }
  
  // Enter dispara busca
  document.getElementById('searchInput')?.addEventListener('keydown', e => {
    if (e.key === 'Enter') searchGroups();
  });
  
  // ===== INIT =====
  (async () => {
    await restoreSession();
    showPage('home');
  })();
  