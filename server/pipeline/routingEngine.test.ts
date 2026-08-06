import { describe, it, expect } from 'vitest';
import { evaluatePolicyRouting } from './routingEngine';
import { TaskInput } from '../../src/types';

describe('routingEngine', () => {
  it('should return Plan A for simple manipulation without visual semantics', () => {
    const result = evaluatePolicyRouting({
      title: 'Simple Task',
      description: 'Move end effector to target position',
      robotId: 'franka_panda',
      robotDof: 7,
      robotType: 'arm',
      controlMode: 'Cartesian Impedance',
      observationSpace: ['Joint Encoders'],
      domainRandomization: false,
    });
    expect(result.planType).toBe('Plan A: Symbolic Trajectory Code');
    expect(result.confidence).toBeGreaterThan(0.7);
  });

  it('should return Plan B for vision-based pick and place tasks', () => {
    const result = evaluatePolicyRouting({
      title: 'Test Task',
      description: 'Pick and place a red block',
      robotId: 'franka_panda',
      robotDof: 7,
      robotType: 'arm',
      controlMode: 'Cartesian Impedance',
      observationSpace: ['RGB Camera', 'Joint Encoders'],
      domainRandomization: false,
    });
    expect(result.planType).toBe('Plan B: Neural VLA Policy (ONNX)');
  });

  it('should return Plan C for locomotion tasks', () => {
    const result = evaluatePolicyRouting({
      title: 'Walking Task',
      description: 'Walk forward on flat terrain',
      robotId: 'unitree_h1',
      robotDof: 25,
      robotType: 'humanoid',
      controlMode: 'Joint Velocity',
      observationSpace: ['Joint Encoders', 'IMU'],
      domainRandomization: false,
    });
    expect(result.planType).toBe('Plan C: Reinforcement Learning (PPO)');
  });

  it('should have safety rating A+ or A', () => {
    const result = evaluatePolicyRouting({
      title: 'Test',
      description: 'Test',
      robotId: 'franka_panda',
      robotDof: 7,
      robotType: 'arm',
      controlMode: 'Cartesian Impedance',
      observationSpace: ['Joint Encoders'],
      domainRandomization: false,
    });
    expect(['A+', 'A']).toContain(result.safetyRating);
  });

  it('should provide rationale for the plan selection', () => {
    const result = evaluatePolicyRouting({
      title: 'Test',
      description: 'Test',
      robotId: 'franka_panda',
      robotDof: 7,
      robotType: 'arm',
      controlMode: 'Cartesian Impedance',
      observationSpace: ['Joint Encoders'],
      domainRandomization: false,
    });
    expect(result.rationale).toBeDefined();
    expect(result.rationale.length).toBeGreaterThan(10);
  });

  it('should estimate simulation time', () => {
    const result = evaluatePolicyRouting({
      title: 'Test',
      description: 'Test',
      robotId: 'franka_panda',
      robotDof: 7,
      robotType: 'arm',
      controlMode: 'Cartesian Impedance',
      observationSpace: ['Joint Encoders'],
      domainRandomization: false,
    });
    expect(result.estimatedSimTimeSec).toBeGreaterThan(0);
  });
});