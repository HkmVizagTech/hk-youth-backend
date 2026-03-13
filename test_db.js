import "dotenv/config";
import mongoose from "mongoose";
import User from "./models/User.js";

async function testConnection() {
    console.log("Connecting...");
    try {
        await mongoose.connect(process.env.DATABASE_URL);
        console.log("Connected. Running findOne...");
        const start = Date.now();
        const user = await User.findOne();
        console.log(`Query took ${Date.now() - start}ms`);
        console.log("User found:", user ? user.displayName : "No user found");
    } catch (err) {
        console.error("Test failed:", err);
    } finally {
        await mongoose.disconnect();
    }
}

testConnection();
