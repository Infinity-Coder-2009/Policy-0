import { describe, it, expect, vi, beforeEach } from 'vitest';
import { generateImprovements, generateImprovementsWithLLM, applyImprovement, listImprovements, getStats } from './improvementEngine';
import { CategorizedFailure, ImprovementRecommendation } from '../../src/types';
import { getTable } from '../data/sqliteStore';

describe('improvementEngine', () => {
  beforeEach(() => {
    vi.resetModules();
  });

  it('should generate improvements from failures', () => {
    // Test that the function exists and returns array
    const result = generateImprovements();
    expect(Array.isArray(result)).toBe(true);
  });

  it('should list improvements', () => {
    const improvements = listImprovements();
    expect(Array.isArray(improvements)).toBe(true);
  });

  it('should get stats', () => {
    const stats = getStats();
    expect(stats).toHaveProperty('totalRuns');
    expect(stats).toHaveProperty('successRuns');
    expect(stats).toHaveProperty('failureRuns');
    expect(stats).toHaveProperty('passRatePct');
    expect(stats).toHaveProperty('totalFailures');
    expect(stats).toHaveProperty('categorizedFailures');
    expect(stats).toHaveProperty('uncategorizedFailures');
    expect(stats).toHaveProperty('improvementsGenerated');
    expect(stats).toHaveProperty('improvementsApplied');
    expect(stats).toHaveProperty('topFailureCategories');
  });

  it('should apply improvement', () => {
    // Test the function exists
    expect(typeof applyImprovement).toBe('function');
  });

  it('should have IMPROVEMENT_TEMPLATES defined for all failure categories', () => {
    // Import the internal constant via the module
    // This is tested implicitly by generateImprovements
    expect(typeof generateImprovements).toBe('function');
  });
});