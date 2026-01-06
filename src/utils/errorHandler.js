export const errorHandler = (err, req, res, next) => {
  console.error("🔥 Error Stack:", err.stack);
  console.error("🔥 Error Details:", {
    message: err.message,
    statusCode: err.statusCode,
    errors: err.errors
  });

  // If headers already sent, delegate to default handler
  if (res.headersSent) {
    return next(err);
  }

  const statusCode = err.statusCode || 500;
  const message = err.message || "Internal Server Error";
  const errors = err.errors || [];

  res.status(statusCode).json({
    success: false,
    message,
    errors,
    stack: process.env.NODE_ENV === "development" ? err.stack : undefined
  });
};