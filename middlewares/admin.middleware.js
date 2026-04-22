exports.isAdmin = (req, res, next) => {
  const isAdmin = Boolean(req.user?.isAdmin) || req.user?.role === 'admin';
  if (!isAdmin) {
    return res.status(403).json({ message: 'Admin access only' });
  }
  next();
};
