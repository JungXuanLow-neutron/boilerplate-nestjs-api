import type { NextFunction, Request, Response } from 'express';
import { describe, expect, it, vi } from 'vitest';
import { requestIdMiddleware } from './request-id.middleware.js';

function createContext(requestId?: string): {
  req: Request;
  res: Response;
  next: NextFunction;
  setHeader: ReturnType<typeof vi.fn>;
} {
  const setHeader = vi.fn();
  const req = { header: vi.fn().mockReturnValue(requestId) } as unknown as Request;
  const res = { setHeader } as unknown as Response;
  const next = vi.fn() as unknown as NextFunction;
  return { req, res, next, setHeader };
}

describe('requestIdMiddleware', () => {
  it('generates and returns a request ID when the header is absent', () => {
    const { req, res, next, setHeader } = createContext();

    requestIdMiddleware(req, res, next);

    expect(req.id).toMatch(/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i);
    expect(setHeader).toHaveBeenCalledWith('x-request-id', req.id);
    expect(next).toHaveBeenCalledOnce();
  });

  it('preserves a client-provided request ID', () => {
    const { req, res, next, setHeader } = createContext('client-request-123');

    requestIdMiddleware(req, res, next);

    expect(req.id).toBe('client-request-123');
    expect(setHeader).toHaveBeenCalledWith('x-request-id', 'client-request-123');
    expect(next).toHaveBeenCalledOnce();
  });
});
