import { verifyToken } from './auth.js';

export function authMiddleware(req, res, next) {
  try {
    const authHeader = req.headers.authorization;
    console.log('Auth Header:', authHeader);
    if (!authHeader) return res.status(401).json({ error: 'No token provided' });
    console.log('JWT_SECRET:', process.env.JWT_SECRET);
    const token = authHeader.split(' ')[1];
    console.log('Token extracted:', token);
    if (!token) return res.status(401).json({ error: 'No token provided' });

    const user = verifyToken(token);
    if (!user) {
      console.log('Token verification failed');
      return res.status(401).json({ error: 'Invalid token' });
    }

    req.user = user;
    next();
  } catch (err) {
    console.error('Auth middleware error:', err);
    return res.status(401).json({ error: 'Unauthorized' });
  }
}
