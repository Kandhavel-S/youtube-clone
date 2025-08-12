import mongoose from "mongoose";

const subscriptionSchema = mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true
  },
  plan: {
    type: String,
    enum: ['bronze', 'silver', 'gold'],
    required: true
  },
  amount: {
    type: Number,
    required: true
  },
  razorpayOrderId: {
    type: String
  },
  razorpayPaymentId: {
    type: String
  },
  razorpaySignature: {
    type: String
  },
  cashfreeOrderId: {
    type: String
  },
  cashfreePaymentId: {
    type: String
  },
  status: {
    type: String,
    enum: ['created', 'paid', 'failed'],
    default: 'created'
  },
  startDate: {
    type: Date
  },
  endDate: {
    type: Date
  },
  invoiceNumber: {
    type: String,
    unique: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

// Generate invoice number before saving
subscriptionSchema.pre('save', function(next) {
  if (!this.invoiceNumber) {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    this.invoiceNumber = `INV-${timestamp}-${random}`;
  }
  next();
});

export default mongoose.model("Subscription", subscriptionSchema);
