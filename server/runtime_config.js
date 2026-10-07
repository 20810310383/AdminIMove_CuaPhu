function parsePort(value, fallback) {
  const parsed = Number(value ?? fallback);
  return Number.isInteger(parsed) && parsed > 0 && parsed <= 65535 ? parsed : fallback;
}

function normalizeHttpBaseUrl(value, label = 'URL') {
  const clean = String(value || '').trim().replace(/\/+$/, '');
  if (!clean) throw new Error(`${label} chưa được cấu hình.`);
  try {
    const parsed = new URL(clean);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('unsupported protocol');
    return clean;
  } catch (_) {
    throw new Error(`URL không hợp lệ: ${clean}`);
  }
}

export function resolveAdminPort({ adminPort, corePort, fallbackPort = 5060 }) {
  const core = parsePort(corePort, 5050);
  const requested = parsePort(adminPort, fallbackPort);
  if (requested === core) {
    throw new Error(`ADMIN_PORT=${requested} trùng CORE_HTTP_PORT=${core}. Admin Gateway và Core Backend phải dùng hai cổng khác nhau.`);
  }
  return { port: requested, corrected: false, reason: null };
}

export function resolveRuntimeConfig(env = process.env) {
  const corePort = parsePort(env.CORE_HTTP_PORT, 5050);
  const adminPort = resolveAdminPort({ adminPort: env.ADMIN_PORT, corePort }).port;
  const coreBackendUrl = normalizeHttpBaseUrl(env.CORE_BACKEND_URL, 'CORE_BACKEND_URL');
  return { adminPort, corePort, coreBackendUrl };
}

export function resolveAdminProxyTarget({ explicitUrl } = {}) {
  return normalizeHttpBaseUrl(explicitUrl, 'VITE_CORE_BACKEND_URL');
}
