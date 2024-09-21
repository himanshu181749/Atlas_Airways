const jwt = require('jsonwebtoken');
require('dotenv').config();

// Middleware to verify if the user is an admin
function adminAuth(req, res, next) {
  const token = req.cookies.token;  // Access token from cookies
  console.log("Token from cookies: ", token);  // Add logging

  if (!token) {
    return res.status(401).json({ message: 'Unauthorized: No token provided' });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log("Decoded token: ", decoded);  // Log the decoded token

    if (decoded.role !== 'admin') {
      return res.status(403).json({ message: 'Access denied. Admins only' });
    }

    req.user = decoded;  // Attach decoded user info to the request
    next();  // Allow the request to proceed
  } catch (error) {
    return res.status(401).json({ message: 'Unauthorized: Invalid token' });
  }
}


module.exports = adminAuth;
