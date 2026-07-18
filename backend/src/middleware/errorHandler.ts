import { ErrorRequestHandler } from 'express';
import { HttpError } from '../common/httpError.js';

export const errorHandler: ErrorRequestHandler = (error, _req, res, _next) => {
  console.error('Error:', error);
  
  if (error instanceof HttpError) {
    res.status(error.statusCode).json({ message: error.message, details: error.details });
    return;
  }

  // Handle Prisma errors
  if (error.code) {
    switch (error.code) {
      case 'P2002':
        res.status(409).json({ message: 'A record with this value already exists' });
        return;
      case 'P2025':
        res.status(404).json({ message: 'Record not found' });
        return;
      default:
        res.status(500).json({ message: error.message || 'Database error' });
        return;
    }
  }

  // Handle other errors
  res.status(500).json({ message: error.message || 'Internal server error' });
};
