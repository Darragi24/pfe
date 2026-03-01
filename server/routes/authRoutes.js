const express = require("express");
const router = express.Router();

const {
  register,
  login,
  getMe,
  applyForHost,
  approveHost,
  rejectHost,
  updateName,
  updatePhone,
  updateBio,
  updateProfilePic,
  uploadMiddleware,
  // admin
  getAllUsers,
  getAllHosts,
  deactivateHost,
  deactivateUser,
  activateUser,
} = require("../controllers/authController");

const { protect } = require("../middleware/authMiddleware");

// ---------------- AUTH ----------------

// Register (with profile pic)
router.post("/register", uploadMiddleware, register);

// Login
router.post("/login", login);

// Get current user
router.get("/me", protect, getMe);

// ---------------- PROFILE UPDATES ----------------

router.put("/update-name", protect, updateName);
router.put("/update-phone", protect, updatePhone);
router.put("/update-bio", protect, updateBio);
router.put(
  "/update-profile-pic",
  protect,
  uploadMiddleware,
  updateProfilePic
);

// ---------------- HOST SYSTEM ----------------

// Apply to become host
router.post("/apply-host", protect, applyForHost);

// Admin approve host
router.put("/approve-host/:userId", protect, approveHost);

// Admin reject host
router.put("/reject-host/:userId", protect, rejectHost);

// ---------- ADMIN ENDPOINTS ----------
// List all users
router.get("/users", protect, getAllUsers);
// List only hosts
router.get("/hosts", protect, getAllHosts);
// Deactivate a host
router.put("/deactivate-host/:userId", protect, deactivateHost);
// Deactivate a user
router.put("/deactivate-user/:userId", protect, deactivateUser);
// Activate a user
router.put("/activate-user/:userId", protect, activateUser);

module.exports = router;