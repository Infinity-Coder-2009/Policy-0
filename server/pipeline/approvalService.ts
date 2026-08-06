import { ApprovalDecision, NVIDIAVideoGenResult } from '../../src/types';
import { getTable, transaction } from '../data/sqliteStore';

interface ApprovalRecord {
  id: string;
  videoGenId: string;
  policyId: string | null;
  decision: 'approved' | 'rejected' | 'revision_requested';
  feedback: string;
  approvedAt: string | null;
  rejectedAt: string | null;
  createdAt: string;
}

const approvalsTable = getTable<ApprovalRecord>('approvals');

function toDecision(record: ApprovalRecord): ApprovalDecision {
  return {
    id: record.id,
    videoGenId: record.videoGenId,
    policyId: record.policyId,
    decision: record.decision,
    feedback: record.feedback,
    approvedAt: record.approvedAt,
    rejectedAt: record.rejectedAt,
  };
}

export function createApprovalRequest(videoGenId: string): ApprovalDecision {
  const id = `appr_${Date.now().toString(36)}`;
  const record: ApprovalRecord = {
    id,
    videoGenId,
    policyId: null,
    decision: 'rejected',
    feedback: '',
    approvedAt: null,
    rejectedAt: null,
    createdAt: new Date().toISOString(),
  };
  approvalsTable.insert(record);
  return toDecision(record);
}

export function approveVideo(approvalId: string, policyId: string): ApprovalDecision {
  const updated = approvalsTable.updateById(approvalId, {
    decision: 'approved' as const,
    policyId,
    approvedAt: new Date().toISOString(),
  });
  if (!updated) throw new Error(`Approval record not found: ${approvalId}`);
  return toDecision(updated);
}

export function rejectVideo(approvalId: string, feedback: string): ApprovalDecision {
  const updated = approvalsTable.updateById(approvalId, {
    decision: 'rejected' as const,
    feedback,
    rejectedAt: new Date().toISOString(),
  });
  if (!updated) throw new Error(`Approval record not found: ${approvalId}`);
  return toDecision(updated);
}

export function requestRevision(approvalId: string, feedback: string): ApprovalDecision {
  const updated = approvalsTable.updateById(approvalId, {
    decision: 'revision_requested' as const,
    feedback,
  });
  if (!updated) throw new Error(`Approval record not found: ${approvalId}`);
  return toDecision(updated);
}

export function getApproval(approvalId: string): ApprovalDecision | null {
  const record = approvalsTable.find((r) => r.id === approvalId);
  return record ? toDecision(record) : null;
}

export function getApprovalByVideoGenId(videoGenId: string): ApprovalDecision | null {
  const record = approvalsTable.find((r) => r.videoGenId === videoGenId);
  return record ? toDecision(record) : null;
}