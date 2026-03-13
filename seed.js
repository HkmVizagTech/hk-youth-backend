import "dotenv/config";
import mongoose from "mongoose";
import Tenant from "./models/Tenant.js";
import Center from "./models/Center.js";
import Batch from "./models/Batch.js";
import User from "./models/User.js";
import BatchGuide from "./models/BatchGuide.js";

async function main() {
    const MONGODB_URI = process.env.DATABASE_URL || process.env.MONGODB_URI;
    await mongoose.connect(MONGODB_URI);

    console.log('🌱 Seeding HKM Vizag FOLK Platform (Mongoose Mode)...');

    // Clear existing data (optional but good for clean seed)
    await Promise.all([
        Tenant.deleteMany({}),
        Center.deleteMany({}),
        Batch.deleteMany({}),
        User.deleteMany({}),
        BatchGuide.deleteMany({})
    ]);

    // 1. Tenant
    const tenant = await Tenant.create({
        name: 'Hare Krishna Movement India'
    });

    // 2. Centers
    const vizagCenter = await Center.create({
        tenantId: tenant._id,
        name: 'HKM Visakhapatnam',
        slug: 'hkm-vizag',
        city: 'Visakhapatnam',
        state: 'Andhra Pradesh',
        timezone: 'Asia/Kolkata',
        deityName: 'Sri Sri Radha Madanmohan'
    });

    // 3. Batches
    const batches = [];
    for (let i = 1; i <= 10; i++) {
        const batch = await Batch.create({
            name: `FOLK 2026 Batch ${i}`,
            centerId: vizagCenter._id,
        });
        batches.push(batch);
    }

    // 4. Guides
    const guideNames = ['Vaishnava Das', 'Krishna Bhakta Das', 'Govinda Das', 'Madhava Das', 'Bhakti Yoga Das'];
    const guides = [];
    for (const name of guideNames) {
        const user = await User.create({
            displayName: name,
            spiritualName: name,
            phone: `999990000${guides.length}`,
            email: `${name.toLowerCase().replace(/ /g, '.')}@hkmvizag.org`,
            role: 'folk_guide',
            password: "password123",
            centerId: vizagCenter._id
        });
        guides.push(user);

        // Assign guide to a batch
        await BatchGuide.create({
            userId: user._id,
            batchId: batches[guides.length - 1]._id,
            isLead: true
        });
    }

    // 5. Admin
    const admin = await User.findOneAndUpdate(
        { email: 'admin@hkmvizag.org' },
        {
            displayName: 'Temple Admin',
            spiritualName: 'Admin Das',
            phone: '8888800000',
            email: 'admin@hkmvizag.org',
            role: 'folk_admin',
            password: "adminpassword",
            centerId: vizagCenter._id
        },
        { upsert: true, new: true }
    );

    // 6. Users (Members)
    for (let i = 1; i <= 20; i++) {
        await User.create({
            displayName: `Devotee ${i}`,
            phone: `98765432${i.toString().padStart(2, '0')}`,
            email: `devotee${i}@gmail.com`,
            role: 'folk_member',
            password: "password123",
            centerId: vizagCenter._id,
            batchId: batches[i % 10]._id
        });
    }

    console.log('✅ Seeded Tenant, Center, Batches, Guides, Admin, Members.');
}

main()
    .catch((e) => {
        console.error(e);
        process.exit(1);
    })
    .finally(async () => {
        await mongoose.disconnect();
    });
