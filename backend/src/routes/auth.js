import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { body } from 'express-validator';
import { User } from '../models/User.js';
import { signToken, authMiddleware } from '../middleware/auth.js';
import { validateRequest } from '../middleware/validateRequest.js';
import { sendError } from '../utils/errors.js';

const router = Router();

router.post(
  '/register',
  body('email').isEmail().normalizeEmail().withMessage('valid email required'),
  body('password').isLength({ min: 6 }).withMessage('password must be at least 6 characters'),
  body('role').isIn(['candidate', 'recruiter', 'admin']).withMessage('invalid role'),
  body('name').optional({ checkFalsy: true }).isString().trim(),
  validateRequest,
  async (req, res, next) => {
    try {
      const email = String(req.body.email || '')
        .trim()
        .toLowerCase();
      const { password, role, name } = req.body;
      const exists = await User.findOne({ email });
      if (exists) {
        return sendError(res, 409, 'CONFLICT', 'Email already registered');
      }
      const passwordHash = await bcrypt.hash(password, 10);
      const user = await User.create({ email, passwordHash, role, name: name || '' });
      const token = signToken(user);
      res.status(201).json({
        token,
        user: { id: user._id, email: user.email, role: user.role, name: user.name },
      });
    } catch (e) {
      next(e);
    }
  }
);

router.post(
  '/login',
  body('email').isEmail().normalizeEmail(),
  body('password').notEmpty().withMessage('password required'),
  validateRequest,
  async (req, res, next) => {
    try {
      const email = String(req.body.email || '')
        .trim()
        .toLowerCase();
      const { password } = req.body;
      const user = await User.findOne({ email });
      if (!user) {
        return sendError(res, 401, 'UNAUTHORIZED', 'Invalid credentials');
      }
      if (user.disabled) {
        return sendError(res, 403, 'FORBIDDEN', 'Account disabled');
      }
      const ok = await bcrypt.compare(password, user.passwordHash);
      if (!ok) {
        return sendError(res, 401, 'UNAUTHORIZED', 'Invalid credentials');
      }
      const token = signToken(user);
      res.json({
        token,
        user: { id: user._id, email: user.email, role: user.role, name: user.name },
      });
    } catch (e) {
      next(e);
    }
  }
);

router.get('/me', authMiddleware, async (req, res, next) => {
  try {
    const user = await User.findById(req.user.id).select('-passwordHash');
    if (!user || user.disabled) {
      return sendError(res, 404, 'NOT_FOUND', 'User not found');
    }
    res.json({
      user: {
        id: user._id,
        email: user.email,
        role: user.role,
        name: user.name,
      },
    });
  } catch (e) {
    next(e);
  }
});

export default router;
