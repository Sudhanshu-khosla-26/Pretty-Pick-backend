const SENSITIVE_KEYS = new Set([
  'password',
  'token',
  'authorization',
  'jwt',
  'jwt_secret',
  'mail_pass',
]);

const isPlainObject = (value) =>
  value !== null && typeof value === 'object' && !Array.isArray(value);

const sanitize = (value, depth = 0) => {
  if (depth > 4) return '[MaxDepth]';

  if (Array.isArray(value)) {
    return value.slice(0, 20).map((v) => sanitize(v, depth + 1));
  }

  if (isPlainObject(value)) {
    const out = {};
    for (const [key, val] of Object.entries(value)) {
      if (SENSITIVE_KEYS.has(key.toLowerCase())) {
        out[key] = '[REDACTED]';
      } else {
        out[key] = sanitize(val, depth + 1);
      }
    }
    return out;
  }

  if (typeof value === 'string') {
    if (value.length > 500) return `${value.slice(0, 500)}…`;
    return value;
  }

  return value;
};

const safeJson = (obj) => {
  try {
    const str = JSON.stringify(obj);
    return str.length > 2000 ? `${str.slice(0, 2000)}…` : str;
  } catch {
    return '[Unserializable]';
  }
};

module.exports = function requestLogger(req, res, next) {
  if (process.env.LOG_REQUESTS === 'false') return next();

  const start = process.hrtime.bigint();

  res.on('finish', () => {
    const end = process.hrtime.bigint();
    const ms = Number(end - start) / 1e6;

    const method = req.method;
    const url = req.originalUrl;
    const status = res.statusCode;

    const parts = [`${method} ${url}`, `-> ${status}`, `${ms.toFixed(1)}ms`];

    if (process.env.LOG_REQUEST_QUERY === 'true') {
      parts.push(`query=${safeJson(sanitize(req.query))}`);
    }

    if (process.env.LOG_REQUEST_BODY === 'true') {
      // Don't accidentally log login/register passwords by default.
      const isSensitiveRoute =
        url.includes('/auth/login') ||
        url.includes('/auth/register') ||
        url.includes('/auth/forgot-password') ||
        url.includes('/auth/reset-password');

      if (!isSensitiveRoute) {
        parts.push(`body=${safeJson(sanitize(req.body))}`);
      }
    }

    if (req.user?._id) {
      parts.push(`user=${req.user._id.toString()}`);
    }

    // eslint-disable-next-line no-console
    console.log(`[API] ${parts.join(' | ')}`);
  });

  next();
};
