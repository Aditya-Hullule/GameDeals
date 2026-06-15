const { getAuth } = require('@clerk/express');

const authenticateToken = (req, res, next) => {
  const auth = getAuth(req);
  
  if (!auth.userId) {
    return res.status(401).json({ error: 'Access denied. User not authenticated.' });
  }

  // Map Clerk's userId to req.user.id for compatibility with our existing list endpoints
  req.user = { id: auth.userId };
  next();
};

module.exports = { authenticateToken };
