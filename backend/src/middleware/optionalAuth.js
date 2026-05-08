import { verifyToken } from './auth.js';

/** Sets req.user when Authorization Bearer is valid; otherwise continues without user. */
export function optionalAuth(req, _res, next) {
  const header = req.headers.authorization;
  if (!header?.startsWith('Bearer ')) {
    return next();
  }
  try {
    const payload = verifyToken(header.slice(7));
    req.user = { id: payload.sub, role: payload.role, email: payload.email };
  } catch {
    /* invalid token for public routes: ignore */
  }
  next();
}
