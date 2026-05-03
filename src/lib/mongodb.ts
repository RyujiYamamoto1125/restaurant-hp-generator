import mongoose from 'mongoose'

let cached = (global as any).mongoose || { conn: null, promise: null }
;(global as any).mongoose = cached

export async function connectDB() {
  const uri = process.env.MONGODB_URI
  if (!uri) throw new Error('MONGODB_URI is not defined')
  if (cached.conn) return cached.conn
  if (!cached.promise) {
    cached.promise = mongoose.connect(uri).then((m) => m)
  }
  cached.conn = await cached.promise
  return cached.conn
}
