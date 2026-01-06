import jwt from 'jsonwebtoken';
import { User } from '../models/user.model.js';

export const authenticate = async (req, res, next) => {
  try {
    // Get token from header or cookie
    let token;
    
    if (req.header('Authorization')) {
      // Get token from Authorization header
      token = req.header('Authorization')?.replace('Bearer ', '');
    } else if (req.cookies?.accessToken) {
      // Get token from cookie
      token = req.cookies.accessToken;
    } else if (req.session?.accessToken) {
      // Get token from session
      token = req.session.accessToken;
    }

    // Check if token exists
    if (!token) {
      console.log('❌ No token provided in request');
      console.log('🔍 Headers:', req.headers);
      console.log('🍪 Cookies:', req.cookies);
      
      return res.status(401).json({
        success: false,
        message: 'Access denied. No token provided.'
      });
    }

    console.log('🔑 Token received (first 30 chars):', token.substring(0, 30) + '...');
    console.log('🔑 Token length:', token.length);

    try {
      // Verify token using ACCESS_TOKEN_SECRET
      const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
      console.log('✅ Token decoded successfully:', {
        userId: decoded._id,
        email: decoded.email,
        userName: decoded.userName,
        fullName: decoded.fullName
      });

      // Find user by ID
      const user = await User.findById(decoded._id).select('-password');
      
      if (!user) {
        console.log('❌ User not found for ID:', decoded._id);
        return res.status(401).json({
          success: false,
          message: 'User not found. Please login again.'
        });
      }

      // Check if user exists in database (additional check)
      const userExists = await User.exists({ _id: decoded._id });
      if (!userExists) {
        console.log('❌ User does not exist in database:', decoded._id);
        return res.status(401).json({
          success: false,
          message: 'User account does not exist.'
        });
      }

      // Attach user to request
      req.user = user;
      req.token = token;
      
      console.log(`✅ Authentication successful for: ${user.fullName} (${user.email})`);
      
      // Update last login (optional - add field to your schema if needed)
      // user.lastLogin = new Date();
      // await user.save();
      
      next();
    } catch (tokenError) {
      console.error('❌ Token verification failed:', {
        name: tokenError.name,
        message: tokenError.message,
        expiredAt: tokenError.expiredAt
      });
      
      if (tokenError.name === 'TokenExpiredError') {
        return res.status(401).json({
          success: false,
          message: 'Token has expired. Please refresh your token.',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      if (tokenError.name === 'JsonWebTokenError') {
        console.error('❌ JWT Error details:', tokenError.message);
        return res.status(401).json({
          success: false,
          message: 'Invalid token. Please login again.',
          code: 'INVALID_TOKEN'
        });
      }
      
      throw tokenError;
    }
  } catch (error) {
    console.error('❌ Authentication system error:', {
      message: error.message,
      stack: error.stack
    });
    
    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.'
    });
  }
};

// Optional: Refresh token middleware
export const refreshTokenAuth = async (req, res, next) => {
  try {
    const refreshToken = req.cookies?.refreshToken || req.body.refreshToken;
    
    if (!refreshToken) {
      console.log('❌ No refresh token provided');
      return res.status(401).json({
        success: false,
        message: 'Refresh token required'
      });
    }

    console.log('🔄 Refresh token received');
    
    // Verify refresh token
    const decoded = jwt.verify(refreshToken, process.env.REFRESH_TOKEN_SECRET);
    
    // Find user and check if refresh token matches
    const user = await User.findOne({ 
      _id: decoded._id,
      refreshToken: refreshToken
    });
    
    if (!user) {
      console.log('❌ Invalid or expired refresh token');
      return res.status(401).json({
        success: false,
        message: 'Invalid refresh token'
      });
    }

    // Generate new access token
    const newAccessToken = user.generateAccessToken();
    
    // Attach new token and user to request
    req.newAccessToken = newAccessToken;
    req.user = user;
    
    console.log(`✅ Refresh successful for: ${user.email}`);
    next();
  } catch (error) {
    console.error('❌ Refresh token error:', error.message);
    
    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        success: false,
        message: 'Refresh token expired. Please login again.'
      });
    }
    
    res.status(401).json({
      success: false,
      message: 'Invalid refresh token'
    });
  }
};

// Role-based authorization middleware
export const authorize = (...allowedRoles) => {
  return (req, res, next) => {
    // Note: Your current User model doesn't have a 'role' field
    // Add this field to your schema if you need role-based auth
    console.log('⚠️ Role authorization middleware called, but no role field in User model');
    
    // For now, just allow all authenticated users
    // To implement roles, add role field to your User schema:
    /*
    role: {
      type: String,
      enum: ['admin', 'pharmacist', 'staff', 'manager'],
      default: 'staff'
    }
    */
    
    // Example implementation (commented out until you add role field):
    /*
    if (!allowedRoles.includes(req.user.role)) {
      console.log(`❌ Access denied. User role: ${req.user.role}, Required: ${allowedRoles}`);
      return res.status(403).json({
        success: false,
        message: 'You do not have permission to perform this action'
      });
    }
    */
    
    console.log(`✅ Authorization passed for user: ${req.user.email}`);
    next();
  };
};

// Optional: Log all requests middleware (for debugging)
export const requestLogger = (req, res, next) => {
  console.log('\n📥 Incoming Request:', {
    timestamp: new Date().toISOString(),
    method: req.method,
    url: req.originalUrl,
    ip: req.ip,
    userAgent: req.get('user-agent')
  });
  
  // Log auth headers (masked)
  const authHeader = req.header('Authorization');
  if (authHeader) {
    console.log('🔐 Auth Header:', authHeader.substring(0, 30) + '...');
  }
  
  // Log body (for non-GET requests, excluding sensitive data)
  if (req.method !== 'GET' && req.body) {
    const safeBody = { ...req.body };
    
    // Mask sensitive fields
    if (safeBody.password) safeBody.password = '***MASKED***';
    if (safeBody.token) safeBody.token = '***MASKED***';
    if (safeBody.refreshToken) safeBody.refreshToken = '***MASKED***';
    
    console.log('📝 Request Body:', JSON.stringify(safeBody, null, 2).substring(0, 500) + '...');
  }
  
  // Capture original send function
  const originalSend = res.send;
  
  // Override send to log response
  res.send = function(body) {
    console.log('📤 Response:', {
      statusCode: res.statusCode,
      contentType: res.get('Content-Type')
    });
    
    // Log response body for errors or small responses
    if (res.statusCode >= 400 || (body && body.length < 1000)) {
      try {
        const parsedBody = typeof body === 'string' ? JSON.parse(body) : body;
        console.log('📦 Response Body:', parsedBody);
      } catch (e) {
        console.log('📦 Response Body:', body?.substring(0, 500) + '...');
      }
    }
    
    originalSend.call(this, body);
  };
  
  next();
};

// Optional: Rate limiting middleware (using express-rate-limit)
import rateLimit from 'express-rate-limit';

export const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 5, // Limit each IP to 5 requests per windowMs
  message: {
    success: false,
    message: 'Too many login attempts, please try again later'
  },
  standardHeaders: true,
  legacyHeaders: false
});

// Optional: CORS middleware for authentication
export const corsWithAuth = (req, res, next) => {
  res.header('Access-Control-Allow-Origin', req.headers.origin || '*');
  res.header('Access-Control-Allow-Credentials', 'true');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, PATCH, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  
  // Handle preflight
  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }
  
  next();
};