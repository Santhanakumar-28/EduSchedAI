const mongoose = require('mongoose');

const auditLogSchema = new mongoose.Schema(
  {
    _id: { type: String, required: true },
    userId: { type: String, default: null },
    userEmail: { type: String, required: true },
    userRole: { type: String, required: true },
    action: { type: String, required: true },
    entity: { type: String, required: true },
    entityId: { type: String, default: null },
    ipAddress: { type: String, default: '127.0.0.1' },
    details: { type: mongoose.Schema.Types.Mixed, default: {} },
    timestamp: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

module.exports = mongoose.model('AuditLog', auditLogSchema);
