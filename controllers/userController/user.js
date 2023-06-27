const User = require("../../models/user/user");
const ErrorHandler = require("../../utilss/utils/error");
const CatchError = require("../../middleware/catchError/catchError");
const sendToken = require("../../utilss/jwtToken/jwtToken");
const sendEmail = require("../../utilss/sendMail/sendMail");
const crypto = require("crypto");
const cloudinary = require("cloudinary");
/*const registerUser = CatchError(async (req, res, next) => {
  const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
    folder: "avatars",
    width: 150,
    crop: "scale",
  });
  const { name, email, password } = req.body;
  const user = await User.create({
    name,
    email,
    password,
    avatar: {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    },
  });
  sendToken(user, 201, res);
});*/
const registerUser = CatchError(async (req, res, next) => {
  try {
    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
      folder: "avatars",
      width: 150,
      crop: "scale",
    });

    console.log("myCloud:", myCloud);

    if (!myCloud || !myCloud.secure_url) {
      throw new Error("Unable to upload avatar to Cloudinary");
    }

    const { name, email, password } = req.body;

    const user = await User.create({
      name,
      email,
      password,
      avatar: {
        public_id: myCloud.public_id || "",
        url: myCloud.secure_url || "",
      },
    });

    sendToken(user, 201, res);
  } catch (error) {
    console.error(error);
    // Handle the error and send an appropriate response
    res.status(500).json({ error: "Internal Server Error" });
  }
});

//Login User
const loginUser = CatchError(async (req, res, next) => {
  const { email, password } = req.body;
  if (!email || !password) {
    return res
      .status(400)
      .json({ success: false, msg: "Enter Your Mail And Password" });
  }
  const user = await User.findOne({ email }).select("+password");
  if (!user) {
    return res
      .status(401)
      .json({ success: false, msg: "Invalid Mail And Password" });
  }

  const isPasswordMatched = await user.comparePassword(password);

  if (!isPasswordMatched) {
    return res
      .status(401)
      .json({ success: false, msg: "Invalid Mail and Password" });
  }
  sendToken(user, 200, res);
});
// Logout User
const logout = CatchError(async (req, res, next) => {
  res.cookie("token", null, {
    expires: new Date(Date.now()),
    httpOnly: true,
  });

  res.status(200).json({
    success: true,
    message: "Logged Out",
  });
});
// Forgot Password
const forgetPassword = CatchError(async (req, res, next) => {
  const user = await User.findOne({ email: req.body.email });
  if (!user) {
    return res.status(404).json({ success: false, msg: "User Not Found" });
  }
  // Get ResetPassword Token
  const resetToken = await user.getResetPasswordToken();

  await user.save({ validateBeforeSave: false });
  const resetPasswordUrl = `${process.env.FRONTEND_URL}/password/reset/${resetToken}`;
  const message = `Your password reset token is temp :- \n\n ${resetPasswordUrl} \n\nIf you have not requested this email then, please ignore it.`;
  try {
    await sendEmail({
      email: user.email,
      subject: `Ecommerce Password Recovery`,
      message,
    });

    res.status(200).json({
      success: true,
      message: `Email sent to ${user.email} successfully`,
    });
  } catch (error) {
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;

    await user.save({ validateBeforeSave: false });

    return res.status(500).json({ success: false, msg: "mail not send" });
  }
});
// Reset Password
const resetPassword = CatchError(async (req, res, next) => {
  // creating token hash
  //const { token, password } = req.body;
  const resetPasswordToken = crypto
    .createHash("sha256")
    .update(req.params.token)
    .digest("hex");

  const user = await User.findOne({
    resetPasswordToken,
    resetPasswordExpire: { $gt: Date.now() },
  });

  if (!user) {
    return res.status(400).json({ success: false, msg: "User Not Found" });
  }

  if (req.body.password !== req.body.confirmPassword) {
    return res.status(400).json({ success: false, msg: "User Not Found" });
  }

  user.password = req.body.password;
  user.resetPasswordToken = undefined;
  user.resetPasswordExpire = undefined;

  await user.save();

  sendToken(user, 200, res);
});
// Get User Detail
const getUserDetails = CatchError(async (req, res, next) => {
  const user = await User.findById(req.user.id);

  res.status(200).json({
    success: true,
    user,
  });
});
// update User password
const updatePassword = CatchError(async (req, res, next) => {
  const user = await User.findById(req.user.id).select("+password");

  const isPasswordMatched = await user.comparePassword(req.body.oldPassword);

  if (!isPasswordMatched) {
    return res
      .status(400)
      .json({ success: false, msg: "Old Password Is Incorrect" });
  }

  if (req.body.newPassword !== req.body.confirmPassword) {
    return res
      .status(400)
      .json({ success: false, msg: "Password Dosn't Match" });
  }

  user.password = req.body.newPassword;

  await user.save();

  sendToken(user, 200, res);
});
// update User Profile
/*const updateProfile = CatchError(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
  };
  
  const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
    user,
  });
});*/
const updateProfile = CatchError(async (req, res, next) => {
  try {
    // Find the current user
    const userId = await User.findById(req.params.id);

    if (!userId) {
      // User not found
      return res
        .status(404)
        .json({ success: false, message: "User not found" });
    }

    // Build the data object
    const data = {
      name: req.body.name,
      email: req.body.email,
    };

    // Modify image conditionally
    if (req.body.avatar) {
      const imgId = userId.avatar?.public_id; // Check if userId.avatar exists before accessing properties
      if (imgId) {
        await cloudinary.v2.uploader.destroy(imgId);
      }

      const newImage = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: "avatars",
        width: 150,
        crop: "scale",
      });

      data.avatar = {
        public_id: newImage.public_id,
        url: newImage.secure_url,
      };
    }

    const userUpdate = await User.findByIdAndUpdate(req.params.id, data, {
      new: true,
    });

    res.status(200).json({
      success: true,
      userUpdate,
    });
  } catch (error) {
    console.log(error);
    return res
      .status(500)
      .json({ success: false, message: "Internal Server Error" });
  }
});

