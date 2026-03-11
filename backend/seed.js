const mongoose = require('mongoose');
require('dotenv').config();

const User = require('./models/User');

const MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017/nfforms';

const MASTER_ADMIN_EMAIL = '112125005@nitt.edu';

async function seed() {
    try {
        await mongoose.connect(MONGO_URI);
        console.log('Connected to MongoDB');

        // Seed the master admin
        const existing = await User.findOne({ email: MASTER_ADMIN_EMAIL });
        if (existing) {
            // Ensure role is masterAdmin even if it was changed
            if (existing.role !== 'masterAdmin') {
                existing.role = 'masterAdmin';
                await existing.save();
                console.log(`  🔄 Updated ${MASTER_ADMIN_EMAIL} role to masterAdmin`);
            } else {
                console.log(`  ⏭  Skipped (exists): ${MASTER_ADMIN_EMAIL}`);
            }
        } else {
            await User.create({
                name: 'Master Admin',
                email: MASTER_ADMIN_EMAIL,
                role: 'masterAdmin',
            });
            console.log(`  ✅ Created masterAdmin: ${MASTER_ADMIN_EMAIL}`);
        }

        console.log('\nSeed complete!');
        console.log(`\nMaster Admin: ${MASTER_ADMIN_EMAIL} (login via DAuth)`);
    } catch (err) {
        console.error('Seed error:', err);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
    }
}

seed();
