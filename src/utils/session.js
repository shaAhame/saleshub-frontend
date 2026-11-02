// Login session is kept in sessionStorage (NOT localStorage):
// it is wiped when the tab/browser is closed, so the next person who opens
// the site on a shared showroom computer is NOT logged in as the last user.

const S = () => window.sessionStorage;

export const getToken = () => {
  try { return S().getItem('token'); } catch { return null; }
};

export const getUser = () => {
  try {
    const u = S().getItem('user');
    return u ? JSON.parse(u) : null;
  } catch { return null; }
};

export const touch = () => {
  try { S().setItem('lastActivity', String(Date.now())); } catch {}
};

export const setSession = (token, user) => {
  try {
    if (token) S().setItem('token', token);
    S().setItem('user', JSON.stringify(user));
  } catch {}
  touch();
};

export const clearSession = () => {
  try {
    S().removeItem('token');
    S().removeItem('user');
    S().removeItem('lastActivity');
  } catch {}
};

// Milliseconds since last activity (Infinity if never recorded)
export const idleFor = () => {
  try {
    const t = parseInt(S().getItem('lastActivity') || '0', 10);
    return t ? Date.now() - t : Infinity;
  } catch { return Infinity; }
};

// Remove logins saved by the OLD version (localStorage survives closing the browser)
export const purgeOldStorage = () => {
  try {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  } catch {}
};
