const express = require("express");
const router = express.Router();

// Import controller functions and multer middleware
const {
  createPet,
  getMyPets,
  updatePet,       // ✅ import updatePet
  deletePet,
  uploadMiddleware,
} = require("../controllers/petController");

// Import auth middleware
const { protect } = require("../middleware/authMiddleware");

// ===== Routes =====

// Create a new pet with image upload
router.post("/", protect, uploadMiddleware, createPet);

// Get all pets for the logged-in user
router.get("/", protect, getMyPets);

// Update a pet by ID
router.put("/:id", protect, uploadMiddleware, updatePet); // ✅ new route

// Delete a pet by ID
router.delete("/:id", protect, deletePet);

module.exports = router;