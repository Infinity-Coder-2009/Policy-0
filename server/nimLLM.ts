const NIM_LLM_ENDPOINT = process.env.NIM_LLM_ENDPOINT || 'https://api.nvidia.com/v1/nim/llama-3-70b';
const NVIDIA_API_KEY = process.env.NVIDIA_API_KEY;

interface NIMMessage {
  role: 'system' | 'user' | 'assistant';
  content: string;
}

interface NIMRequest {
  model: string;
  messages: NIMMessage[];
  temperature?: number;
  max_tokens?: number;
  response_format?: { type: 'json_object' };
}

interface NIMResponse {
  choices: Array<{
    message: { content: string };
  }>;
}

function getNVIDIAHeaders(): Record<string, string> {
  return {
    'Authorization': `Bearer ${NVIDIA_API_KEY}`,
    'Content-Type': 'application/json',
  };
}

export async function callNIMLLM(
  messages: NIMMessage[],
  options: { jsonSchema?: object; temperature?: number; model?: string } = {}
): Promise<string> {
  if (!NVIDIA_API_KEY) {
    throw new Error('NVIDIA_API_KEY is not defined in environment variables. NIM LLM requires NVIDIA_API_KEY.');
  }

  const payload: NIMRequest = {
    model: options.model || 'meta/llama-3.1-70b-instruct',
    messages,
    temperature: options.temperature ?? 0.2,
    max_tokens: 4096,
    ...(options.jsonSchema && { response_format: { type: 'json_object' } }),
  };

  const response = await fetch(NIM_LLM_ENDPOINT, {
    method: 'POST',
    headers: getNVIDIAHeaders(),
    body: JSON.stringify(payload),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`NIM LLM error: ${response.status} - ${errorText}`);
  }

  const data: NIMResponse = await response.json();
  return data.choices[0].message.content;
}

export async function callNIMLLMStructured<T>(
  messages: NIMMessage[],
  schema: object,
  options: { temperature?: number; model?: string } = {}
): Promise<T> {
  const content = await callNIMLLM(messages, { jsonSchema: schema, ...options });
  return JSON.parse(content);
}

export function isNIMLLMAvailable(): boolean {
  return !!NVIDIA_API_KEY;
}

export function getNIMLLMConfig() {
  return {
    endpoint: NIM_LLM_ENDPOINT,
    available: !!NVIDIA_API_KEY,
  };
}