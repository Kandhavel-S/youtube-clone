import mongoose from "mongoose";

const groupSchema = mongoose.Schema({
  name: { type: String, required: true },
  description: { type: String },
  creator: { type: mongoose.Schema.Types.ObjectId, ref: 'user', required: true },
  members: [{ type: mongoose.Schema.Types.ObjectId, ref: 'user' }],
  inviteCode: { type: String, unique: true },
  isPrivate: { type: Boolean, default: false },
  createdOn: { type: Date, default: Date.now },
  image: { type: String },
  tags: [{ type: String }],
  memberCount: { type: Number, default: 0 }
});

// Generate unique invite code before saving
groupSchema.pre('save', function(next) {
  if (!this.inviteCode) {
    this.inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
  }
  this.memberCount = this.members.length;
  next();
});

export default mongoose.model("Group", groupSchema);
