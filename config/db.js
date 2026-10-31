const mongoose = require("mongoose");

const connectDB = async () => {
  const uri = process.env.MONGO_URI;

  if (!uri) {
    console.error("MONGO_URI is missing. Add it to your .env file.");
    process.exit(1);
  }

  try {
    const conn = await mongoose.connect(uri);
    console.log(`Connected to MongoDB (${conn.connection.name})`);
  } catch (error) {
    console.error("Could not connect to MongoDB:", error.message);
    process.exit(1);
  }
};

module.exports = connectDB;
