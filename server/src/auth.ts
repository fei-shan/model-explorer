import type { Request, Response, NextFunction } from 'express';

/**
 * Minimal shared-secret gate. Only enforced when API_KEY is actually set in
 * the environment - local dev (no API_KEY configured) behaves exactly as
 * before, unauthenticated. The deployed Cloud Run service always has
 * API_KEY set (via Secret Manager), so it's the only environment where
 * this actually blocks requests. This exists because the deployed service
 * is publicly reachable (Cloud Run set to allow-unauthenticated, since a
 * static-site browser client can't easily present a Google-signed token) -
 * this app-level key is the actual access control at that point, not
 * Cloud Run's own IAM layer. See docs/data-pipeline.md §7 for the fuller
 * auth hardening this is deliberately a lightweight stand-in for.
 */
export function apiKeyGate(req: Request, res: Response, next: NextFunction) {
  const requiredKey = process.env.API_KEY;
  if (!requiredKey) {
    next();
    return;
  }
  if (req.path === '/health') {
    next();
    return;
  }
  if (req.header('x-api-key') !== requiredKey) {
    res.status(401).json({ error: 'missing or invalid x-api-key header' });
    return;
  }
  next();
}
