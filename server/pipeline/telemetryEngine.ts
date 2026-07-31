export interface TelemetryPoint {
  step: number;
  timeSec: number;
  reward: number;
  jointTorqueAvg: number;
  eefPositionErrorMm: number;
  collisionForceN: number;
  actionMagnitude: number;
}

export interface PipelineMetrics {
  successRatePct: number;
  meanTrajectoryTimeSec: number;
  simToRealConfidencePct: number;
  energyScoreJoule: number;
  totalSimRuns: number;
  telemetry: TelemetryPoint[];
}

export function generateSimulationTelemetry(dof: number, domainRandomization: boolean): PipelineMetrics {
  const stepsCount = 25;
  const timeStep = 0.2;
  const telemetry: TelemetryPoint[] = [];

  let totalEnergyJ = 0;

  for (let i = 0; i < stepsCount; i++) {
    const timeSec = +(i * timeStep).toFixed(2);
    // Smooth sigmoid/power reward progression
    const reward = +(Math.min(1.0, Math.pow(i / 18, 1.4) + Math.sin(i * 0.4) * 0.02)).toFixed(3);

    // Exponentially decaying joint torque as impedance stabilizes
    const torqueBase = 12.0 * Math.exp(-i / 7) + 2.8 + (dof > 10 ? 15 : 0);
    const jointTorqueAvg = +(torqueBase + (Math.sin(i * 0.5) * 0.8)).toFixed(2);
    totalEnergyJ += jointTorqueAvg * 0.1;

    // End effector tracking error in mm
    const eefPositionErrorMm = +(Math.max(0.2, 42.0 * Math.exp(-i / 5.5) + (Math.random() * 0.2))).toFixed(2);

    // Contact spike around contact phase (steps 11-15)
    let collisionForceN = 0.3 + Math.random() * 0.2;
    if (i >= 11 && i <= 15) {
      collisionForceN = 6.2 + Math.random() * 2.4;
    }
    collisionForceN = +collisionForceN.toFixed(1);

    const actionMagnitude = +(0.75 * Math.exp(-i / 12) + 0.08).toFixed(3);

    telemetry.push({
      step: i * 10,
      timeSec,
      reward,
      jointTorqueAvg,
      eefPositionErrorMm,
      collisionForceN,
      actionMagnitude,
    });
  }

  const baseSuccess = 94.5 + Math.random() * 4.0;
  const simToReal = domainRandomization ? 93.8 + Math.random() * 4.0 : 85.2 + Math.random() * 4.0;

  return {
    successRatePct: +baseSuccess.toFixed(1),
    meanTrajectoryTimeSec: +(stepsCount * timeStep * 0.85).toFixed(1),
    simToRealConfidencePct: +simToReal.toFixed(1),
    energyScoreJoule: +totalEnergyJ.toFixed(1),
    totalSimRuns: Math.floor(1000 + Math.random() * 2000),
    telemetry,
  };
}
