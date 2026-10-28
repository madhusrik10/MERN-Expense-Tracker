import mongoose from "mongoose";

// Cache Mongoose connection across serverless function invocations
let cached = global.mongoose;

if (!cached) {
  cached = global.mongoose = { conn: null, promise: null };
}

export const connectDB = async () => {
  const db = process.env.MONGO_URL;
  if (!db) {
    throw new Error("MONGO_URL is not defined in environment variables");
  }

  // If already connected, reuse the active connection
  if (cached.conn && mongoose.connection.readyState === 1) {
    return cached.conn;
  }

  // If a connection is already being established, await the existing promise
  if (!cached.promise) {
    cached.promise = mongoose
      .connect(db, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
      })
      .then((mongooseInstance) => {
        console.log(`MongoDB Connected to ${mongooseInstance.connection.host}`);
        return mongooseInstance;
      });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
};

export default connectDB;

