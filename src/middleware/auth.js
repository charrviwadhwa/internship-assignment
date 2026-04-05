import jwt from "jsonwebtoken";

export const authorize = (allowedRoles) => {
  return (req, res, next) => {
    const token = req.headers.authorization?.split(" ")[1];
    
    if (!token) return res.status(401).json({ error: "Unauthorized: No token provided" });

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      req.user = decoded;

      if (!allowedRoles.includes(decoded.role)) {
        return res.status(403).json({ error: "Forbidden: You do not have permission" });
      }
      next();
    } catch (err) {
      res.status(401).json({ error: "Invalid or expired token" });
    }
  };
};
