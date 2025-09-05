const errorHandler = (err, req, res, next) => {
  const statusCode = err.statusCode || err.status || 500;
  
  // Prepare the error response
  const errorResponse = {
    success: false,
    message: err.message || 'Internal Server Error',
    status: 'fail'
  };
  
  // If there are validation errors, include them in the response
  if (err.validationErrors) {
    errorResponse.errors = err.validationErrors;
    
    // Create a more user-friendly message
    const errorMessages = [];
    Object.entries(err.validationErrors).forEach(([location, errors]) => {
      Object.entries(errors).forEach(([field, messages]) => {
        errorMessages.push(...messages);
      });
    });
    
    if (errorMessages.length > 0) {
      errorResponse.message = errorMessages.join('; ');
    }
  }
  
  // Log error details in development
  if (process.env.NODE_ENV === 'development') {
    console.error('Error details:', {
      message: err.message,
      stack: err.stack,
      validationErrors: err.validationErrors
    });
  }
  
  res.status(statusCode).json(errorResponse);
};

export default errorHandler;