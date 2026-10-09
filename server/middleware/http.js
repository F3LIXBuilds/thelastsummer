import jwt from 'jsonwebtoken';

export const ah = (fn) => (req, res, next) => fn(req, res, next).catch(next);

export function issueSession(res, userId) {
  const token = jwt.sign({ sub: String(userId) }, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, {
    httpOnly: true,
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
    maxAge: 7 * 24 * 3600 * 1000,
  });
}

export function requireAuth(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return res.status(401).json({ error: 'Please sign in' });
  try {
    req.userId = jwt.verify(token, process.env.JWT_SECRET).sub;
    next();
  } catch {
    res.clearCookie('token');
    res.status(401).json({ error: 'Your session expired. Please sign in again.' });
  }
}

export function errorHandler(err, req, res, _next) {
  if (err.name === 'ZodError')
    return res.status(400).json({ error: 'Invalid input', details: err.issues.map((i) => `${i.path.join('.')}: ${i.message}`) });
  if (err.type === 'entity.parse.failed') return res.status(400).json({ error: 'Malformed JSON' });
  if (err.status && err.status < 500) return res.status(err.status).json({ error: err.message });
  console.error(err);
  res.status(500).json({ error: 'Something went wrong on our side' });
}
