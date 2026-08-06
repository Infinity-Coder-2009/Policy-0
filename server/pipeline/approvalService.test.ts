import { describe, it, expect, beforeEach } from 'vitest';
import {
  createApprovalRequest,
  approveVideo,
  rejectVideo,
  requestRevision,
  getApproval,
  getApprovalByVideoGenId,
} from './approvalService';
import { ApprovalDecision } from '../../src/types';
import { getTable } from '../data/sqliteStore';

describe('approvalService', () => {
  beforeEach(() => {
    // Clear the approvals table
    const approvalsTable = getTable<{ id: string }>('approvals');
    approvalsTable.list().forEach((a) => approvalsTable.delById(a.id));
  });

  it('should create an approval request', () => {
    const approval = createApprovalRequest('vid_test_123');
    expect(approval).toHaveProperty('id');
    expect(approval.id).toMatch(/^appr_/);
    expect(approval.videoGenId).toBe('vid_test_123');
    expect(approval.policyId).toBeNull();
    expect(approval.decision).toBe('rejected');
    expect(approval.feedback).toBe('');
    expect(approval.approvedAt).toBeNull();
    expect(approval.rejectedAt).toBeNull();
  });

  it('should approve a video', () => {
    const created = createApprovalRequest('vid_test_456');
    const approved = approveVideo(created.id, 'pol_test_789');
    expect(approved.decision).toBe('approved');
    expect(approved.policyId).toBe('pol_test_789');
    expect(approved.approvedAt).not.toBeNull();
  });

  it('should reject a video with feedback', () => {
    const created = createApprovalRequest('vid_test_789');
    const rejected = rejectVideo(created.id, 'Quality issues');
    expect(rejected.decision).toBe('rejected');
    expect(rejected.feedback).toBe('Quality issues');
    expect(rejected.rejectedAt).not.toBeNull();
  });

  it('should request revision', () => {
    const created = createApprovalRequest('vid_test_rev');
    const revised = requestRevision(created.id, 'Need higher resolution');
    expect(revised.decision).toBe('revision_requested');
    expect(revised.feedback).toBe('Need higher resolution');
  });

  it('should get approval by ID', () => {
    const created = createApprovalRequest('vid_test_get');
    const retrieved = getApproval(created.id);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(created.id);
  });

  it('should return null for non-existent approval', () => {
    const retrieved = getApproval('non_existent_id');
    expect(retrieved).toBeNull();
  });

  it('should get approval by video gen ID', () => {
    const created = createApprovalRequest('vid_test_by_gen');
    const retrieved = getApprovalByVideoGenId('vid_test_by_gen');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.videoGenId).toBe('vid_test_by_gen');
  });

  it('should return null for non-existent video gen ID', () => {
    const retrieved = getApprovalByVideoGenId('non_existent_vid');
    expect(retrieved).toBeNull();
  });
});