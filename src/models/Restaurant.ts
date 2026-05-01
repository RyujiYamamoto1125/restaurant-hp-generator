import mongoose, { Schema, Document } from 'mongoose'

export interface IRestaurant extends Document {
  slug: string
  name: string
  cuisine: string
  address: string
  phone: string
  hours: string
  description: string
  priceRange: string
  seats: string
  googleMapsUrl: string
  tabelogUrl: string
  imageUrls: string[]
  generatedHtml: string
  createdAt: Date
}

const RestaurantSchema = new Schema<IRestaurant>({
  slug: { type: String, required: true, unique: true, index: true },
  name: { type: String, required: true },
  cuisine: String,
  address: String,
  phone: String,
  hours: String,
  description: String,
  priceRange: String,
  seats: String,
  googleMapsUrl: String,
  tabelogUrl: String,
  imageUrls: [String],
  generatedHtml: { type: String, required: true },
  createdAt: { type: Date, default: Date.now },
})

export default mongoose.models.Restaurant ||
  mongoose.model<IRestaurant>('Restaurant', RestaurantSchema)
