export interface AuditLogData {
  actorId?: string | null;
  actorEmail?: string | null;
  ipAddress?: string | null;
}

export interface BaseCreateInput extends AuditLogData {
  // Common fields that all entities might have
}
