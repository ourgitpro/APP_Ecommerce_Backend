const express = require("express");
const {
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
} = require("../../controllers/userController/user");
const {
  isAuthenticatedUser,
  authorizeRoles,
} = require("../../middleware/auth/auth");
const userRoute = express.Router();
userRoute.post("/register", registerUser);
userRoute.post("/login", loginUser);
userRoute.get("/logout", logout);
userRoute.post("/forgetpassword", forgetPassword);
userRoute.put("/forgetpassword/:token", resetPassword);
userRoute.get("/me", isAuthenticatedUser, getUserDetails);
userRoute.put("/password/update", isAuthenticatedUser, updatePassword);
userRoute.put("/me/update", isAuthenticatedUser, updateProfile);
userRoute
  .route("/admin/users")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getAllUser);
userRoute
  .route("/admin/user/:id")
  .get(isAuthenticatedUser, authorizeRoles("admin"), getSingleUser)
  .put(isAuthenticatedUser, authorizeRoles("admin"), updateUserRole)
  .delete(isAuthenticatedUser, authorizeRoles("admin"), deleteUser);
module.exports = userRoute;
