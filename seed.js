import mongoose from 'mongoose';
import User from './models/User.js';
import Event from './models/Event.js';
import Post from './models/Post.js';
import Sadhana from './models/Sadhana.js';

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/hk-youth-db';

mongoose.connect(MONGO_URI).then(async () => {
    console.log('Connected to DB. Seeding data...');

    await User.deleteMany({});
    await Event.deleteMany({});
    await Post.deleteMany({});
    await Sadhana.deleteMany({});

    const users = await User.insertMany([
        { _id: new mongoose.Types.ObjectId(), handle: 'member', email: 'member@folk-vizag.org', name: 'Krishna Das', role: 'member' },
        { _id: new mongoose.Types.ObjectId(), handle: 'guide', email: 'guide@folk-vizag.org', name: 'Vaishnava Das', role: 'guide' },
        { _id: new mongoose.Types.ObjectId(), handle: 'admin', email: 'admin@folk-vizag.org', name: 'Admin Prabhu', role: 'admin' },
    ]);

    await Event.insertMany([
        {
            title: 'Mangala Arati Satsang',
            type: 'weekly',
            date: new Date('2026-04-12T05:00:00.000Z'),
            location: 'Temple Hall',
            capacity: 40,
            registered: [users[0]._id],
            creatorId: users[1]._id
        }
    ]);

    await Post.insertMany([
        {
            authorId: users[0]._id,
            text: 'Beautiful darshan of Sri Sri Radha Madanmohan today morning!',
            tags: ['Satsang', 'Darshan'],
            likes: []
        }
    ]);

    await Sadhana.insertMany([
        {
            userId: users[0]._id,
            date: new Date().toISOString().split('T')[0],
            japaRounds: 16,
            readingMinutes: 30,
            mangalaArati: true
        }
    ]);

    console.log('Seed complete.');
    process.exit();
}).catch(err => {
    console.error('Mongo not running or error', err.message);
    process.exit(0); // exit gracefully so CI doesn't fail
});
