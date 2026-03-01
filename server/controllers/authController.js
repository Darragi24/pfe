const User = require("../models/User");
const Notification = require("../models/Notification");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");
const multer = require("multer");
const path = require("path");
const fs = require("fs");

// -------------------- MULTER CONFIG --------------------
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, "uploads/"),
  filename: (req, file, cb) =>
    cb(null, Date.now() + path.extname(file.originalname)),
});
const upload = multer({ storage });

// -------------------- JWT TOKEN --------------------
const generateToken = (user) =>
  jwt.sign({ id: user._id, roles: user.roles }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });

// -------------------- AUTH HANDLERS -------------------- //

// Register
exports.register = async (req, res) => {
  try {
    const { name, email, password, role, phone, bio } = req.body;
    const profilePic = req.file ? req.file.filename : "";

    if (!name || !email || !password)
      return res
        .status(400)
        .json({ message: "Please fill all required fields" });

    const existingUser = await User.findOne({ email });
    if (existingUser)
      return res.status(400).json({ message: "User already exists" });

    const hashedPassword = await bcrypt.hash(password, 10);
    const validRoles = ["owner", "host", "admin"];
    const assignedRole = validRoles.includes(role) ? role : "owner";

    const user = await User.create({
      name,
      email,
      password: hashedPassword,
      roles: [assignedRole],
      profilePic,
      phone: phone || "",
      bio: bio || "",
    });

    res.status(201).json({
      message: "User registered successfully",
      token: generateToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        profilePic: user.profilePic,
        phone: user.phone,
        bio: user.bio,
        hostApplication: user.hostApplication || {},
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Login
exports.login = async (req, res) => {
  try {
    const { email, password } = req.body;

    const user = await User.findOne({ email });
    if (!user) return res.status(400).json({ message: "Invalid credentials" });

    // Check if user is active
    if (!user.isActive) {
      return res.status(403).json({ message: "Your account has been deactivated. Contact support." });
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch)
      return res.status(400).json({ message: "Invalid credentials" });

    res.json({
      message: "Login successful",
      token: generateToken(user),
      user: {
        id: user._id,
        name: user.name,
        email: user.email,
        roles: user.roles,
        profilePic: user.profilePic,
        phone: user.phone,
        bio: user.bio,
        isActive: user.isActive,
        hostApplication: user.hostApplication || {},
      },
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get current user
exports.getMe = async (req, res) => {
  try {
    const user = await User.findById(req.user.id).select("-password");
    res.json(user);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Add role
exports.addRole = async (req, res) => {
  try {
    const { role } = req.body;
    if (!["owner", "host", "admin"].includes(role))
      return res.status(400).json({ message: "Invalid role" });

    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!user.roles.includes(role)) {
      user.roles.push(role);
      await user.save();
    }

    res.json({ message: "Role updated", roles: user.roles });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -------------------- PROFILE UPDATES --------------------

// Update Name
exports.updateName = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { name } = req.body;
    if (!name) return res.status(400).json({ message: "Name cannot be empty" });

    user.name = name;
    await user.save();

    res.json({ message: "Name updated", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Phone
exports.updatePhone = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { phone } = req.body;
    if (phone === undefined)
      return res.status(400).json({ message: "Phone is required" });

    user.phone = phone;
    await user.save();

    res.json({ message: "Phone updated", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Bio
exports.updateBio = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { bio } = req.body;
    user.bio = bio || "";
    await user.save();

    res.json({ message: "Bio updated", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Update Profile Picture
exports.updateProfilePic = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    if (!req.file) return res.status(400).json({ message: "No file uploaded" });

    // Remove old pic if exists
    if (user.profilePic) {
      const oldPath = path.join(__dirname, "..", "uploads", user.profilePic);
      if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    user.profilePic = req.file.filename;
    await user.save();

    res.json({ message: "Profile picture updated", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Multer middleware
exports.uploadMiddleware = upload.single("profilePic");

// -------------------- HOST SYSTEM --------------------

// Apply to become host (or request host profile update)
exports.applyForHost = async (req, res) => {
  try {
    const user = await User.findById(req.user.id);
    if (!user) return res.status(404).json({ message: "User not found" });

    const { experience, preferredPets, pricePerNight } = req.body;

    // determine if this is a new application or modification
    const wasApproved = user.hostApplication?.status === "approved";

    user.hostApplication = {
      status: "pending",
      experience: experience || user.hostApplication?.experience || "",
      preferredPets: preferredPets || user.hostApplication?.preferredPets || [],
      pricePerNight: Number(pricePerNight) || user.hostApplication?.pricePerNight || 0,
      submittedAt: new Date(),
    };

    await user.save();

    // send notifications to all admins with appropriate wording
    const admins = await User.find({ roles: "admin" });
    const message = wasApproved
      ? `${user.name} has updated their host profile and requests review`
      : `${user.name} has applied to become a host`;

    const payload = {
      applicantId: user._id,
      applicantName: user.name,
      applicantEmail: user.email,
      experience: user.hostApplication.experience,
      preferredPets: user.hostApplication.preferredPets,
      pricePerNight: user.hostApplication.pricePerNight,
      currentStatus: user.hostApplication.status,
    };

    admins.forEach((a) => {
      Notification.create({
        user: a._id,
        message,
        type: "host_application",
        data: payload,
      }).catch(console.error);

      // emit real-time notification to all admins via WebSocket
      if (global.io) {
        global.io.to(`admin-${a._id}`).emit("new-notification", {
          _id: "temp-" + Date.now(), // temporary ID, will be replaced when fetched from DB
          message,
          type: "host_application",
          data: payload,
          createdAt: new Date(),
          read: false,
        });
      }
    });

    res.json({
      message: wasApproved ? "Host update requested" : "Host application submitted",
      user,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin approves host
exports.approveHost = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.hostApplication.status = "approved";
    if (!user.roles.includes("host")) user.roles.push("host");
    user.hostApplication.reviewedAt = new Date();
    user.hostApplication.reviewedBy = req.user.id;

    await user.save();

    // update any existing admin notifications for this application so the payload shows the current status
    await Notification.updateMany(
      { "data.applicantId": user._id, type: "host_application" },
      { $set: { "data.currentStatus": "approved" } }
    ).catch(console.error);

    // notify applicant
    const approvalNotif = await Notification.create({
      user: user._id,
      message: "Your host application has been approved!",
      type: "host_application_approved",
      data: { reviewedBy: req.user.id },
    }).catch(console.error);

    // emit real-time notifications via WebSocket
    if (global.io) {
      // notify the user that they were approved
      global.io.to(`user-${user._id}`).emit("new-notification", {
        _id: approvalNotif?._id || "temp-" + Date.now(),
        message: "Your host application has been approved!",
        type: "host_application_approved",
        data: { reviewedBy: req.user.id },
        createdAt: new Date(),
        read: false,
      });
      // notify admins that status changed
      global.io.emit("host-status-updated", {
        applicantId: user._id,
        status: "approved",
      });
    }

    res.json({ message: "Host approved", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Admin rejects host
exports.rejectHost = async (req, res) => {
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.hostApplication.status = "rejected";
    user.hostApplication.reviewedAt = new Date();
    user.hostApplication.reviewedBy = req.user.id;
    // drop host role if it was previously granted
    if (user.roles.includes("host")) {
      user.roles = user.roles.filter((r) => r !== "host");
    }

    await user.save();

    // update any existing admin notifications payload status
    await Notification.updateMany(
      { "data.applicantId": user._id, type: "host_application" },
      { $set: { "data.currentStatus": "rejected" } }
    ).catch(console.error);

    // notify applicant
    const rejectNotif = await Notification.create({
      user: user._id,
      message: "Your host application has been rejected",
      type: "host_application_rejected",
      data: { reviewedBy: req.user.id },
    }).catch(console.error);

    // emit real-time notifications via WebSocket
    if (global.io) {
      // notify the user that they were rejected
      global.io.to(`user-${user._id}`).emit("new-notification", {
        _id: rejectNotif?._id || "temp-" + Date.now(),
        message: "Your host application has been rejected",
        type: "host_application_rejected",
        data: { reviewedBy: req.user.id },
        createdAt: new Date(),
        read: false,
      });
      // notify admins that status changed
      global.io.emit("host-status-updated", {
        applicantId: user._id,
        status: "rejected",
      });
    }

    res.json({ message: "Host rejected", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// -------------------- ADMIN MANAGEMENT --------------------

// Helper to ensure requester is admin
const ensureAdmin = (req, res) => {
  if (!req.user || !req.user.roles || !req.user.roles.includes("admin")) {
    res.status(403).json({ message: "Admin privileges required" });
    return false;
  }
  return true;
};

// Get all users (admin)
exports.getAllUsers = async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const users = await User.find().select("-password");
    res.json(users);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Get all hosts (admin)
exports.getAllHosts = async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const hosts = await User.find({ roles: "host" }).select("-password");
    res.json(hosts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Deactivate a host account (remove host role and reset application)
exports.deactivateHost = async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.roles = user.roles.filter((r) => r !== "host");
    user.hostApplication = { status: "none" };
    await user.save();
    res.json({ message: "Host deactivated", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Deactivate a user (set isActive to false)
exports.deactivateUser = async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isActive = false;
    await user.save();
    res.json({ message: "User deactivated", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// Activate a user (set isActive to true)
exports.activateUser = async (req, res) => {
  if (!ensureAdmin(req, res)) return;
  try {
    const user = await User.findById(req.params.userId);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.isActive = true;
    await user.save();
    res.json({ message: "User activated", user });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};