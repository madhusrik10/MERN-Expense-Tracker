import mongoose from "mongoose";

export const connectDB = async () => {
    const db = process.env.MONGO_URL;
    if (!db) {
        throw new Error("MONGO_URL is not defined in environment variables");
    }

    // ensure modern topology and parser options
    const conn = await mongoose.connect(db, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });

    console.log(`MongoDB Connected to ${conn.connection.host}`);
};

export default connectDB;

