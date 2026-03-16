const jwt = require("jsonwebtoken");

const authenticateJWT = (req, res, next) => {
  try {
    const tokenHeader = req.headers.token;
    const authHeader = req.headers.authorization;
    const bearerToken =
      authHeader && authHeader.startsWith("Bearer ")
        ? authHeader.split(" ")[1]
        : null;
    const token = tokenHeader || bearerToken;

    if (!token) {
      return res.status(401).json({ error: "Token no proporcionado" });
    }
    const jwtSecret = process.env.JWT_SECRET;

    if (!jwtSecret) {
      return res.status(500).json({ error: "JWT_SECRET no configurado" });
    }

    const decoded = jwt.verify(token, jwtSecret);
    req.user = decoded;

    return next();
  } catch (error) {
    return res.status(401).json({ error: "Token inválido o expirado" });
  }
};

const authorizeAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({ error: "Usuario no autenticado" });
  }

  if (req.user.role !== "ADMIN") {
    return res.status(403).json({ error: "Acceso solo para ADMIN" });
  }

  return next();
};

module.exports = {
  authenticateJWT,
  authorizeAdmin,
};
