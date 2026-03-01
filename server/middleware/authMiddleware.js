const jwt = require("jsonwebtoken");
const User = require("../models/User");

// Protect route
exports.protect = async (req, res, next) => {
  let token;

  if (req.headers.authorization && req.headers.authorization.startsWith("Bearer ")) {
    token = req.headers.authorization.split(" ")[1];
  }

  if (!token) return res.status(401).json({ message: "Not authorized, token missing" });

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (!decoded.id || !decoded.roles) return res.status(401).json({ message: "Token invalid" });

    // Check if user is still active and attach basic info to req.user
    const user = await User.findById(decoded.id);
    if (!user) return res.status(401).json({ message: "User not found" });
    if (!user.isActive) {
      return res.status(403).json({ message: "Your account has been deactivated. Contact support." });
    }

    // expose a safe, minimal user object for downstream handlers
    req.user = {
      id: user._id.toString(),
      roles: user.roles,
      name: user.name,
      email: user.email,
    };
    next();
  } catch (error) {
    console.error("JWT Error:", error.message);
    return res.status(401).json({ message: "Token invalid or expired" });
  }
};

// Role authorization
exports.authorize = (...allowedRoles) => {
  return (req, res, next) => {
    if (!req.user || !Array.isArray(req.user.roles)) {
      return res.status(403).json({ message: "Access denied" });
    }

    const hasRole = allowedRoles.some((role) => req.user.roles.includes(role));
    if (!hasRole) return res.status(403).json({ message: "Access denied: insufficient role" });

    next();
  };
};