import path from 'path';
import fs from 'fs';
import { OnnxExportResult, GeneratedPolicy } from '../../src/types';

const onnxOutputDir = path.join(process.cwd(), 'exports', 'onnx');
if (!fs.existsSync(onnxOutputDir)) {
  fs.mkdirSync(onnxOutputDir, { recursive: true });
}

export interface OnnxExportOptions {
  policy: GeneratedPolicy;
  format: 'onnx' | 'tensorrt' | 'onnx-tensorrt';
  optimize: boolean;
  quantization: 'fp32' | 'fp16' | 'int8' | null;
}

export async function exportPolicyToONNX(options: OnnxExportOptions): Promise<OnnxExportResult> {
  const { policy, format, optimize, quantization } = options;
  const exportId = `onnx_${Date.now().toString(36)}`;
  const fileName = `${policy.id}_policy.${format === 'tensorrt' ? 'engine' : 'onnx'}`;
  const filePath = path.join(onnxOutputDir, fileName);

  const onnxModelBuffer = await buildONNXModel(policy, format, optimize, quantization);

  fs.writeFileSync(filePath, onnxModelBuffer);

  const result: OnnxExportResult = {
    id: exportId,
    policyId: policy.id,
    onnxModelUrl: `/exports/onnx/${fileName}`,
    onnxModelSizeBytes: onnxModelBuffer.length,
    inputShape: policy.onnxSpec.inputShape,
    outputShape: policy.onnxSpec.outputShape,
    opsetVersion: 17,
    latencyMs: policy.onnxSpec.latencyMs,
    exportedAt: new Date().toISOString(),
    exportFormat: format,
  };

  return result;
}

async function buildONNXModel(
  policy: GeneratedPolicy,
  format: 'onnx' | 'tensorrt' | 'onnx-tensorrt',
  optimize: boolean,
  quantization: 'fp32' | 'fp16' | 'int8' | null,
): Promise<Buffer> {
  const dof = policy.robot.dof;
  const inputDim = dof * 3 + 6;
  const outputDim = dof;

  const modelGraph = buildONNXGraph(inputDim, outputDim, dof, policy.routing.planType);

  const jsonStr = JSON.stringify(modelGraph, null, 2);
  const buffer = Buffer.from(jsonStr);

  return buffer;
}

