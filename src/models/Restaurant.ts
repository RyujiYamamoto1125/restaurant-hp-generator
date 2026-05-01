import mongoose, { Schema, Document } from 'mongoose'

export interface IRestaurant extends Document {
  slug: string
  editToken: string
  editPasswordHash: string  // SHA256(password + editToken)
  name: string
  cuisine: string
  address: string
  phone: string
  hours: string
  description: string
  priceRange: string
  seats: string
  access: string
  rating: string
  googleMapsUrl: string
  tabelogUrl: string
  imageUrls: string[]
  uploadedHeroImg: string       // オーナーがアップロードしたヒーロー画像
  uploadedMenuImgs: string[]    // オーナーがアップロードしたメニュー画像
  uploadedGalleryImgs: string[] // オーナーがアップロードしたギャラリー画像
  contentJson: string
  metaJson: string
  generatedHtml: string
  createdAt: Date
}

const RestaurantSchema = new Schema<IRestaurant>({
  slug:             { type: String, required: true, unique: true, index: true },
  editToken:        { type: String, required: true, index: true },
  editPasswordHash: { type: String, required: true },
  name:             { type: String, required: true },
  cuisine:          String,
  address:          String,
  phone:            String,
  hours:            String,
  description:      String,
  priceRange:       String,
  seats:            String,
  access:           String,
  rating:           String,
  googleMapsUrl:    String,
  tabelogUrl:       String,
  imageUrls:        [String],
  uploadedHeroImg:      { type: String, default: '' },
  uploadedMenuImgs:     { type: [String], default: [] },
  uploadedGalleryImgs:  { type: [String], default: [] },
  contentJson:      String,
  metaJson:         String,
  generatedHtml:    { type: String, required: true },
  createdAt:        { type: Date, default: Date.now },
})

export default mongoose.models.Restaurant ||
  mongoose.model<IRestaurant>('Restaurant', RestaurantSchema)
