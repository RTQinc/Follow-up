// ─── Configuração do Google Sheets ───────────────────────────────────────────
// Essas variáveis são lidas do ambiente (configuradas no Vercel)
const SHEET_ID = import.meta.env.VITE_SHEET_ID;
const API_KEY  = import.meta.env.VITE_GOOGLE_API_KEY;
const BASE_URL = `https://sheets.googleapis.com/v4/spreadsheets/${SHEET_ID}`;

// Abas da planilha
const ABA_INTERACOES = 'INTERAÇÕES';
const ABA_CLIENTES   = 'CLIENTES';

// ─── Leitura ─────────────────────────────────────────────────────────────────

export async function lerClientes() {
  try {
    const url = `${BASE_URL}/values/${ABA_CLIENTES}!A:F?key=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    const rows = data.values || [];
    if (rows.length < 2) return [];
    const [, ...body] = rows; // ignora cabeçalho
    return body.map((r, i) => ({
      id: i + 2, // linha real na planilha
      nome:          (r[0] || '').trim().toUpperCase(),
      cidade:        (r[1] || '').trim().toUpperCase(),
      classificacao: (r[2] || 'C').trim().toUpperCase(),
      status:        (r[3] || 'ativo').trim().toLowerCase(),
      desde:         (r[4] || '').trim(),
      motivo_inativo:(r[5] || '').trim(),
    })).filter(c => c.nome);
  } catch (e) {
    console.error('Erro ao ler clientes:', e);
    return [];
  }
}

export async function lerInteracoes() {
  try {
    const url = `${BASE_URL}/values/${ABA_INTERACOES}!A:L?key=${API_KEY}`;
    const res = await fetch(url);
    const data = await res.json();
    const rows = data.values || [];
    if (rows.length < 2) return [];
    const [, ...body] = rows;
    return body.map((r, i) => ({
      id: i + 2,
      tipo:          (r[0]  || '').trim(),
      data:          (r[1]  || '').trim(),
      cliente:       (r[2]  || '').trim().toUpperCase(),
      cidade:        (r[3]  || '').trim(),
      contato:       (r[4]  || '').trim(),
      classificacao: (r[5]  || '').trim(),
      cargo:         (r[6]  || '').trim(),
      depto:         (r[7]  || '').trim(),
      area:          (r[8]  || 'GERAL').trim(),
      foco:          (r[9]  || '').trim(),
      negocio:       (r[10] || '').trim(),
      feedback:      (r[11] || '').trim(),
    })).filter(c => c.cliente);
  } catch (e) {
    console.error('Erro ao ler interações:', e);
    return [];
  }
}

// ─── Escrita (usa OAuth token do usuário logado) ──────────────────────────────

async function appendRow(aba, valores) {
  const token = localStorage.getItem('google_token');
  if (!token) throw new Error('Usuário não autenticado');

  const url = `${BASE_URL}/values/${aba}!A1:append?valueInputOption=USER_ENTERED&insertDataOption=INSERT_ROWS`;
  const res = await fetch(url, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: [valores] }),
  });
  if (!res.ok) {
    const err = await res.json();
    throw new Error(err.error?.message || 'Erro ao salvar');
  }
  return await res.json();
}

export async function salvarInteracao(contato) {
  const valores = [
    contato.tipo          || '',
    contato.data          || new Date().toLocaleDateString('pt-BR'),
    contato.cliente       || '',
    contato.cidade        || '',
    contato.contato       || '',
    contato.classificacao || '',
    contato.cargo         || '',
    contato.depto         || '',
    contato.area          || 'GERAL',
    contato.foco          || '',
    contato.negocio       || '',
    contato.feedback      || '',
  ];
  return appendRow(ABA_INTERACOES, valores);
}

export async function salvarCliente(cliente) {
  const valores = [
    cliente.nome,
    cliente.cidade        || '',
    cliente.classificacao || 'C',
    cliente.status        || 'ativo',
    cliente.desde         || new Date().toLocaleDateString('pt-BR'),
    cliente.motivo_inativo|| '',
  ];
  return appendRow(ABA_CLIENTES, valores);
}

export async function atualizarStatusCliente(linha, status, motivo) {
  const token = localStorage.getItem('google_token');
  if (!token) throw new Error('Usuário não autenticado');

  // Atualiza colunas D (status) e F (motivo) da linha correspondente
  const url = `${BASE_URL}/values/${ABA_CLIENTES}!D${linha}:F${linha}?valueInputOption=USER_ENTERED`;
  const res = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ values: [[status, '', motivo || '']] }),
  });
  if (!res.ok) throw new Error('Erro ao atualizar cliente');
  return await res.json();
}

// ─── Autenticação Google OAuth ────────────────────────────────────────────────

const CLIENT_ID = import.meta.env.VITE_GOOGLE_CLIENT_ID;
const SCOPES    = 'https://www.googleapis.com/auth/spreadsheets';

export function iniciarLogin() {
  const params = new URLSearchParams({
    client_id:     CLIENT_ID,
    redirect_uri:  window.location.origin + '/auth/callback',
    response_type: 'token',
    scope:         SCOPES,
    prompt:        'select_account',
  });
  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export function verificarToken() {
  // Captura token do callback OAuth (hash da URL)
  if (window.location.hash.includes('access_token')) {
    const params = new URLSearchParams(window.location.hash.slice(1));
    const token   = params.get('access_token');
    const expires = params.get('expires_in');
    if (token) {
      localStorage.setItem('google_token', token);
      localStorage.setItem('google_token_exp', Date.now() + parseInt(expires) * 1000);
      window.location.hash = '';
    }
  }
  const token = localStorage.getItem('google_token');
  const exp   = parseInt(localStorage.getItem('google_token_exp') || '0');
  if (!token || Date.now() > exp) {
    localStorage.removeItem('google_token');
    return null;
  }
  return token;
}

export function logout() {
  localStorage.removeItem('google_token');
  localStorage.removeItem('google_token_exp');
}
