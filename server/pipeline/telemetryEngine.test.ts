import { describe, it, expect } from 'vitest';
import { generateSimulationTelemetry, PipelineMetrics } from './telemetryEngine';

describe('telemetryEngine', () => {
  it('should generate 25 telemetry points by default', () => {
    const result = generateSimulationTelemetry(7, false);
    expect(result.telemetry).toHaveLength(25);
  });

  it('should generate valid telemetry structure', () => {
    const result = generateSimulationTelemetry(7, false);
    const point = result.telemetry[0];
    expect(point).toHaveProperty('step');
    expect(point).toHaveProperty('timeSec');
    expect(point).toHaveProperty('reward');
    expect(point).toHaveProperty('jointTorqueAvg');
    expect(point).toHaveProperty('eefPositionErrorMm');
    expect(point).toHaveProperty('collisionForceN');
    expect(point).toHaveProperty('actionMagnitude');
  });

  it('should produce exponentially decaying reward curve', () => {
    const result = generateSimulationTelemetry(7, false);
    const rewards = result.telemetry.map((p) => p.reward);
    expect(rewards[0]).toBeLessThan(rewards[rewards.length - 1]);
    expect(rewards[rewards.length - 1]).toBeLessThanOrEqual(1);
  });

  it('should include contact spike at steps 11-15', () => {
    const result = generateSimulationTelemetry(7, false);
    const spikeSteps = result.telemetry
      .filter((p) => p.step >= 110 && p.step <= 150) // step = i * 10, so i=11 is step 110
      .map((p) => p.collisionForceN);
    const nonSpikeSteps = result.telemetry
      .filter((p) => (p.step < 110 || p.step > 150))
      .map((p) => p.collisionForceN);
    const avgSpike = spikeSteps.reduce((a, b) => a + b, 0) / spikeSteps.length;
    const avgNonSpike = nonSpikeSteps.reduce((a, b) => a + b, 0) / nonSpikeSteps.length;
    expect(avgSpike).toBeGreaterThan(avgNonSpike * 3); // Spike should be significantly higher
  });

  it('should compute aggregate metrics at top level', () => {
    const result = generateSimulationTelemetry(7, false);
    expect(result).toHaveProperty('successRatePct');
    expect(result).toHaveProperty('meanTrajectoryTimeSec');
    expect(result).toHaveProperty('simToRealConfidencePct');
    expect(result).toHaveProperty('energyScoreJoule');
    expect(result).toHaveProperty('totalSimRuns');
    expect(result).toHaveProperty('telemetry');
    expect(result.successRatePct).toBeGreaterThan(0);
    expect(result.successRatePct).toBeLessThanOrEqual(100);
  });

  it('should produce different results with domain randomization', () => {
    const result1 = generateSimulationTelemetry(7, false);
    const result2 = generateSimulationTelemetry(7, true);
    expect(result1).not.toBe(result2);
    // Both should have valid structures
    expect(result1).toHaveProperty('telemetry');
    expect(result2).toHaveProperty('telemetry');
    expect(result1.telemetry.length).toBe(25);
    expect(result2.telemetry.length).toBe(25);
  });
});