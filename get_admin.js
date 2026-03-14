import "dotenv/config";
import mongoose from "mongoose";
import User from "./models/User.js";

async function getAdmin() {
    await mongoose.connect(process.env.DATABASE_URL);
    const admin = await User.findOne({ email: 'admin@hkmvizag.org' });
    if (admin) {
        console.log("Admin ID:", admin._id.toString());
        console.log("Admin Role:", admin.role);
        console.log("Admin Name:", admin.displayName);
    } else {
        console.log("Admin not found");
    }
    await mongoose.disconnect();
}

getAdmin();
