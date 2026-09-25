import { errors } from '@strapi/utils';

/**
 * 409: status job tidak sesuai untuk aksi yang diminta.
 * Middleware errors bawaan Strapi memetakan ApplicationError tak dikenal ke 400,
 * jadi controller yang menangkap error ini dan membalas lewat ctx.conflict().
 */
export class ConflictError extends errors.ApplicationError {
  constructor(message = 'Conflict', details?: unknown) {
    super(message, details);
    (this as { name: string }).name = 'ConflictError';
  }
}

export const httpStatusOf = (error: unknown): number => {
  if (error instanceof ConflictError) return 409;
  if (error instanceof errors.UnauthorizedError) return 401;
  if (error instanceof errors.ForbiddenError) return 403;
  if (error instanceof errors.NotFoundError) return 404;
  if (error instanceof errors.PayloadTooLargeError) return 413;
  if (error instanceof errors.ApplicationError) return 400;
  const status = (error as { status?: number })?.status;
  return typeof status === 'number' ? status : 500;
};
