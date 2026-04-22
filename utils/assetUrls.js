const looksLikeAbsoluteUrl = (value) => /^https?:\/\//i.test(value);

const normalizeAssetPath = (value) => {
  if (!value) return value;

  if (looksLikeAbsoluteUrl(value)) return value;

  // already a server-root path
  if (value.startsWith('/')) return value;

  // treat bare filenames as images stored under /images
  return `/images/${value}`;
};

const toAbsoluteUrl = (req, value) => {
  const normalized = normalizeAssetPath(value);
  if (!normalized) return normalized;
  if (looksLikeAbsoluteUrl(normalized)) return normalized;

  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}${normalized}`;
};

const mapImageArrayToAbsolute = (req, images) => (Array.isArray(images) ? images.map((v) => toAbsoluteUrl(req, v)) : []);

module.exports = {
  normalizeAssetPath,
  toAbsoluteUrl,
  mapImageArrayToAbsolute,
};
