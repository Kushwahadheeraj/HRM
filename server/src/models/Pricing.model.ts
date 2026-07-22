import mongoose, { Schema, Document, Model } from 'mongoose';

export interface IPricing extends Document {
  plan: 'Basic' | 'Pro' | 'Enterprise';
  priceInr: number;
  priceUsd: number;
  employeeLimit: number; // -1 for unlimited
  features: string[];
  createdAt?: Date;
  updatedAt?: Date;
}

interface IPricingModel extends Model<IPricing> {
  initializeDefaultPricing(): Promise<void>;
}

const PricingSchema: Schema = new Schema({
  plan: { 
    type: String, 
    enum: ['Basic', 'Pro', 'Enterprise'], 
    required: true, 
    unique: true 
  },
  priceInr: { type: Number, required: true, default: 0 },
  priceUsd: { type: Number, required: true, default: 0 },
  employeeLimit: { type: Number, required: true }, // -1 = unlimited
  features: [{ type: String }]
}, { timestamps: true });

// Helper to initialize default pricing
PricingSchema.statics.initializeDefaultPricing = async function() {
  const defaultPricing = [
    {
      plan: 'Basic',
      priceInr: 299,
      priceUsd: 4,
      employeeLimit: 50,
      features: ['Up to 50 employees', 'Basic attendance', 'Leave management', 'Email support', 'Mobile app']
    },
    {
      plan: 'Pro',
      priceInr: 799,
      priceUsd: 9.99,
      employeeLimit: 500,
      features: ['Up to 500 employees', 'AI attendance', 'Full HRM suite', 'Priority support', 'Custom reports', 'API access', 'AI Assistant']
    },
    {
      plan: 'Enterprise',
      priceInr: 0,
      priceUsd: 0,
      employeeLimit: -1, // Unlimited
      features: ['Unlimited employees', 'Advanced AI', 'Dedicated manager', '24/7 support', 'Custom integrations', 'SLA guarantee']
    }
  ];

  for (const price of defaultPricing) {
    await this.findOneAndUpdate(
      { plan: price.plan },
      price,
      { upsert: true, new: true }
    );
  }
};

export default mongoose.model<IPricing, IPricingModel>('Pricing', PricingSchema);
