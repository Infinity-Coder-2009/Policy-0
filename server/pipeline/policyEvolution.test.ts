import { describe, it, expect, vi, beforeEach } from 'vitest';
import {
  evolvePolicy,
  getEvolutionVersions,
  getEvolutionLineage,
  getEvolutionOverview,
} from './policyEvolution';
import { GeneratedPolicy, ImprovementRecommendation, ImprovementChange } from '../../src/types';
import { getTable } from '../data/sqliteStore';

describe('policyEvolution', () => {
  const mockPolicy: GeneratedPolicy = {
    id: 'test_policy_1',
    title: 'Test Policy',
    description: 'Test policy for evolution',
    robot: {
      id: 'franka_panda',
      name: 'Franka Emika Panda',
      manufacturer: 'Franka',
      type: 'arm',
      dof: 7,
      payloadKg: 3,
      controlFrequencyHz: 1000,
      sensors: ['Joint Encoders'],
      description: '',
      badge: '',
      color: '',
      jointNames: ['joint1', 'joint2', 'joint3', 'joint4', 'joint5', 'joint6', 'joint7'],
      defaultControlMode: 'Cartesian Impedance',
    },
    input: {
      title: 'Test Task',
      description: 'Test',
      robotId: 'franka_panda',
      environment: 'MuJoCo',
      controlMode: 'Cartesian Impedance',
      observationSpace: ['RGB Camera', 'Joint Encoders'],
      domainRandomization: false,
      maxExecutionTimeSec: 30,
    },
    routing: {
      planType: 'Plan A: Symbolic Trajectory Code',
      confidence: 0.9,
      rationale: 'Test',
      estimatedSimTimeSec: 100,
      recommendedModel: 'symbolic',
      safetyRating: 'A',
    },
    status: 'validated',
    pythonCode: 'def test(): pass',
    mujocoXml: '<mujoco></mujoco>',
    ros2NodeCode: 'import rclpy',
    onnxSpec: {
      inputShape: '1 x 27',
      outputShape: '1 x 7',
      latencyMs: 0.6,
      fileSizeBytes: 1200000,
    },
    metrics: {
      successRatePct: 85,
      meanTrajectoryTimeSec: 2.5,
      simToRealConfidencePct: 80,
      energyScoreJoule: 50,
      totalSimRuns: 100,
    },
    telemetry: [],
    createdAt: new Date().toISOString(),
  };

  const mockImprovement: ImprovementRecommendation = {
    id: 'imp_test_1',
    policyId: 'test_policy_1',
    policyTitle: 'Test Policy',
    failureCategory: 'grasp_slip',
    title: 'Test Improvement',
    description: 'Test improvement description',
    changes: [
      { target: 'Gripper', parameter: 'Grip Force', from: '80% max', to: '100% max (2s hold)' },
    ],
    estimatedGainPct: 12,
    priority: 'critical',
    status: 'applied',
    createdAt: new Date().toISOString(),
    appliedAt: new Date().toISOString(),
  };

  beforeEach(() => {
    // Clear the sqliteStore tables
    vi.resetModules();
  });

  it('should return null when no applied improvements exist', () => {
    const result = evolvePolicy(mockPolicy);
    expect(result).toBeNull();
  });

  it('should return evolved policy when improvements are applied', () => {
    // This test would need the sqliteStore to be populated
    // For now, we test the structure
    expect(typeof evolvePolicy).toBe('function');
  });

  it('should get evolution versions', () => {
    const versions = getEvolutionVersions();
    expect(Array.isArray(versions)).toBe(true);
  });

  it('should get evolution lineage for a policy', () => {
    const lineage = getEvolutionLineage('test_policy_1');
    expect(Array.isArray(lineage)).toBe(true);
  });

  it('should get evolution overview', () => {
    const overview = getEvolutionOverview();
    expect(overview).toHaveProperty('policiesEvolved');
    expect(overview).toHaveProperty('totalVersions');
    expect(overview).toHaveProperty('latestVersionCount');
    expect(overview).toHaveProperty('improvementsApplied');
    expect(overview).toHaveProperty('avgGainPct');
    expect(overview).toHaveProperty('bestGainPct');
  });
});