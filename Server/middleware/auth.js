import jwt from "jsonwebtoken";
const auth = async (req, res, next) => {
  try {
    const token = req.cookies?.videoToken;
    if (!token) {
      return res
        .status(401)
        .json({ message: "Not authorized, no token, please login" });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    req.user = decoded;

    next();
  } catch (error) {
    console.error("Authentication error:", error.message);

    if (error.name === "JsonWebTokenError") {
      return res
        .status(401)
        .json({ message: "Invalid token, authorization failed" });
    } else if (error.name === "TokenExpiredError") {
      return res
        .status(401)
        .json({ message: "Token expired, please login again" });
    }

    return res.status(500).json({ message: "Internal server error" });
  }
};
export default auth;
