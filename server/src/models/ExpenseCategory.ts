import mongoose, { Document, Schema } from 'mongoose';

export interface IExpenseCategory extends Document {
  name: string;
  icon?: string;
  active: boolean;
}

const expenseCategorySchema = new Schema<IExpenseCategory>({
  name: { type: String, required: true, trim: true, unique: true },
  icon: String,
  active: { type: Boolean, default: true },
}, { timestamps: true });

export default mongoose.model<IExpenseCategory>('ExpenseCategory', expenseCategorySchema);
