const ErrorHandler = require("../../utilss/utils/error");
const CatchError = require("../../middleware/catchError/catchError");
const jwt = require("jsonwebtoken");
const User = require("../../models/user/user");

const isAuthenticatedUser = CatchError(async (req, res, next) => {
  const { token } = req.cookies;

  if (!token) {
    return res
      .status(401)
      .json({ success: false, msg: "Please Login to access this resource" });
  }

  const decodedData = jwt.verify(token, process.env.JWT_SECRET);

  req.user = await User.findById(decodedData.id);

  next();
});
const authorizeRoles = (...roles) => {
  return (req, res, next) => {
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        msg: ` Role: ${req.user.role} is not allowed to access this resouce `,
      });
    }

    next();
  };
};
//`Role: ${req.user.role} is not allowed to access this resouce `
module.exports = {
  isAuthenticatedUser,
  authorizeRoles,
};
