import jwt from "jsonwebtoken";

export const authenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({
        success: false,
        message: "Authentication required",
      });
    }

    const [scheme, token] = authHeader.split(" ");

    if (scheme !== "Bearer" || !token) {
      return res.status(401).json({
        success: false,
        message: "Invalid authorization format",
      });
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = {
      id: decoded.userId,
    };

    next();
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Invalid or expired token",
    });
  }
};

export const optionalAuthenticate = (req, res, next) => {
  try {
    const authHeader = req.headers.authorization;

    // No token = anonymous user
    if (!authHeader) {
      return next();
    }

    const [scheme, token] = authHeader.split(" ");

    // Invalid/missing token = treat as anonymous
    if (scheme !== "Bearer" || !token) {
      return next();
    }

    const decoded = jwt.verify(
      token,
      process.env.JWT_SECRET
    );

    req.user = {
      id: decoded.userId,
    };

    next();
  } catch (error) {
    // Invalid/expired token should not block public video viewing
    next();
  }
};