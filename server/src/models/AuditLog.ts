import mongoose, { Document, Schema } from 'mongoose';

export interface IAuditLog extends Document {
  user?: mongoose.Types.ObjectId;
  userName?: string;
  action: string;
  entity: string;
  entityId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  ip?: string;
}

const auditLogSchema = new Schema<IAuditLog>({
  user: { type: Schema.Types.ObjectId, ref: 'User' },
  userName: String,
  action: { type: String, required: true },
  entity: { type: String, required: true },
  entityId: String,
  description: { type: String, required: true },
  metadata: Schema.Types.Mixed,
  ip: String,
}, { timestamps: true });

auditLogSchema.index({ createdAt: -1 });
auditLogSchema.index({ entity: 1 });
auditLogSchema.index({ user: 1 });

export default mongoose.model<IAuditLog>('AuditLog', auditLogSchema);
