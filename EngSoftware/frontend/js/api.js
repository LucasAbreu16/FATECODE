// Camada de comunicação com a API
const API_BASE = '/api';

async function apiFetch(endpoint, options = {}) {
  const token = localStorage.getItem('connexa_token');
  const headers = { 'Content-Type': 'application/json', ...options.headers };
  if (token) headers['Authorization'] = `Bearer ${token}`;

  const res = await fetch(`${API_BASE}${endpoint}`, { ...options, headers });
  const data = await res.json().catch(() => ({}));

  if (!res.ok) throw new Error(data.error || 'Erro inesperado.');
  return data;
}

const API = {
  // AUTH
  register: (body)  => apiFetch('/auth/register', { method: 'POST', body: JSON.stringify(body) }),
  login:    (body)  => apiFetch('/auth/login',    { method: 'POST', body: JSON.stringify(body) }),
  me:       ()      => apiFetch('/auth/me'),

  // GROUPS
  searchGroups: (params) => {
    const qs = new URLSearchParams(params).toString();
    return apiFetch(`/groups?${qs}`);
  },
  createGroup:  (body)   => apiFetch('/groups', { method: 'POST', body: JSON.stringify(body) }),
  getGroup:     (id)     => apiFetch(`/groups/${id}`),
  joinGroup:    (id)     => apiFetch(`/groups/${id}/join`,  { method: 'POST' }),
  leaveGroup:   (id)     => apiFetch(`/groups/${id}/leave`, { method: 'DELETE' }),
  myGroups:     ()       => apiFetch('/groups/my'),
};
