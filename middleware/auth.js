// AUTH SYSTEM REMOVED - EVERYONE IS ADMIN BY DEFAULT
export const protect = (req, res, next) => {
  // Injecting default Admin session
  req.user = {
    id: "69b3b15231109afc1b41d619",
    role: "admin",
    name: "Temple Admin",
    displayName: "Temple Admin"
  };

  next();
};

export const requireRole = (...roles) => (req, res, next) => {
  // Always allow
  next();
};

