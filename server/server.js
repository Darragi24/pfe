const express = require("express");
const http = require("http");
const { Server } = require("socket.io");
const dotenv = require("dotenv");
const cors = require("cors");
const path = require("path");
const mongoose = require("mongoose"); // Added
const connectDB = require("./config/db");
const Notification = require("./models/Notification"); // <--- ADD THIS LINE
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
app.post("/api/payments/webhook", express.raw({ type: "application/json" }), async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    // Verify the event came from Stripe
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    console.error("Webhook Error:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // --- PASTE YOUR CODE STARTING HERE ---
  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    console.log("💰 STRIPE SIGNAL RECEIVED for Booking:", session.metadata.bookingId); // ADD THIS
    // 1. Update the Booking (Populate pet to get the name for the message)
    const booking = await Booking.findById(session.metadata.bookingId).populate('pet');
    if (!booking) {
    console.log("❌ ERROR: Booking ID from Stripe not found in MongoDB"); // ADD THIS
    return res.status(404).json({ error: "Not found" });
  }
    if (booking) {
      booking.status = "completed"; 
      await booking.save();

      // 2. Notification for SENDER (The one who paid - Owner)
      const senderNote = new Notification({
        recipient: booking.requester,
        message: `Your payment of $${booking.totalPrice} for ${booking.pet?.name || 'the stay'} was successful!`,
        type: "payment_success", 
        data: { 
          bookingId: booking._id,
          totalPrice: booking.totalPrice 
        }
      });
      await senderNote.save();

      // 3. Notification for RECEIVER (The Host)
      const receiverNote = new Notification({
        recipient: booking.host,
        message: `You received $${booking.totalPrice} for the stay of ${booking.pet?.name || 'a pet'}.`,
        type: "payment_received", 
        data: { 
          bookingId: booking._id,
          totalPrice: booking.totalPrice 
        }
      });
      await receiverNote.save();

      // 4. Send real-time updates via Socket.io
      if (global.io) {
        global.io.to(`user-${booking.requester}`).emit("new-notification", senderNote);
        global.io.to(`user-${booking.host}`).emit("new-notification", receiverNote);
      }
      
      console.log(`✅ Payment processed and notifications sent for Booking: ${booking._id}`);
    }
  }
  // --- END OF YOUR CODE ---

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
app.post("/api/payments/create-session", async (req, res) => {
  const { bookingId } = req.body;
  try {
    const booking = await Booking.findById(bookingId).populate('pet');
    if (!booking) return res.status(404).json({ error: "Booking not found" });

    const session = await stripe.checkout.sessions.create({
      payment_method_types: ["card"],
      line_items: [{
        price_data: {
          currency: "usd",
          product_data: { name: `PetStay: ${booking.pet.name}` },
          unit_amount: Math.round(booking.totalPrice * 100), // Cents
        },
        quantity: 1,
      }],
      mode: "payment",
      success_url:"http://localhost:3000/payments?payment=success",
      cancel_url: "http://localhost:3000/payments?payment=cancel",
      metadata: { bookingId: booking._id.toString() } 
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
  socket.on("join-user", (userId) => socket.join(`user-${userId}`));
  socket.on("disconnect", () => console.log("User disconnected"));
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));