/** Throw this from a route to send a specific status + message. */
export class HttpError extends Error {
  constructor(status, message) {
    super(message);
    this.status = status;
  }
}

/** 404 for unknown /api routes */
export function notFound(req, _res, next) {
  next(new HttpError(404, `Route not found: ${req.method} ${req.originalUrl}`));
}

/** Central error handler — always responds with JSON { message }.
 *  Express recognises error handlers by their 4 arguments, so `_next` stays. */
export function errorHandler(err, _req, res, _next) {
  let status = err.status ?? err.statusCode ?? 500;
  let message = err.message;

  if (err.type === 'entity.parse.failed') {
    status = 400;
    message = 'Invalid JSON body';
  }
  if (status >= 500) {
    console.error(err);
    if (process.env.NODE_ENV === 'production') message = 'Internal server error';
  }
  res.status(status).json({ message });
}
