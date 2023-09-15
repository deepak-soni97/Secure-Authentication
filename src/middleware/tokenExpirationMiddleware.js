
const jwt = require('jsonwebtoken')

// Middleware for token expiration and automatic refresh
const tokenExpirationMiddleware = (req, res, next) => {
    const { token } = req.body;
  
    // Check if the token is still valid
    jwt.verify(token, 'secret_key', (err, decoded) => {
      if (err) {
        return res.status(401).json({ message: 'Token expired or invalid' });
      }
  
      // Token is still valid, refresh it
      const refreshedToken = jwt.sign({ username: decoded.username }, 'secret_key', {
        expiresIn: '5m', // Token refreshes for another 5 minutes
      });
  
      req.body.token = refreshedToken; // Update the token in the request body
      next();
    });
  }

  module.exports = tokenExpirationMiddleware;