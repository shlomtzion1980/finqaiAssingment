import type { ErrorRequestHandler, RequestHandler } from 'express';
import type { z } from 'zod';
import { HttpError, NotFoundError, ValidationError } from './errors.js';

export type ErrorBody = {
  error: { code: string; message: string; details?: unknown };
};

/** Parses `value` with `schema` or throws a 400 with the zod issues attached. */
export function parseOrThrow<T extends z.ZodType>(schema: T, value: unknown): z.infer<T> {
  const result = schema.safeParse(value);
  if (!result.success) {
    throw new ValidationError(
      result.error.issues.map((issue) => ({ path: issue.path.join('.'), message: issue.message })),
    );
  }
  return result.data;
}

export const notFoundHandler: RequestHandler = (req, _res, next) => {
  next(new NotFoundError(`No route for ${req.method} ${req.path}`));
};

export const errorHandler: ErrorRequestHandler = (err, _req, res, _next) => {
  if (err instanceof HttpError) {
    const body: ErrorBody = { error: { code: err.code, message: err.message, details: err.details } };
    res.status(err.status).json(body);
    return;
  }

  // body-parser errors (malformed JSON, payload too large) carry an HTTP status.
  if (isClientError(err)) {
    const body: ErrorBody = { error: { code: 'BAD_REQUEST', message: err.message } };
    res.status(err.status).json(body);
    return;
  }

  console.error(err);
  const body: ErrorBody = { error: { code: 'INTERNAL', message: 'Internal server error' } };
  res.status(500).json(body);
};

function isClientError(err: unknown): err is { status: number; message: string } {
  if (typeof err !== 'object' || err === null) return false;
  const status = (err as { status?: unknown }).status;
  return typeof status === 'number' && status >= 400 && status < 500;
}
