import mongoose from 'mongoose';
import { User } from '../models/user.model';
import dotenv from 'dotenv';
import { connectDB } from '../config/database';

// Load environment variables
dotenv.config();

const seedData = async () => {
  try {
    await connectDB();
    console.log('Connected to MongoDB');

    // Create initial admin user
    const adminEmail = 'admin@gmail.com';
    const adminPassword = 'admin123'; // Change this to a secure password
    const adminRole = 'admin';

    const existingAdmin = await User.findOne({ email: adminEmail });
    if (!existingAdmin) {
      const adminUser = new User({
        email: adminEmail,
        password: adminPassword,
        role: adminRole,
        isEmailVerified: true,
      });

      await adminUser.save();
      console.log('Admin user created successfully');
    } else {
      console.log('Admin user already exists');
    }

    // Add more seed data here if needed

  } catch (error) {
    console.error('Error seeding data:', error);
  } finally {
    await mongoose.connection.close();
    console.log('MongoDB connection closed');
  }
};

seedData();