// Gerenciamento de sessão e autenticação
let currentUser = null;

function getToken() { return localStorage.getItem('connexa_token'); }
function isLoggedIn() { return !!getToken() && !!currentUser; }

function setSession(token, user) {
  localStorage.setItem('connexa_token', token);
  currentUser = user;
  updateNavbar();
}

function clearSession() {
  localStorage.removeItem('connexa_token');
  currentUser = null;
  updateNavbar();
}

function updateNavbar() {
  const authEl  = document.getElementById('navAuth');
  const guestEl = document.getElementById('navGuest');
  const nameEl  = document.getElementById('navUserName');
  const heroCTA = document.getElementById('heroCTA');
  const newBtn  = document.getElementById('newGroupBtnHeader');

  if (isLoggedIn()) {
    authEl.style.display  = 'contents';
    guestEl.style.display = 'none';
    nameEl.textContent    = `${currentUser.name.split(' ')[0]}`;
    if (heroCTA) { heroCTA.textContent = '+ Criar Grupo'; heroCTA.onclick = () => showPage('createGroup'); }
    if (newBtn)  newBtn.style.display = 'inline-flex';
  } else {
    authEl.style.display  = 'none';
    guestEl.style.display = 'contents';
    if (heroCTA) { heroCTA.textContent = 'Criar Conta'; heroCTA.onclick = () => showPage('register'); }
    if (newBtn)  newBtn.style.display = 'none';
  }
}

function logout() {
  clearSession();
  showPage('home');
  showToast('Você saiu da sua conta.', 'warning');
}

function requireAuthAction(page) {
  if (!isLoggedIn()) {
    showToast('Faça login para continuar.', 'warning');
    showPage('login');
    return false;
  }
  if (page) showPage(page);
  return true;
}

// Handlers de formulário
async function handleRegister(e) {
  e.preventDefault();
  const btn = document.getElementById('registerBtn');
  btn.disabled = true; btn.textContent = 'Criando conta...';

  try {
    await API.register({
      name:       document.getElementById('reg-name').value.trim(),
      email:      document.getElementById('reg-email').value.trim(),
      password:   document.getElementById('reg-password').value,
      university: document.getElementById('reg-university').value.trim(),
      course:     document.getElementById('reg-course').value.trim(),
    });
    showToast('Conta criada! Verifique seu e-mail para ativar.', 'success');
    document.getElementById('registerForm').reset();
    showPage('login');
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Criar conta';
  }
}

async function handleLogin(e) {
  e.preventDefault();
  const btn = document.getElementById('loginBtn');
  btn.disabled = true; btn.textContent = 'Entrando...';

  try {
    const { token, user } = await API.login({
      email:    document.getElementById('login-email').value.trim(),
      password: document.getElementById('login-password').value,
    });
    setSession(token, user);
    document.getElementById('loginForm').reset();
    showToast(`Bem-vindo, ${user.name.split(' ')[0]}! 🎉`, 'success');
    showPage('groups');
    loadGroups();
  } catch (err) {
    showToast(err.message, 'error');
  } finally {
    btn.disabled = false; btn.textContent = 'Entrar';
  }
}

// Tenta restaurar sessão ao carregar a página
async function restoreSession() {
  const token = getToken();
  if (!token) return;
  try {
    const { user } = await API.me();
    currentUser = user;
    updateNavbar();
  } catch {
    clearSession();
  }
}
