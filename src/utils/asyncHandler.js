export const asyncHandler = (requestHandler) => {
  return (req, res, next) => {
    Promise.resolve(requestHandler(req, res, next)).catch((error) => {
      console.error("Async Handler Error:", error);
      next(error);
    });
  };
};