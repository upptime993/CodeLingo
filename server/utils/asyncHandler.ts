import { Request, Response, NextFunction } from 'express';

/**
 * T-10: asyncHandler wrapper untuk menghilangkan try-catch berulang di route handlers.
 * Semua error di-forward ke Express error handler via next(err).
 *
 * Usage:
 *   router.get('/path', asyncHandler(async (req, res) => {
 *     const data = await SomeModel.find();
 *     res.json(data);
 *   }));
 */
export const asyncHandler = (
  fn: (req: Request, res: Response, next: NextFunction) => Promise<void>
) => (req: Request, res: Response, next: NextFunction): void => {
  fn(req, res, next).catch(next);
};
