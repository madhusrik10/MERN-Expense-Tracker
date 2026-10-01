import express from 'express';
import { loginControllers, registerControllers, setAvatarController, forgotPasswordController } from '../controllers/userController.js';

const router = express.Router();

router.route("/register").post(registerControllers);

router.route("/login").post(loginControllers);

router.route("/forgotPassword").post(forgotPasswordController);

router.route("/setAvatar/:id").post(setAvatarController);

export default router;