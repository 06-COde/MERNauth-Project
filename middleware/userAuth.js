import jwt from "jsonwebtoken";

const userAuth = (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized. Please log in again.",
    });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded?.id) {
      req.userId = decoded.id; // Attach user ID to request
      next(); 
      
    } else {
      return res.status(401).json({
        success: false,
        message: "Token is invalid. Please log in again.",
      });
    }
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: `Token error: ${error.message}`,
    });
  }
};

export default userAuth;
