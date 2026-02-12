import jwt from "jsonwebtoken";
import "dotenv/config";
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, { expiresIn: "30d" });
};

const setToken = (res, token) => {
  res.cookie("videoToken", token, {
    httpOnly: true,
    secure: true, 
    sameSite: "None",
    maxAge: 30 * 24 * 60 * 60 * 1000,
  });
};

export { generateToken, setToken };
