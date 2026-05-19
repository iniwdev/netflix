const mongoose = require("mongoose");
const bcrypt = require("bcrypt");
require("dotenv").config();

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },
    password: {
      type: String,
    },
    plan: {
      type: String,
      default: "NONE",
    },
    subscription: {
      id: String,
      status: String,
      startDate: Date,
      expiryDate: Date,
    },
    role: {
      type: String,
      default: "USER",
      enum: ["ADMIN", "USER"],
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

async function run() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.error("MONGODB_URI not found in env!");
    process.exit(1);
  }
  
  console.log("Connecting to MongoDB...");
  await mongoose.connect(uri);
  console.log("Connected successfully!");

  const email = "admin@netflix.com";
  const plainPassword = "Password@1";
  const hashedPassword = await bcrypt.hash(plainPassword, 10);

  const existingUser = await User.findOne({ email });
  if (existingUser) {
    console.log("User already exists. Updating role to ADMIN...");
    existingUser.role = "ADMIN";
    existingUser.password = hashedPassword;
    await existingUser.save();
    console.log("Admin user updated successfully!");
  } else {
    console.log("Creating new admin user...");
    const adminUser = new User({
      name: "Admin User",
      email: email,
      password: hashedPassword,
      role: "ADMIN",
      plan: "PREMIUM",
      subscription: {
        id: "sub_admin",
        status: "active",
        startDate: new Date(),
        expiryDate: new Date(Date.now() + 365 * 24 * 60 * 60 * 1000)
      }
    });
    await adminUser.save();
    console.log("Admin user created successfully!");
  }

  await mongoose.disconnect();
  console.log("Disconnected from MongoDB.");
}

run().catch(err => {
  console.error(err);
  process.exit(1);
});
