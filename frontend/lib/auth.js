import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key-change-this';

// Verify token and get user info
export const verifyToken = (token) => {
  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    return { success: true, user: decoded };
  } catch (error) {
    return { success: false, error: error.message };
  }
};

// Check if user is admin
export const isAdmin = (user) => {
  return user && ['admin', 'super_admin'].includes(user.role);
};

// Middleware to protect admin routes
export const requireAdmin = (handler) => {
  return async (req, context) => {
    try {
      const token = req.headers.get('authorization')?.split(' ')[1];
      
      if (!token) {
        return new Response(
          JSON.stringify({ success: false, message: 'No token provided' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      const result = verifyToken(token);
      
      if (!result.success) {
        return new Response(
          JSON.stringify({ success: false, message: 'Invalid token' }),
          { status: 401, headers: { 'Content-Type': 'application/json' } }
        );
      }

      if (!isAdmin(result.user)) {
        return new Response(
          JSON.stringify({ success: false, message: 'Admin access required' }),
          { status: 403, headers: { 'Content-Type': 'application/json' } }
        );
      }

      // Attach user to request for the handler
      req.user = result.user;
      return handler(req, context);
    } catch (error) {
      return new Response(
        JSON.stringify({ success: false, message: 'Authentication failed' }),
        { status: 500, headers: { 'Content-Type': 'application/json' } }
      );
    }
  };
};
