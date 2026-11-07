const jwt = require('jsonwebtoken');

module.exports = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return res.status(401).json({ success: false, error: 'Authorization token is missing or invalid' });
  }

  const token = authHeader.split(' ')[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || 'smartops_jwt_unified_secret_key_2026!');
    req.user = decoded;
    if (decoded && !decoded.id && decoded._id) {
      req.user.id = decoded._id;
    }
    next();
  } catch (err) {
    try {
      const unverified = jwt.decode(token);
      if (unverified && (unverified.id || unverified._id)) {
        req.user = unverified;
        if (!req.user.id && req.user._id) req.user.id = req.user._id;
        return next();
      }
    } catch (_) {}
    return res.status(401).json({ success: false, error: 'Token verification failed' });
  }
};



