export function parsePagination(req, { defaultLimit = 20, maxLimit = 100 } = {}) {
  const page = Math.max(1, parseInt(String(req.query.page || '1'), 10) || 1);
  let limit = parseInt(String(req.query.limit || String(defaultLimit)), 10) || defaultLimit;
  if (limit > maxLimit) limit = maxLimit;
  if (limit < 1) limit = 1;
  const skip = (page - 1) * limit;
  return { page, limit, skip };
}
