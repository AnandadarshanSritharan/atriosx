import AuditLog from '../models/AuditLog';
import { IUser } from '../models/User';

export const createAuditLog = async (params: {
  user?: IUser & { _id: any };
  action: string;
  entity: string;
  entityId?: string;
  description: string;
  metadata?: Record<string, unknown>;
  ip?: string;
}) => {
  try {
    await AuditLog.create({
      user: params.user?._id,
      userName: params.user?.name,
      action: params.action,
      entity: params.entity,
      entityId: params.entityId,
      description: params.description,
      metadata: params.metadata,
      ip: params.ip,
    });
  } catch (err) {
    console.error('Audit log failed:', err);
  }
};
