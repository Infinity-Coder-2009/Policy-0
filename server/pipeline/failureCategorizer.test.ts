import { describe, it, expect } from 'vitest';
import { categorizeFailureRuleBased, classifySeverity, FAILURE_TAXONOMY, highestSeveritySignal } from './failureCategorizer';
import { DeploymentRun, CategorizedFailure, ErrorSignal, FailureCategory } from '../../src/types';

describe('failureCategorizer', () => {
  const createMockRun = (overrides: Partial<DeploymentRun> = {}): DeploymentRun => ({
    id: 'run_test_1',
    policyId: 'pol_test_1',
    robotModel: 'franka_panda',
    taskTitle: 'Pick and place',
    outcome: 'failure',
    successScore: 20, // < 30 triggers critical severity upgrade
    durationSec: 5,
    numAttempts: 1,
    errorSignals: [
      { type: 'grasp_slip', severity: 'high', description: 'Object slipped from gripper', occurredAtSec: 1.5 },
    ],
    environmentFingerprint: 'env_123',
    deployedAt: new Date().toISOString(),
    source: 'sim',
    ...overrides,
  });

  it('should categorize grasp_slip failures', () => {
    const run = createMockRun({
      errorSignals: [{ type: 'grasp_slip', severity: 'high', description: 'Object slipped during lift', occurredAtSec: 1.5 }],
    });
    const result = categorizeFailureRuleBased(run);
    expect(result.category).toBe('grasp_slip');
    // successScore < 30 triggers critical severity upgrade
    expect(result.severity).toBe('critical');
    expect(result.policyId).toBe(run.policyId);
    expect(result.taskTitle).toBe(run.taskTitle);
  });

  it('should categorize contact_jam failures', () => {
    const run = createMockRun({
      errorSignals: [{ type: 'contact_jam', severity: 'high', description: 'Insertion wedge detected', occurredAtSec: 2.6 }],
    });
    const result = categorizeFailureRuleBased(run);
    expect(result.category).toBe('contact_jam');
  });

  it('should categorize stability_oscillation failures', () => {
    const run = createMockRun({
      errorSignals: [{ type: 'stability_oscillation', severity: 'medium', description: 'EE oscillation near target', occurredAtSec: 3.1 }],
    });
    const result = categorizeFailureRuleBased(run);
    expect(result.category).toBe('stability_oscillation');
  });

  it('should categorize target_lost failures', () => {
    const run = createMockRun({
      errorSignals: [{ type: 'target_lost', severity: 'medium', description: 'Vision tracking lost', occurredAtSec: 1.1 }],
    });
    const result = categorizeFailureRuleBased(run);
    expect(result.category).toBe('target_lost');
  });

  it('should categorize collision_misdetection failures', () => {
    const run = createMockRun({
      errorSignals: [{ type: 'collision_misdetection', severity: 'critical', description: 'False collision trigger', occurredAtSec: 2.2 }],
    });
    const result = categorizeFailureRuleBased(run);
    expect(result.category).toBe('collision_misdetection');
  });

  it('should categorize timeout failures', () => {
    const run = createMockRun({
      errorSignals: [{ type: 'timeout', severity: 'high', description: 'Task timed out', occurredAtSec: 30 }],
    });
    const result = categorizeFailureRuleBased(run);
    expect(result.category).toBe('timeout');
  });

  it('should categorize joint_limit failures', () => {
    const run = createMockRun({
      errorSignals: [{ type: 'joint_limit', severity: 'medium', description: 'Joint limit reached', occurredAtSec: 1.0 }],
    });
    const result = categorizeFailureRuleBased(run);
    expect(result.category).toBe('joint_limit');
  });

  it('should categorize navigation_failure failures', () => {
    const run = createMockRun({
      robotModel: 'turtlebot4',
      errorSignals: [{ type: 'navigation_failure', severity: 'medium', description: 'Path blocked', occurredAtSec: 5.0 }],
    });
    const result = categorizeFailureRuleBased(run);
    expect(result.category).toBe('navigation_failure');
  });

  it('should categorize calibration_drift failures', () => {
    const run = createMockRun({
      errorSignals: [{ type: 'calibration_drift', severity: 'medium', description: 'Sensor drift detected', occurredAtSec: 10.0 }],
    });
    const result = categorizeFailureRuleBased(run);
    expect(result.category).toBe('calibration_drift');
  });

  it('should default to unknown for unrecognized signals', () => {
    const run = createMockRun({
      errorSignals: [{ type: 'unknown_error' as any, severity: 'low', description: 'Mystery error', occurredAtSec: 1.0 }],
    });
    const result = categorizeFailureRuleBased(run);
    expect(result.category).toBe('unknown');
  });

  it('should classify severity correctly based on successScore threshold', () => {
    // successScore >= 30, worst = 'high' -> 'high'
    expect(classifySeverity(createMockRun({ successScore: 50, errorSignals: [{ type: 'grasp_slip', severity: 'high', description: '', occurredAtSec: 1 }] }))).toBe('high');
    // successScore < 30, worst = 'high' -> 'critical'
    expect(classifySeverity(createMockRun({ successScore: 20, errorSignals: [{ type: 'grasp_slip', severity: 'high', description: '', occurredAtSec: 1 }] }))).toBe('critical');
    // successScore >= 30, worst = 'medium' -> 'medium'
    expect(classifySeverity(createMockRun({ successScore: 50, errorSignals: [{ type: 'grasp_slip', severity: 'medium', description: '', occurredAtSec: 1 }] }))).toBe('medium');
    // successScore < 30, worst = 'medium' -> 'high' (not 'critical' because rank < 3)
    expect(classifySeverity(createMockRun({ successScore: 20, errorSignals: [{ type: 'grasp_slip', severity: 'medium', description: '', occurredAtSec: 1 }] }))).toBe('high');
    // successScore < 30, worst = 'low' -> 'high' (fallback for low successScore)
    expect(classifySeverity(createMockRun({ successScore: 20, errorSignals: [{ type: 'grasp_slip', severity: 'low', description: '', occurredAtSec: 1 }] }))).toBe('high');
  });

  it('should have complete FAILURE_TAXONOMY', () => {
    expect(FAILURE_TAXONOMY.length).toBeGreaterThan(0);
    for (const entry of FAILURE_TAXONOMY) {
      expect(entry).toHaveProperty('category');
      expect(entry).toHaveProperty('label');
      expect(entry).toHaveProperty('keywords');
      expect(Array.isArray(entry.keywords)).toBe(true);
    }
  });

  it('should find highest severity signal', () => {
    const run = createMockRun({
      errorSignals: [
        { type: 'grasp_slip', severity: 'medium', description: '', occurredAtSec: 1 },
        { type: 'contact_jam', severity: 'high', description: '', occurredAtSec: 2 },
        { type: 'timeout', severity: 'low', description: '', occurredAtSec: 3 },
      ],
    });
    const highest = highestSeveritySignal(run);
    expect(highest).not.toBeNull();
    expect(highest?.severity).toBe('high');
  });

  it('should return null for runs with no error signals', () => {
    const run = createMockRun({ errorSignals: [] });
    const highest = highestSeveritySignal(run);
    expect(highest).toBeNull();
  });
});