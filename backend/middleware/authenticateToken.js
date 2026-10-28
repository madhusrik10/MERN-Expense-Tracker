import jwt from "jsonwebtoken";

const TOKEN_ISSUER = "pennybloom";

export const signAuthToken = (userId) => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    return null;
  }

  return jwt.sign({ sub: userId }, secret, {
    expiresIn: "7d",
    issuer: TOKEN_ISSUER,
  });
};

const authenticateToken = (req, res, next) => {
  const secret = process.env.JWT_SECRET;
  if (!secret || secret.length < 32) {
    return res.status(503).json({
      success: false,
      code: "AUTH_NOT_CONFIGURED",
      message: "Authentication is temporarily unavailable.",
    });
  }

  const authorization = req.headers.authorization || "";
  const [scheme, token] = authorization.split(" ");
  if (scheme !== "Bearer" || !token) {
    return res.status(401).json({
      success: false,
      code: "UNAUTHENTICATED",
      message: "Please sign in to generate financial insights.",
    });
  }

  try {
    const payload = jwt.verify(token, secret, { issuer: TOKEN_ISSUER });
    if (typeof payload !== "object" || typeof payload.sub !== "string") {
      return res.status(401).json({
        success: false,
        code: "UNAUTHENTICATED",
        message: "Please sign in again to continue.",
      });
    }

    req.authenticatedUserId = payload.sub;
    return next();
  } catch {
    return res.status(401).json({
      success: false,
      code: "UNAUTHENTICATED",
      message: "Please sign in again to continue.",
    });
  }
};

export default authenticateToken;
