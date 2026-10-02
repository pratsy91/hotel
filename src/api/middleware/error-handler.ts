import { WorkflowFailedError } from '@temporalio/client';
import type { NextFunction, Request, Response } from 'express';
import { isProduction } from '../../config/env.js';
import { isAppError } from '../../errors/app-error.js';
import { logger } from '../../logger/logger.js';

export function errorHandler(
  error: unknown,
  req: Request,
  res: Response,
  _next: NextFunction,
): void {
  if (res.headersSent) {
    return;
  }

  if (isAppError(error)) {
    logger.warn('Request rejected', {
      code: error.code,
      statusCode: error.statusCode,
      message: error.message,
      path: req.originalUrl,
    });
    res.status(error.statusCode).json({
      error: error.message,
      code: error.code,
    });
    return;
  }

  if (error instanceof WorkflowFailedError) {
    const supplierFailure = isSuppliersUnavailable(error);
    logger.error('Temporal workflow failed', {
      path: req.originalUrl,
      message: error.message,
      cause: error.cause instanceof Error ? error.cause.message : undefined,
    });
    res.status(supplierFailure ? 503 : 502).json({
      error: supplierFailure ? 'Both hotel suppliers are unavailable' : 'Hotel aggregation failed',
      code: supplierFailure ? 'SUPPLIERS_UNAVAILABLE' : 'AGGREGATION_FAILED',
    });
    return;
  }

  const message = error instanceof Error ? error.message : 'Unexpected error';
  logger.error('Unhandled request error', {
    path: req.originalUrl,
    message,
  });

  res.status(500).json({
    error: 'Internal server error',
    code: 'INTERNAL_ERROR',
    ...(isProduction ? {} : { detail: message }),
  });
}

function isSuppliersUnavailable(error: WorkflowFailedError): boolean {
  let current: unknown = error.cause;
  for (let depth = 0; depth < 6 && current !== undefined && current !== null; depth += 1) {
    if (typeof current !== 'object') {
      return false;
    }
    const typed = current as { type?: unknown; message?: unknown; cause?: unknown };
    if (typed.type === 'SuppliersUnavailable') {
      return true;
    }
    current = typed.cause;
  }
  return false;
}
