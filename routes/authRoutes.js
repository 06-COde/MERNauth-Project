import express from 'express';
import { register, userLogin, userLogout } from '../controllers/authController.js';

const authRouter = express.Router();

authRouter.post('/register', register);
authRouter.post('/login', userLogin);
authRouter.post('/logout', userLogout);

export default authRouter;
