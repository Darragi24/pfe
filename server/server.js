const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose");
const connectDB = require("./config/db");
const Notification = require("./models/Notification");
const { protect } = require("./middleware/authMiddleware");
// Load environment variables
dotenv.config();

// Initialize Stripe (Using the secret key from your .env)
const stripe = require("stripe")(process.env.STRIPE_SECRET_KEY);

// Import your Booking model (Make sure the path is correct)
const Booking = require("./models/Booking");

// Connect to MongoDB
connectDB();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
  cors: {
    origin: "http://localhost:3000",
    methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
    credentials: true,
  },
});

global.io = io;

// CORS configuration
app.use(cors({
  origin: "http://localhost:3000",
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"],
  credentials: true,
}));



// --- THE STRIPE WEBHOOK ROUTE ---
// NOTE: This must be registered BEFORE express.json() middleware so the raw body is preserved.
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    // Verify the event came from Stripe
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook signature verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log("💰 STRIPE SIGNAL RECEIVED for Booking:", session.metadata?.bookingId);

    // Wrap all processing in try/catch so errors don't prevent the 200 response
    // that tells Stripe the webhook was received (avoiding infinite retries).
    try {
      const booking = await Booking.findById(session.metadata?.bookingId).populate("pet");

      if (!booking) {
        console.log("❌ ERROR: Booking ID from Stripe not found in MongoDB");
        // Still respond 200 so Stripe doesn't retry for a booking that doesn't exist.
        return res.json({ received: true });
      }

      // 1. Update booking status and record payment timestamp
      booking.status = "completed";
      booking.paidAt = new Date();
      await booking.save();

      // 2. Notification for the owner (the one who paid)
      //    FIX: was incorrectly using 'recipient' — Notification schema requires 'user'
      const senderNote = await new Notification({
        user: booking.requester,
        message: `Your payment of $${booking.totalPrice} for ${booking.pet?.name || "the stay"} was successful!`,
        type: "payment_success",
        data: {
          bookingId: booking._id,
          totalPrice: booking.totalPrice,
        },
      }).save();

      // 3. Notification for the host (the one who received payment)
      //    FIX: was incorrectly using 'recipient' — Notification schema requires 'user'
      const receiverNote = await new Notification({
        user: booking.host,
        message: `You received $${booking.totalPrice} for the stay of ${booking.pet?.name || "a pet"}.`,
        type: "payment_received",
        data: {
          bookingId: booking._id,
          totalPrice: booking.totalPrice,
        },
      }).save();

      // 4. Send real-time updates via Socket.IO
      if (global.io) {
        global.io.to(`user-${booking.requester}`).emit("new-notification", senderNote);
        global.io.to(`user-${booking.host}`).emit("new-notification", receiverNote);
        // Emit booking-updated so the Bookings and History pages refresh in real time
        const updatePayload = { bookingId: booking._id, status: "completed" };
        global.io.to(`user-${booking.requester}`).emit("booking-updated", updatePayload);
        global.io.to(`user-${booking.host}`).emit("booking-updated", updatePayload);
      }

      console.log(`✅ Payment processed and notifications sent for Booking: ${booking._id}`);
    } catch (err) {
      console.error("Error processing payment webhook:", err);
      // Return 500 so Stripe knows to retry — the booking may not have been saved yet.
      return res.status(500).json({ error: "Internal error processing payment" });
    }
  }

  res.json({ received: true });
});

// --- 2. REGULAR MIDDLEWARE ---
app.use(express.json()); // Now we can parse JSON for other routes
app.use("/uploads", express.static(path.join(__dirname, "uploads")));

// --- 3. ROUTES ---
app.use("/api/auth", require("./routes/authRoutes"));
app.use("/api/pets", require("./routes/petRoutes"));
app.use("/api/notifications", require("./routes/notificationRoutes"));
app.use("/api/bookings", require("./routes/bookingRoutes"));
app.use("/api/messages", require("./routes/messageRoutes"));

// --- 4. THE PAYMENT SESSION ROUTE ---
// FIX: Added 'protect' middleware so only authenticated users can create sessions.
app.post("/api/payments/create-session", protect, async (req, res) => {
  const { bookingId } = req.body;
  try {
    const booking = await Booking.findById(bookingId).populate("pet");
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    // FIX: Ensure only the booking's requester can initiate payment (authorization check).
    if (booking.requester.toString() !== req.user.id) {
      return res.status(403).json({ error: "Not authorized to pay for this booking" });
    }

    // FIX: Only allow payment for bookings that have been accepted (not pending/completed/rejected).
    if (booking.status !== "accepted") {
      return res.status(400).json({ error: `Cannot pay for a booking with status: ${booking.status}` });
    }

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: `PetStay: ${booking.pet.name}` },
          unit_amount: Math.round(booking.totalPrice * 100), // in cents
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url: "http://localhost:3000/payments?payment=success",
      cancel_url: "http://localhost:3000/payments?payment=cancel",
      metadata: { bookingId: booking._id.toString() },
    });

    res.json({ url: session.url });
  } catch (err) {
    console.error("Stripe Session Error:", err.message);
    res.status(500).json({ error: err.message });
  }
});

app.get("/", (req, res) => res.send("API is running..."));

// Socket.IO connection handler
io.on("connection", (socket) => {
  console.log("User connected:", socket.id);

  // Join a personal room so the server can send targeted notifications
  socket.on("join-user", (userId) => {
    socket.join(`user-${userId}`);
    console.log(`Socket ${socket.id} joined room: user-${userId}`);
  });

  // FIX: Handle the admin room join that SocketContext.js emits for admin users.
  // Previously this event was emitted by clients but never handled server-side.
  socket.on("join-admin", (userId) => {
    socket.join("admin");
    socket.join(`user-${userId}`); // also join personal room
    console.log(`Socket ${socket.id} joined admin room (userId: ${userId})`);
  });

  socket.on("disconnect", () => console.log("User disconnected:", socket.id));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));