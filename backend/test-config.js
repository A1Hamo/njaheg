require('dotenv').config({ path: './.env' });
const { connectMongo } = require('./src/config/mongo');
const { initFirebase } = require('./src/config/firebase');
const mongoose = require('mongoose');

async function test() {
  console.log("TESTING FIREBASE...");
  try {
    initFirebase();
    console.log("✅ Firebase initialized");
  } catch(e) { console.error("❌ Firebase error", e); }

  console.log("TESTING MONGODB...");
  try {
    await connectMongo();
    console.log("✅ MongoDB connection SUCCESS");
    const { Message } = require('./src/config/mongo');
    console.log("Attempting a find()...");
    const count = await Message.countDocuments();
    console.log("✅ MongoDB Operation SUCCESS, count:", count);
  } catch(e) {
    console.error("❌ MongoDB error", e);
  }
  process.exit(0);
}
test();
