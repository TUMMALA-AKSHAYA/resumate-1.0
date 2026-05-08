import { validationResult } from 'express-validator';
import { sendError } from '../utils/errors.js';

export function validateRequest(req, res, next) {
  const result = validationResult(req);
  if (result.isEmpty()) return next();
  sendError(res, 400, 'VALIDATION', 'Invalid input', result.array({ onlyFirstError: false }));
}
