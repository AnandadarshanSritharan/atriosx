import mongoose, { Document, Schema } from 'mongoose';

export interface IExpense extends Document {
  title: string;
  category: mongoose.Types.ObjectId;
  amount: number;
  date: Date;
  vendor?: string;
  description?: string;
  receipt?: string;
  recurring: boolean;
  recurringPeriod?: 'daily' | 'weekly' | 'monthly' | 'yearly';
  paymentMethod?: string;
  createdBy?: mongoose.Types.ObjectId;
  archived: boolean;
}

const expenseSchema = new Schema<IExpense>({
  title: { type: String, required: true, trim: true },
  category: { type: Schema.Types.ObjectId, ref: 'ExpenseCategory', required: true },
  amount: { type: Number, required: true, min: 0 },
  date: { type: Date, required: true },
  vendor: String,
  description: String,
  receipt: String,
  recurring: { type: Boolean, default: false },
  recurringPeriod: { type: String, enum: ['daily','weekly','monthly','yearly'] },
  paymentMethod: String,
  createdBy: { type: Schema.Types.ObjectId, ref: 'User' },
  archived: { type: Boolean, default: false },
}, { timestamps: true });

expenseSchema.index({ date: -1 });
expenseSchema.index({ category: 1 });

export default mongoose.model<IExpense>('Expense', expenseSchema);
