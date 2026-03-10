import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import dotenv from 'dotenv';
import User from './models/User.js';
import Event from './models/Event.js';
import Post from './models/Post.js';
import Sadhana from './models/Sadhana.js';

dotenv.config();

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hk-youth-realtime';

mongoose.connect(MONGO_URI).then(async () => {
    console.log('Connected to DB. Seeding data...');

    await User.deleteMany({});
    await Event.deleteMany({});
    await Post.deleteMany({});
    await Sadhana.deleteMany({});

    const hash = await bcrypt.hash('123456', 10);

    const users = await User.insertMany([
        { _id: new mongoose.Types.ObjectId(), username: 'member@folk-vizag.org', password: hash, email: 'member@folk-vizag.org', name: 'Karthik', spiritualName: 'Krishna Das', role: 'member', center: 'Visakhapatnam', batch: 'Students' },
        { _id: new mongoose.Types.ObjectId(), username: 'guide@folk-vizag.org', password: hash, email: 'guide@folk-vizag.org', name: 'Suresh', spiritualName: 'Vaishnava Das', role: 'guide', center: 'Visakhapatnam', batch: 'Professionals' },
        { _id: new mongoose.Types.ObjectId(), username: 'admin@folk-vizag.org', password: hash, email: 'admin@folk-vizag.org', name: 'Ramesh', spiritualName: 'Admin Prabhu', role: 'admin', center: 'Visakhapatnam', batch: 'Center Admin' },
        { _id: new mongoose.Types.ObjectId(), username: 'security@folk-vizag.org', password: hash, email: 'security@folk-vizag.org', name: 'Security Guard', spiritualName: 'Security Das', role: 'security', center: 'Visakhapatnam', batch: 'Security' }
    ]);

    await Event.insertMany([
        {
            title: 'Mangala Arati Satsang',
            type: 'weekly',
            date: new Date('2026-04-12T05:00:00.000Z'),
            location: 'Temple Hall',
            capacity: 40,
            registered: [users[0]._id],
            creator: users[1]._id
        }
    ]);

    await Post.insertMany([
        {
            author: users[0]._id,
            content: 'Beautiful darshan of Sri Sri Radha Madanmohan today morning!',
            tag: 'Darshan',
            likes: []
        },
        {
            author: users[1]._id,
            content: '"Chanting the holy name is the only way in this age..." Just finished my 16 rounds before 6 AM. The peaceful atmosphere really helps focus the mind.',
            tag: 'Realization',
            likes: [users[0]._id]
        }
    ]);

    await Sadhana.insertMany([
        {
            user: users[0]._id,
            date: new Date().toISOString().split('T')[0],
            rounds: 16,
            readingMins: 30,
            mangala: true
        }
    ]);

    console.log('Seed complete.');
    process.exit();
}).catch(err => {
    console.error('Mongo error', err);
    process.exit(1);
});
