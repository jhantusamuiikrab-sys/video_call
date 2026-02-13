import express from "express";
import { getUser, userLogin, userLogout, userRegistration, verifyUser } from "../controller/userController.js";
import auth from "../middleware/auth.js";

const router = express.Router();

router.post("/user", userRegistration);
router.post("/userlogin", userLogin);
router.get("/user",auth, getUser);
router.post("/logout",auth, userLogout);
router.post("/verifyUser",auth, verifyUser);

export default router;