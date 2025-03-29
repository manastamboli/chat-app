// Error handling middleware
export const errorHandler = (err, req, res, next) => {
  console.error('Error:', err.stack);

  // Handle Multer errors specifically
  if (err.name === 'MulterError') {
    return res.status(400).json({
      message: 'File upload error',
      error: err.message
    });
  }

  // Handle Cloudinary errors
  if (err.message && err.message.includes('api_key')) {
    return res.status(500).json({
      message: 'Cloud storage configuration error',
      error: 'Internal server error with file storage'
    });
  }

  // General error handling
  res.status(err.status || 500).json({
    message: err.message || 'Something went wrong!',
    error: process.env.NODE_ENV === 'production' ? 'Server error' : err.toString()
  });
}; 