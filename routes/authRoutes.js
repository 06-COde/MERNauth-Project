import express from 'express';
import { isAutheticated, isPasswordReset, register, sendResetOtp, sendVerifyOtp, userLogin, userLogout, verifyEmail } from '../controllers/authController.js';
import userAuth from '../middleware/userAuth.js';
import { verifyResetOtp } from "../controllers/authController.js";

const authRouter = express.Router();

authRouter.post('/register', register);
authRouter.post('/login', userLogin);
authRouter.post('/logout', userLogout);
authRouter.post('/send-otp', userAuth, sendVerifyOtp);
authRouter.post('/verify-account', userAuth, verifyEmail); 
authRouter.get('/is-auth',userAuth, isAutheticated);
authRouter.post('/reset-otp', sendResetOtp);
authRouter.post('/reset-password', isPasswordReset);
authRouter.post('/verify-otp', verifyResetOtp);

export default authRouter;
