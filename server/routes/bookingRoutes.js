const express = require("express");
const router = express.Router();
const {
  getAllHosts,
  createBooking,
  acceptBooking,
  rejectBooking,
  getMyBookings,
  getHostBookings,
} = require("../controllers/bookingController");
const { protect } = require("../middleware/authMiddleware");

// Get all approved hosts (requires login so we can filter out self)
router.get("/hosts", protect, getAllHosts);

// Create a booking request
router.post("/", protect, createBooking);

// Get my bookings (as requester)
router.get("/my-bookings", protect, getMyBookings);

// Get host's bookings
router.get("/host-bookings", protect, getHostBookings);

// Accept a booking
router.put("/:bookingId/accept", protect, acceptBooking);

// Reject a booking
router.put("/:bookingId/reject", protect, rejectBooking);

module.exports = router;
