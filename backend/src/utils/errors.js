/** Typed application error for consistent API responses. */
export class AppError extends Error {
  /**
   * @param {string} code Machine-readable code (e.g. NOT_FOUND)
   * @param {string} message Human-readable message
   * @param {number} [status=400] HTTP status
   * @param {unknown} [details] Optional validation or extra detail
   */
  constructor(code, message, status = 400, details = undefined) {
    super(message);
    this.code = code;
    this.status = status;
    this.details = details;
    this.name = 'AppError';
  }
}

/** @param {import('express').Response} res */
export function sendError(res, status, code, message, details = undefined) {
  const body = { error: { code, message } };
  if (details !== undefined) body.error.details = details;
  return res.status(status).json(body);
}
