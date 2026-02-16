import { setToken, generateToken } from "../helper/token.js";
import { User } from "../model/user.js";

const userRegistration = async (req, res) => {
  try {
    const { username, email, ph, password, role, videoCallMinutes } = req.body;
    if (!username || !email || !ph || !password || !role || !videoCallMinutes) {
      return res.status(400).json({ message: "all fields are required" });
    }
    const existUser = await User.findOne({
      $or: [{ email: email }, { ph: ph }],
    });

    if (existUser) {
      return res.status(400).json({ message: "user already registered" });
    }
    const data = new User({
      username,
      email,
      ph,
      password,
      role,
      videoCallMinutes
    });
    await data.save();
    return res.status(200).json({ message: "User registered successful" });
  } catch (error) {
    console.log(error);
  }
};

const userLogin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.status(400).json({ message: "All fields are required" });
    }

    const existUser = await User.findOne({ email });

    if (!existUser) {
      return res.status(404).json({ message: "User not found" });
    }

    // compare plain password
    if (existUser.password !== password) {
      return res.status(401).json({ message: "Invalid password" });
    }
    const token = generateToken(existUser._id);
    setToken(res, token);
    return res.status(200).json({
      message: "User login successful",
      data: existUser,
    });
  } catch (error) {
    console.log(error);
    res.status(500).json({ message: "Server error" });
  }
};

const getUser = async (req, res) => {
  try {
    const user = req.user;
    if (!user) {
      return res.status(400).json({ message: "Please login" });
    }
    const data = await User.find({
      _id: { $ne: req.user.id }, // ❌ excludes logged-in user
    });
    return res.status(200).json({
      message: "User's  data",
      data: data,
    });
  } catch (error) {
    console.log(error);
  }
};

const userLogout = async (req, res) => {
  try {
    res.clearCookie("videoToken", {
      httpOnly: true,
      secure: false, // true in production (HTTPS)
      sameSite: "Lax",
    });

    return res.status(200).json({
      success: true,
      message: "Logout successful",
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: "Server error",
    });
  }
};

const verifyUser = async (req, res) => {
  try {
    const id = req.user.id;
    const user = await User.findOne({ _id: id });
    return res.status(200).json({ message: "User verified", data: user });
  } catch (error) {
    console.log(error);
  }
};
export { userRegistration, userLogin, getUser, userLogout, verifyUser };
