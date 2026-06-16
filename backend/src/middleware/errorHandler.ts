import { ErrorRequestHandler } from 'express';
import { HttpError } from '../common/httpError.js';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ message: error.message, details: error.details });
    return;
  }

  console.error(error);
  res.status(500).json({ message: 'Internal server error' });
};
