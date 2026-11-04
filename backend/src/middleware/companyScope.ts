import { Response, NextFunction } from 'express';
import { AuthRequest } from './authMiddleware';

/**
 * Reusable Company Scope Middleware.
 * Automatically verifies company context and enforces tenant data isolation.
 *
 * Behavior:
 * - If user is SUPER_ADMIN: allows access across all companies (no restrictions).
 * - If user is Owner / Driver: requires req.companyId to be present.
 * - If a specific companyId parameter is supplied in route params (e.g. /company/:companyId/...),
 *   validates that req.companyId matches req.params.companyId. If mismatch, returns 403 Forbidden.
 */
export const companyScope = (req: AuthRequest, res: Response, next: NextFunction) => {
  // Super Admin override for global platform administration
  if (req.userRole === 'SUPER_ADMIN') {
    return next();
  }

  // Require companyId context on authenticated user
  if (!req.companyId) {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Company context required. Please log in with a valid company account.',
    });
  }

  // Verify requested companyId parameter matches the authenticated user's companyId
  if (req.params.companyId && req.params.companyId !== req.companyId) {
    return res.status(403).json({
      success: false,
      message: 'Forbidden: Access denied to other company data.',
    });
  }

  next();
};

/**
 * Helper to build a MongoDB query filter automatically injected with companyId.
 */
export const getScopedFilter = (req: AuthRequest, additionalFilter: Record<string, any> = {}): Record<string, any> => {
  if (req.userRole === 'SUPER_ADMIN') {
    return { ...additionalFilter };
  }
  return {
    ...additionalFilter,
    companyId: req.companyId,
  };
};
