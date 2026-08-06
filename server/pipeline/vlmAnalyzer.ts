import { GoogleGenAI, Type } from '@google/genai';
import { VLMAnalysisResult, VideoUpload } from '../../src/types';

function getGeminiClient() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error('GEMINI_API_KEY is not defined in environment variables.');
  }
  return new GoogleGenAI({
    apiKey,
    httpOptions: {
      headers: {
        'User-Agent': 'aistudio-build',
      },
    },
  });
}

export async function analyzeVideoWithVLM(videoPath: string, prompt: string): Promise<VLMAnalysisResult> {
  const ai = getGeminiClient();

  const videoFile = await ai.files.upload({
    file: videoPath,
    config: {
      mimeType: 'video/mp4',
    },
  });

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: [
      {
        text: prompt,
      },
      {
        fileData: {
          fileUri: videoFile.uri,
          mimeType: 'video/mp4',
        },
      },
    ],
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          taskTitle: { type: Type.STRING },
          taskDescription: { type: Type.STRING },
          robotType: { type: Type.STRING },
          robotDof: { type: Type.NUMBER },
          controlMode: { type: Type.STRING },
          observationSpace: { type: Type.ARRAY, items: { type: Type.STRING } },
          environment: { type: Type.STRING },
          keyframes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                stage: { type: Type.STRING },
                timestamp: { type: Type.STRING },
                gripperState: { type: Type.STRING },
                actionDescription: { type: Type.STRING },
              },
              required: ['stage', 'timestamp', 'gripperState', 'actionDescription'],
            },
          },
          obstacleConstraints: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendedControlMode: { type: Type.STRING },
          simToRealTips: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: [
          'taskTitle',
          'taskDescription',
          'robotType',
          'robotDof',
          'controlMode',
          'observationSpace',
          'environment',
          'keyframes',
          'obstacleConstraints',
          'recommendedControlMode',
          'simToRealTips',
        ],
      },
    },
  });

  const parsed = JSON.parse(response.text || '{}');

  const result: VLMAnalysisResult = {
    id: `vlm_${Date.now().toString(36)}`,
    videoUploadId: '',
    taskTitle: parsed.taskTitle || 'Untitled Task',
    taskDescription: parsed.taskDescription || '',
    robotType: parsed.robotType || 'arm',
    robotDof: parsed.robotDof || 7,
    controlMode: parsed.controlMode || 'Cartesian Impedance',
    observationSpace: Array.isArray(parsed.observationSpace) ? parsed.observationSpace : ['RGB Camera', 'Joint Encoders'],
    environment: parsed.environment || 'MuJoCo',
    keyframes: Array.isArray(parsed.keyframes) ? parsed.keyframes : [],
    obstacleConstraints: Array.isArray(parsed.obstacleConstraints) ? parsed.obstacleConstraints : [],
    recommendedControlMode: parsed.recommendedControlMode || 'Cartesian Impedance',
    simToRealTips: Array.isArray(parsed.simToRealTips) ? parsed.simToRealTips : [],
    confidence: 0.9,
    analyzedAt: new Date().toISOString(),
  };

  return result;
}

export async function analyzeVideoWithVLMFromDescription(description: string): Promise<VLMAnalysisResult> {
  const ai = getGeminiClient();

  const prompt = `Analyze this robot task description and extract structured task specifications.

Task Description: "${description}"

Output a JSON object with:
1. taskTitle: A concise title for the robot task.
2. taskDescription: Detailed description of the task.
3. robotType: The type of robot needed (arm, humanoid, hand, mobile_manipulator).
4. robotDof: Degrees of freedom required (integer).
5. controlMode: Best control mode (Cartesian Impedance, Joint Velocity, Delta EE Pose, Action Chunks).
6. observationSpace: Array of observation modalities needed.
7. environment: Simulation environment (MuJoCo, Isaac Sim, Drake, PyBullet).
8. keyframes: Array of 4 key stages with stage name, timestamp, gripper state, and action description.
9. obstacleConstraints: Array of identified obstacles or collision risks.
10. recommendedControlMode: The recommended control mode string.
11. simToRealTips: Array of 3 calibration recommendations.

Be precise and thorough in the analysis.`;

  const response = await ai.models.generateContent({
    model: 'gemini-3.6-flash',
    contents: prompt,
    config: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          taskTitle: { type: Type.STRING },
          taskDescription: { type: Type.STRING },
          robotType: { type: Type.STRING },
          robotDof: { type: Type.NUMBER },
          controlMode: { type: Type.STRING },
          observationSpace: { type: Type.ARRAY, items: { type: Type.STRING } },
          environment: { type: Type.STRING },
          keyframes: {
            type: Type.ARRAY,
            items: {
              type: Type.OBJECT,
              properties: {
                stage: { type: Type.STRING },
                timestamp: { type: Type.STRING },
                gripperState: { type: Type.STRING },
                actionDescription: { type: Type.STRING },
              },
              required: ['stage', 'timestamp', 'gripperState', 'actionDescription'],
            },
          },
          obstacleConstraints: { type: Type.ARRAY, items: { type: Type.STRING } },
          recommendedControlMode: { type: Type.STRING },
          simToRealTips: { type: Type.ARRAY, items: { type: Type.STRING } },
        },
        required: [
          'taskTitle',
          'taskDescription',
          'robotType',
          'robotDof',
          'controlMode',
          'observationSpace',
          'environment',
          'keyframes',
          'obstacleConstraints',
          'recommendedControlMode',
          'simToRealTips',
        ],
      },
    },
  });

  const parsed = JSON.parse(response.text || '{}');

  const result: VLMAnalysisResult = {
    id: `vlm_${Date.now().toString(36)}`,
    videoUploadId: '',
    taskTitle: parsed.taskTitle || 'Untitled Task',
    taskDescription: parsed.taskDescription || description,
    robotType: parsed.robotType || 'arm',
    robotDof: parsed.robotDof || 7,
    controlMode: parsed.controlMode || 'Cartesian Impedance',
    observationSpace: Array.isArray(parsed.observationSpace) ? parsed.observationSpace : ['RGB Camera', 'Joint Encoders'],
    environment: parsed.environment || 'MuJoCo',
    keyframes: Array.isArray(parsed.keyframes) ? parsed.keyframes : [],
    obstacleConstraints: Array.isArray(parsed.obstacleConstraints) ? parsed.obstacleConstraints : [],
    recommendedControlMode: parsed.recommendedControlMode || 'Cartesian Impedance',
    simToRealTips: Array.isArray(parsed.simToRealTips) ? parsed.simToRealTips : [],
    confidence: 0.85,
    analyzedAt: new Date().toISOString(),
  };

  return result;
}