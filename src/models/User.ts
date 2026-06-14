import  { Schema, model, models } from "mongoose";
import { UserRole } from "@/types";

// `models.User ||` prevents re-compiling model on hot reload
const UserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  googleId: { type: String, unique: true, sparse: true },
  picture: { type: String },
  role: { type: String, enum: UserRole, default: UserRole.USER },
}, { timestamps: true });

export const User = models.User || model("User", UserSchema);