// Get all users(admin)
const getAllUser = CatchError(async (req, res, next) => {
  const users = await User.find();

  res.status(200).json({
    success: true,
    users,
  });
});

// Get single user (admin)
const getSingleUser = CatchError(async (req, res, next) => {
  const user = await User.findById(req.params.id);

  if (!user) {
    return res.status(400).json({
      success: false,
      msg: `User does not exist with Id: ${req.params.id}`,
    });
  }
  //`User does not exist with Id: ${req.params.id}`
  res.status(200).json({
    success: true,
    user,
  });
});
// update User Role -- Admin
const updateUserRole = CatchError(async (req, res, next) => {
  const newUserData = {
    name: req.body.name,
    email: req.body.email,
    role: req.body.role,
  };

  await User.findByIdAndUpdate(req.params.id, newUserData, {
    new: true,
    runValidators: true,
    useFindAndModify: false,
  });

  res.status(200).json({
    success: true,
  });
});
// Delete User --Admin
const deleteUser = CatchError(async (req, res, next) => {
  //const user = await User.findByIdAndDelete(req.params.id);

  //if (!user) {
  //`User does not exist with Id: ${req.params.id}`
  // return res.status(400).json({
  // success: false,
  //  msg: `User does not exist with Id: ${req.params.id}`,
  //});
  // }

  //await user.remove();

  // res.status(200).json({
  //  success: true,
  //  message: "User Deleted Successfully",
  // });
  const { id } = req.params;

  try {
    const deleteUser = await User.findByIdAndDelete(id);
    res.json(deleteUser);
  } catch (error) {
    console.error(error.message);
    res.status(500).json({ errors: "Internal Server Error" });
  }
});

module.exports = {
  registerUser,
  loginUser,
  logout,
  forgetPassword,
  resetPassword,
  getUserDetails,
  updatePassword,
  updateProfile,
  getAllUser,
  getSingleUser,
  updateUserRole,
  deleteUser,
};
/*
  if (req.body.avatar !== "") {
    const user = await User.findById(req.user.id);

    const imageId = user.avatar.public_id;

    await cloudinary.v2.uploader.destroy(imageId);

    const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
      folder: "avatars",
      width: 150,
      crop: "scale",
    });

    newUserData.avatar = {
      public_id: myCloud.public_id,
      url: myCloud.secure_url,
    };
  }

*/
//const newUserData = {
// name: req.body.name,
// email: req.body.email,
//};

//const user = await User.findByIdAndUpdate(req.user.id, newUserData, {
// new: true,
// runValidators: true,
// useFindAndModify: false,
//});

//res.status(200).json({
// success: true,
// user: user.toJSON(),
//});
