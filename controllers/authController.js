import bcrypt from 'bcrypt';
import jwt from 'jsonwebtoken';
import userModal from '../modals/userModals.js';
import transporter from '../config/nodeMailer.js';


// Register Controller
export const register = async (req, res) => {
  const { name, email, password } = req.body;

  if (!name || !email || !password) {
    return res.status(400).json({ success: false, message: "All fields are required." });
  }
  try {
    const existingUser = await userModal.findOne({ email });
    if (existingUser) {
      return res.status(409).json({ success: false, message: "User already exists." });
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    const newUser = new userModal({ name, email, password: hashedPassword });
    await newUser.save();

    const token = jwt.sign({ id: newUser._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'None' : 'Lax',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    const mailOptions = {
      from: process.env.SENDER_EMAIL,
      to: email,
      subject: '🎉 Welcome to GreatStack!',
      text: `Welcome to GreatStack! Your account has been created with this email: ${email}.`,
      html: `<h2>Welcome to <strong>GreatStack</strong>!</h2>
             <p>Your account has been created with the email: <strong>${email}</strong>.</p>`
    };

    try {
      const mailResponse = await transporter.sendMail(mailOptions);
      console.log("✅ Email sent successfully:", mailResponse.response);
    } catch (mailErr) {
      console.error("❌ Email sending failed:", mailErr.message);
    }

    return res.status(201).json({
      success: true,
      message: "User registered successfully.",
      user: {
        id: newUser._id,
        name: newUser.name,
        email: newUser.email
      }
    });

  } catch (error) {
    console.error("❌ Registration Error:", error.message);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};


// Login Controller

export const userLogin = async (req, res) => {
  const { email, password } = req.body;

  if (!email || !password) {
    return res.status(400).json({ success: false, message: "Email and password are required." });
  }

  try {
    const user = await userModal.findOne({ email });
    if (!user) {
      return res.status(401).json({ success: false, message: "Invalid email " });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({ success: false, message: "Invalid password" });
    }

    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: '7d' });

    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    return res.status(200).json({
      success: true,
      message: "User logged in successfully.",
      user: {
        id: user._id,
        name: user.name,
        email: user.email
      }
    });

  } catch (error) {
    console.error("Login Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};


// Logout Controller

export const userLogout = async (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'none' : 'strict',
    });

    return res.status(200).json({ success: true, message: "User logged out successfully." });
  } catch (error) {
    console.error("Logout Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

//OTP verify

export const sendVerifyOtp = async (req, res) => {
  try {
    // Get userId from the auth middleware, not from req.body
    const userId = req.userId;
    const user = await userModal.findById(userId);

    if (user.isAccountVerified) {
      return res.json({ success: false, message: 'Account already verified.' });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));
    user.verifyotp = otp;
    user.verifyotpExpireat = Date.now() + 24 * 60 * 60 * 1000;
    await user.save();

    const mailOption = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: '🛡️ Account Verification OTP',
      text: `Your OTP is ${otp}. Use it to verify your account.`,
      html: `<p><strong>Your OTP is:</strong> ${otp}</p><p>This is valid for 24 hours.</p>`,
    };

    const result = await transporter.sendMail(mailOption);
    console.log("✅ OTP Mail sent:", result);

    return res.status(200).json({ success: true, message: "OTP sent to email." });
  } catch (error) {
    console.error("❌ OTP Mail Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

//Email Verification

export const verifyEmail = async (req, res) => {
  const userId = req.userId; // 🟢 Comes from JWT middleware
  const { otp } = req.body;

  if (!otp) {
    return res.status(400).json({ success: false, message: "OTP is required." });
  }

  try {
    const user = await userModal.findById(userId);
    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found ❌' });
    }

    if (user.verifyotp === '' || user.verifyotp !== otp) {
      return res.status(400).json({ success: false, message: 'Invalid OTP' });
    }

    if (user.verifyotpExpireat < Date.now()) {
      return res.status(400).json({ success: false, message: 'OTP Expired' });
    }

    user.isAccountVerified = true;
    user.verifyotp = '';
    user.verifyotpExpireat = 0;
    await user.save();

    return res.status(200).json({ success: true, message: 'Email verified ✅' });

  } catch (error) {
    console.error("❌ OTP Verification Error:", error);
    return res.status(500).json({ success: false, message: "Internal server error." });
  }
};

//User authenticated

export const isAutheticated = async (req,res) =>{
    try{
      return res.json({success: true})
    }catch(error){
        console.log(error,"Something went wrong ❌")
        return res.json({success : false, message: `${error} Invalid details`})
    }
}


//reset otp

export const sendResetOtp = async (req, res) => {
  const { email } = req.body;

  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required.' });
  }

  try {
    const user = await userModal.findOne({ email });

    if (!user) {
      return res.status(404).json({ success: false, message: 'User not found!' });
    }

    const otp = String(Math.floor(100000 + Math.random() * 900000));

    // ✅ Store OTP in correct fields
    user.resetOtp = otp;
    user.resetOtpExpireat = Date.now() + 15 * 60 * 1000; // 15 minutes validity
    await user.save();

    const mailOption = {
      from: process.env.SENDER_EMAIL,
      to: user.email,
      subject: '🔒 Password Reset OTP',
      text: `Your OTP is ${otp}. Use it to reset your password.`,
      html: `<p><strong>Your OTP is:</strong> ${otp}</p><p>This OTP is valid for 15 minutes.</p>`,
    };

    const result = await transporter.sendMail(mailOption);
    console.log("✅ Password Reset OTP sent:", result);

    return res.status(200).json({ success: true, message: 'OTP sent to your email address.' });

  } catch (error) {
    console.error("❌ OTP Send Error:", error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong while sending OTP. Please try again later.',
    });
  }
};


//Reset Password

export const isPasswordReset = async (req, res) => {
  const { email, otp, newPassword } = req.body;

  if (!email || !otp || !newPassword) {
    return res.json({
      success: false,
      message: 'Details {email, otp, password} required!',
    });
  }

  try {
    const user = await userModal.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: 'User not found❌' });
    }

    const trimmedOtp = otp.trim(); // 💡 Trim OTP to handle accidental spaces

    if (user.resetOtp === '' || user.resetOtp !== trimmedOtp) {
      return res.json({ success: false, message: 'Invalid Otp' });
    }

    if (user.resetOtpExpireat < Date.now()) {
      return res.json({ success: false, message: 'OTP Expired' });
    }

    const hashedPassword = await bcrypt.hash(newPassword, 10);
    user.password = hashedPassword;
    user.resetOtp = '';
    user.resetOtpExpireat = 0;

    await user.save();

    return res.json({
      success: true,
      message: 'Password has been successfully reset ✅',
    });

  } catch (error) {
    console.error("❌ Password Reset Error:", error);
    return res.status(500).json({
      success: false,
      message: 'Something went wrong. Please try again later.',
    });
  }
};
