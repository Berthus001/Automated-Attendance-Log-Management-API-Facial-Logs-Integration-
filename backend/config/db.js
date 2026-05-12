const mongoose = require("mongoose");

const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);

    console.log("Connected to MongoDB Atlas");

    global.isOfflineMode = false;

  } catch (err) {

    console.log("Atlas unavailable. Switching to local MongoDB...");

    await mongoose.connect(process.env.MONGO_URI_LOCAL);

    global.isOfflineMode = true;

    console.log("Connected to Local MongoDB");
  }
};

module.exports = connectDB;