const Booking = require("../models/Booking");
const User = require("../models/User");
const Notification = require("../models/Notification");

// Get all approved hosts for find-host page (with filtering)
exports.getAllHosts = async (req, res) => {
  try {
    const { petType, maxPrice, experience } = req.query;

    // build filter
    const filter = {
      roles: { $in: ["host"] },
      isActive: true,
      "hostApplication.status": "approved",
    };

    if (petType) {
      filter["hostApplication.preferredPets"] = { $in: [petType] };
    }

    if (maxPrice) {
      filter["hostApplication.pricePerNight"] = { $lte: Number(maxPrice) };
    }

    if (experience) {
      filter["hostApplication.experience"] = { $regex: experience, $options: "i" };
    }

    // exclude the requester so they don't see themselves
    if (req.user && req.user.id) {
      filter._id = { $ne: req.user.id };
    }

    console.log("Filter applied:", JSON.stringify(filter));
    const hosts = await User.find(filter)
      .select("-password")
      .lean();

    console.log(`Found ${hosts.length} hosts matching filter`);
    res.json(hosts);
  } catch (error) {
    console.error("getAllHosts error:", error);
    res.status(500).json({ message: error.message });
  }
};

// Create a booking request
exports.createBooking = async (req, res) => {
  try {
    const { hostId, petId, startDate, endDate, specialRequests } = req.body;
    const requesterId = req.user.id;

    // Validate host exists and is active
    const host = await User.findById(hostId);
    if (!host) return res.status(404).json({ message: "Host not found" });
    if (!host.isActive) {
      return res.status(400).json({ message: "Host account is deactivated" });
    }
    if (host.hostApplication?.status !== "approved") {
      return res.status(400).json({ message: "Host is not approved" });
    }

    // Calculate total price
    const start = new Date(startDate);
    const end = new Date(endDate);

    // Ensure end date is not before start date
    if (end < start) {
      return res
        .status(400)
        .json({ message: "End date must be on or after start date" });
    }

    const diffMs = end - start;
    const dayMs = 1000 * 60 * 60 * 24;
    // If start === end, this should count as 1 night (not 0)
    const rawNights = Math.ceil(diffMs / dayMs);
    const nights = Math.max(1, rawNights);

    const totalPrice = nights * host.hostApplication.pricePerNight;

    // Create booking
    const booking = await Booking.create({
      requester: requesterId,
      host: hostId,
      pet: petId,
      startDate,
      endDate,
      totalPrice,
      specialRequests,
      status: "pending",
    });

    // Friendly summary for host
    const startLabel = start.toLocaleDateString();
    const endLabel = end.toLocaleDateString();

    // Notify host
    const notification = await Notification.create({
      user: hostId,
      message: `New booking request from ${req.user.name} (${startLabel} - ${endLabel}, total $${totalPrice})`,
      type: "booking_request",
      data: {
        bookingId: booking._id,
        requesterId: req.user.id,
        requesterName: req.user.name,
        petId,
        startDate,
        endDate,
        totalPrice,
      },
    }).catch(console.error);

    // Emit via WebSocket to host
    if (global.io) {
      global.io.to(`user-${hostId}`).emit("new-notification", {
        _id: notification?._id || "temp-" + Date.now(),
        message: `New booking request from ${req.user.name} (${startLabel} - ${endLabel}, total $${totalPrice})`,
        type: "booking_request",
        data: {
          bookingId: booking._id,
          requesterId: req.user.id,
          requesterName: req.user.name,
          petId,
          startDate,
          endDate,
          totalPrice,
        },
        createdAt: new Date(),
        read: false,
      });
    }

    res.json({ message: "Booking request created", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Host accepts a booking
exports.acceptBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const hostId = req.user.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.host.toString() !== hostId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    booking.status = "accepted";
    booking.acceptedAt = new Date();
    await booking.save();

    const startLabel = booking.startDate.toLocaleDateString();
    const endLabel = booking.endDate.toLocaleDateString();

    // Notify requester
    const requesterNotif = await Notification.create({
      user: booking.requester,
      message: `Your booking from ${startLabel} to ${endLabel} has been accepted!`,
      type: "booking_accepted",
      data: {
        bookingId: booking._id,
        startDate: booking.startDate,
        endDate: booking.endDate,
        totalPrice: booking.totalPrice,
      },
    }).catch(console.error);

    // Emit to requester
    if (global.io) {
      global.io.to(`user-${booking.requester}`).emit("new-notification", {
        _id: requesterNotif?._id || "temp-" + Date.now(),
        message: `Your booking from ${startLabel} to ${endLabel} has been accepted!`,
        type: "booking_accepted",
        data: {
          bookingId: booking._id,
          startDate: booking.startDate,
          endDate: booking.endDate,
          totalPrice: booking.totalPrice,
        },
        createdAt: new Date(),
        read: false,
      });
    }

    res.json({ message: "Booking accepted", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Host rejects a booking
exports.rejectBooking = async (req, res) => {
  try {
    const { bookingId } = req.params;
    const hostId = req.user.id;

    const booking = await Booking.findById(bookingId);
    if (!booking) return res.status(404).json({ message: "Booking not found" });
    if (booking.host.toString() !== hostId) {
      return res.status(403).json({ message: "Not authorized" });
    }

    booking.status = "rejected";
    booking.rejectedAt = new Date();
    await booking.save();

    const startLabel = booking.startDate.toLocaleDateString();
    const endLabel = booking.endDate.toLocaleDateString();

    // Notify requester
    const requesterNotif = await Notification.create({
      user: booking.requester,
      message: `Your booking from ${startLabel} to ${endLabel} was declined`,
      type: "booking_rejected",
      data: {
        bookingId: booking._id,
        startDate: booking.startDate,
        endDate: booking.endDate,
        totalPrice: booking.totalPrice,
      },
    }).catch(console.error);

    if (global.io) {
      global.io.to(`user-${booking.requester}`).emit("new-notification", {
        _id: requesterNotif?._id || "temp-" + Date.now(),
        message: `Your booking from ${startLabel} to ${endLabel} was declined`,
        type: "booking_rejected",
        data: {
          bookingId: booking._id,
          startDate: booking.startDate,
          endDate: booking.endDate,
          totalPrice: booking.totalPrice,
        },
        createdAt: new Date(),
        read: false,
      });
    }

    res.json({ message: "Booking rejected", booking });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get user's bookings (as requester)
exports.getMyBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ requester: req.user.id })
      .populate("host", "name email hostApplication profilePic")
      .populate("pet", "name breed")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get bookings for a host
exports.getHostBookings = async (req, res) => {
  try {
    const bookings = await Booking.find({ host: req.user.id })
      .populate("requester", "name email profilePic")
      .populate("pet", "name breed")
      .sort({ createdAt: -1 });
    res.json(bookings);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};
