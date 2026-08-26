import mongoose from "mongoose";

/**
 * Cached connection so Next.js hot-reloads (and serverless invocations) reuse a
 * single MongoDB connection instead of opening one per request.
 */
declare global {
  var _mongooseCache:
    | { conn: typeof mongoose | null; promise: Promise<typeof mongoose> | null }
    | undefined;
}

const cached = globalThis._mongooseCache ?? { conn: null, promise: null };
globalThis._mongooseCache = cached;

export class MissingMongoUriError extends Error {
  constructor() {
    super(
      "MONGODB_URI is not set. Add it to .env.local (see .env.example) and restart the dev server.",
    );
    this.name = "MissingMongoUriError";
  }
}

export async function connectToDatabase(): Promise<typeof mongoose> {
  if (cached.conn) return cached.conn;

  const uri = process.env.MONGODB_URI;
  if (!uri) throw new MissingMongoUriError();

  if (!cached.promise) {
    mongoose.set("strictQuery", true);
    cached.promise = mongoose
      .connect(uri, {
        dbName: process.env.MONGODB_DB || undefined,
        maxPoolSize: 10,
        serverSelectionTimeoutMS: 10000,
      })
      .catch((err) => {
        cached.promise = null;
        throw err;
      });
  }

  cached.conn = await cached.promise;
  return cached.conn;
}

export default connectToDatabase;
