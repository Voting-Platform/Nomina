import mongoose, { Schema, model, models } from "mongoose";

// `models.User ||` prevents re-compiling model on hot reload
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  auth0Id: { type: String, required: true, unique: true },
  picture: { type: String },
  role: { type: String, enum: ["admin", "user"], default: "user" },
}, { timestamps: true });

export const User = models.User || model("User", UserSchema);