function buildONNXGraph(
  inputDim: number,
  outputDim: number,
  dof: number,
  planType: string,
): object {
  const nodes: Array<{
    name: string;
    opType: string;
    inputs: string[];
    outputs: string[];
    attributes?: Record<string, any>;
  }> = [];

  const initializers: Array<{
    name: string;
    dataType: string;
    dims: number[];
    values: number[];
  }> = [];

  const inputTensor = {
    name: 'observation',
    dataType: 'tensor(float)',
    dims: [1, inputDim],
  };

  const outputTensor = {
    name: 'action',
    dataType: 'tensor(float)',
    dims: [1, outputDim],
  };

  nodes.push({
    name: 'input',
    opType: 'Identity',
    inputs: ['observation'],
    outputs: ['input_out'],
  });

  if (planType.includes('Symbolic')) {
    const kpValues = new Array(dof).fill(600.0).map((v, i) => i < 3 ? 600.0 : i < 6 ? 400.0 : 50.0);
    const kdValues = kpValues.map((v) => 2.0 * Math.sqrt(v));

    initializers.push({
      name: 'kp_matrix',
      dataType: 'tensor(float)',
      dims: [dof, dof],
      values: kpValues,
    });

    initializers.push({
      name: 'kd_matrix',
      dataType: 'tensor(float)',
      dims: [dof, dof],
      values: kdValues,
    });

    nodes.push({
      name: 'kp_diag',
      opType: 'Diag',
      inputs: ['kp_matrix'],
      outputs: ['kp_diag_out'],
    });

    nodes.push({
      name: 'kd_diag',
      opType: 'Diag',
      inputs: ['kd_matrix'],
      outputs: ['kd_diag_out'],
    });

    nodes.push({
      name: 'neg_qd',
      opType: 'Neg',
      inputs: ['input_out'],
      outputs: ['neg_qd_out'],
    });

    nodes.push({
      name: 'tau',
      opType: 'MatMul',
      inputs: ['kd_diag_out', 'neg_qd_out'],
      outputs: ['tau_out'],
    });

    nodes.push({
      name: 'output',
      opType: 'Identity',
      inputs: ['tau_out'],
      outputs: ['action'],
    });
  } else if (planType.includes('VLA')) {
    const w1Values = new Array(inputDim * 128).fill(0.01);
    const w2Values = new Array(128 * outputDim).fill(0.01);

    initializers.push({
      name: 'w1',
      dataType: 'tensor(float)',
      dims: [inputDim, 128],
      values: w1Values,
    });

    initializers.push({
      name: 'w2',
      dataType: 'tensor(float)',
      dims: [128, outputDim],
      values: w2Values,
    });

    initializers.push({
      name: 'b1',
      dataType: 'tensor(float)',
      dims: [128],
      values: new Array(128).fill(0),
    });

    initializers.push({
      name: 'b2',
      dataType: 'tensor(float)',
      dims: [outputDim],
      values: new Array(outputDim).fill(0),
    });

    nodes.push({
      name: 'fc1',
      opType: 'MatMul',
      inputs: ['input_out', 'w1'],
      outputs: ['fc1_out'],
    });

    nodes.push({
      name: 'add1',
      opType: 'Add',
      inputs: ['fc1_out', 'b1'],
      outputs: ['add1_out'],
    });

    nodes.push({
      name: 'relu1',
      opType: 'Relu',
      inputs: ['add1_out'],
      outputs: ['relu1_out'],
    });

    nodes.push({
      name: 'fc2',
      opType: 'MatMul',
      inputs: ['relu1_out', 'w2'],
      outputs: ['fc2_out'],
    });

    nodes.push({
      name: 'add2',
      opType: 'Add',
      inputs: ['fc2_out', 'b2'],
      outputs: ['add2_out'],
    });

    nodes.push({
      name: 'output',
      opType: 'Identity',
      inputs: ['add2_out'],
      outputs: ['action'],
    });
  } else {
    const w1Values = new Array(inputDim * 256).fill(0.01);
    const w2Values = new Array(256 * 256).fill(0.01);
    const w3Values = new Array(256 * outputDim).fill(0.01);

    initializers.push({
      name: 'w1',
      dataType: 'tensor(float)',
      dims: [inputDim, 256],
      values: w1Values,
    });

    initializers.push({
      name: 'w2',
      dataType: 'tensor(float)',
      dims: [256, 256],
      values: w2Values,
    });

    initializers.push({
      name: 'w3',
      dataType: 'tensor(float)',
      dims: [256, outputDim],
      values: w3Values,
    });

    initializers.push({
      name: 'b1',
      dataType: 'tensor(float)',
      dims: [256],
      values: new Array(256).fill(0),
    });

    initializers.push({
      name: 'b2',
      dataType: 'tensor(float)',
      dims: [256],
      values: new Array(256).fill(0),
    });

    initializers.push({
      name: 'b3',
      dataType: 'tensor(float)',
      dims: [outputDim],
      values: new Array(outputDim).fill(0),
    });

    nodes.push({
      name: 'fc1',
      opType: 'MatMul',
      inputs: ['input_out', 'w1'],
      outputs: ['fc1_out'],
    });

    nodes.push({
      name: 'add1',
      opType: 'Add',
      inputs: ['fc1_out', 'b1'],
      outputs: ['add1_out'],
    });

    nodes.push({
      name: 'relu1',
      opType: 'Relu',
      inputs: ['add1_out'],
      outputs: ['relu1_out'],
    });

    nodes.push({
      name: 'fc2',
      opType: 'MatMul',
      inputs: ['relu1_out', 'w2'],
      outputs: ['fc2_out'],
    });

    nodes.push({
      name: 'add2',
      opType: 'Add',
      inputs: ['fc2_out', 'b2'],
      outputs: ['add2_out'],
    });

    nodes.push({
      name: 'relu2',
      opType: 'Relu',
      inputs: ['add2_out'],
      outputs: ['relu2_out'],
    });

    nodes.push({
      name: 'fc3',
      opType: 'MatMul',
      inputs: ['relu2_out', 'w3'],
      outputs: ['fc3_out'],
    });

    nodes.push({
      name: 'add3',
      opType: 'Add',
      inputs: ['fc3_out', 'b3'],
      outputs: ['add3_out'],
    });

    nodes.push({
      name: 'output',
      opType: 'Identity',
      inputs: ['add3_out'],
      outputs: ['action'],
    });
  }

  const graph = {
    name: `policy0_${planType.replace(/\s+/g, '_')}`,
    inputs: [inputTensor],
    outputs: [outputTensor],
    nodes,
    initializers,
  };

  const model = {
    irVersion: 8,
    opsetImport: [{ domain: '', version: 17 }],
    graph,
  };

  return model;
}

export function getOnnxExportPath(exportId: string): string | null {
  const files = fs.readdirSync(onnxOutputDir);
  const file = files.find((f) => f.startsWith(exportId));
  if (!file) return null;
  return path.join(onnxOutputDir, file);
}

export function serveOnnxFile(fileName: string): Buffer | null {
  const filePath = path.join(onnxOutputDir, fileName);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  return fs.readFileSync(filePath);
}