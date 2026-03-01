const Pet = require("../models/Pet");
const multer = require("multer");
const path = require("path");

// ==================== Multer Setup ====================
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, "uploads/pets/"); // folder to save pet images
  },
  filename: function (req, file, cb) {
    const ext = path.extname(file.originalname);
    cb(null, Date.now() + ext); // unique filename
  },
});

exports.uploadMiddleware = multer({ storage }).single("image");

// ==================== Helper ====================
const formatAge = (months) => {
  if (months < 12) return `${months} month${months > 1 ? "s" : ""}`;
  const years = Math.floor(months / 12);
  const remainingMonths = months % 12;
  return remainingMonths === 0
    ? `${years} year${years > 1 ? "s" : ""}`
    : `${years} year${years > 1 ? "s" : ""} ${remainingMonths} month${remainingMonths > 1 ? "s" : ""}`;
};

// ==================== Controllers ====================

// Create a new pet
exports.createPet = async (req, res) => {
  try {
    const { name, petType, age, description } = req.body;
    const image = req.file ? req.file.filename : null;

    if (!name || !petType || !age) {
      return res.status(400).json({ message: "Please fill required fields" });
    }

    const ageInMonths = parseInt(age);
    if (isNaN(ageInMonths) || ageInMonths <= 0) {
      return res.status(400).json({ message: "Invalid age" });
    }

    const pet = await Pet.create({
      name,
      petType,
      age: ageInMonths,
      description,
      image,
      owner: req.user.id,
    });

    const petObj = pet.toObject();
    petObj.formattedAge = formatAge(petObj.age);

    res.status(201).json(petObj);
  } catch (err) {
    console.error("Create pet error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Get all pets for the logged-in user
exports.getMyPets = async (req, res) => {
  try {
    const pets = await Pet.find({ owner: req.user.id });
    const petsWithFormattedAge = pets.map((pet) => {
      const petObj = pet.toObject();
      petObj.formattedAge = formatAge(petObj.age);
      return petObj;
    });
    res.json(petsWithFormattedAge);
  } catch (err) {
    console.error("Get pets error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Update a pet by ID
exports.updatePet = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) return res.status(404).json({ message: "Pet not found" });
    if (pet.owner.toString() !== req.user.id)
      return res.status(401).json({ message: "Not authorized" });

    const { name, petType, age, description } = req.body;
    if (name) pet.name = name;
    if (petType) pet.petType = petType;
    if (age) pet.age = parseInt(age);
    if (description !== undefined) pet.description = description;
    if (req.file) pet.image = req.file.filename;

    await pet.save();

    const petObj = pet.toObject();
    petObj.formattedAge = formatAge(petObj.age);

    res.json(petObj);
  } catch (err) {
    console.error("Update pet error:", err);
    res.status(500).json({ message: "Server error" });
  }
};

// Delete a pet by ID
exports.deletePet = async (req, res) => {
  try {
    const pet = await Pet.findById(req.params.id);
    if (!pet) return res.status(404).json({ message: "Pet not found" });
    if (pet.owner.toString() !== req.user.id)
      return res.status(401).json({ message: "Not authorized" });

    await pet.deleteOne();
    res.json({ message: "Pet deleted" });
  } catch (err) {
    console.error("Delete pet error:", err);
    res.status(500).json({ message: "Server error" });
  }
};