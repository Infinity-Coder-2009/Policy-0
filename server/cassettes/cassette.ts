/**
 * Cassette Test Infrastructure for NVIDIA Services
 * ============================================================
 * Records and replays HTTP interactions with NVIDIA APIs.
 * Supports both real mode (records cassettes) and CI mode (replays cassettes).
 * 
 * Usage:
 *   - Set RECORD_CASSETTES=true to record new cassettes against real APIs
 *   - Default: replays from saved cassettes in server/cassettes/
 *   - Each service has its own cassette file
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync } from 'fs';
import { join } from 'path';

const CASSETTE_DIR = join(process.cwd(), 'server', 'cassettes');
const RECORD_MODE = process.env.RECORD_CASSETTES === 'true';

if (!existsSync(CASSETTE_DIR)) {
  mkdirSync(CASSETTE_DIR, { recursive: true });
}

export interface CassetteInteraction {
  request: {
    method: string;
    url: string;
    headers: Record<string, string>;
    body?: any;
  };
  response: {
    status: number;
    headers: Record<string, string>;
    body: any;
  };
  timestamp: string;
}

export interface Cassette {
  service: string;
  interactions: CassetteInteraction[];
  recordedAt: string;
}

let currentCassette: Cassette | null = null;
let interactionIndex = 0;

function sanitizeHeaders(headers: Record<string, string>): Record<string, string> {
  const sanitized = { ...headers };
  // Remove sensitive headers
  delete sanitized['authorization'];
  delete sanitized['Authorization'];
  delete sanitized['x-api-key'];
  delete sanitized['X-Api-Key'];
  return sanitized;
}

export function startCassette(service: string): void {
  const filePath = join(CASSETTE_DIR, `${service}.json`);
  
  if (RECORD_MODE) {
    // Start fresh recording
    currentCassette = {
      service,
      interactions: [],
      recordedAt: new Date().toISOString(),
    };
    interactionIndex = 0;
  } else {
    // Load existing cassette for replay
    if (existsSync(filePath)) {
      const content = readFileSync(filePath, 'utf-8');
      currentCassette = JSON.parse(content);
      interactionIndex = 0;
      console.log(`[Cassette] Loaded ${currentCassette.interactions.length} interactions for ${service}`);
    } else {
      currentCassette = {
        service,
        interactions: [],
        recordedAt: new Date().toISOString(),
      };
      console.warn(`[Cassette] No cassette found for ${service}, will create new`);
    }
  }
}

export function stopCassette(): void {
  if (currentCassette && RECORD_MODE && currentCassette.interactions.length > 0) {
    const filePath = join(CASSETTE_DIR, `${currentCassette.service}.json`);
    writeFileSync(filePath, JSON.stringify(currentCassette, null, 2));
    console.log(`[Cassette] Saved ${currentCassette.interactions.length} interactions for ${currentCassette.service}`);
  }
  currentCassette = null;
  interactionIndex = 0;
}

export async function cassetteFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  const method = options.method || 'GET';
  const requestHeaders = options.headers as Record<string, string> || {};
  const requestBody = options.body;

  const requestKey = `${method}:${url}:${JSON.stringify(sanitizeHeaders(requestHeaders))}:${JSON.stringify(requestBody)}`;

  if (!currentCassette) {
    // No cassette active, pass through to real fetch
    return fetch(url, options);
  }

  if (RECORD_MODE) {
    // Record mode: make real request and save interaction
    const response = await fetch(url, options);
    const responseClone = response.clone();
    const responseBody = await responseClone.json().catch(() => responseClone.text());
    
    currentCassette.interactions.push({
      request: {
        method,
        url,
        headers: sanitizeHeaders(requestHeaders),
        body: requestBody,
      },
      response: {
        status: response.status,
        headers: Object.fromEntries(response.headers.entries()),
        body: responseBody,
      },
      timestamp: new Date().toISOString(),
    });

    return response;
  } else {
    // Replay mode: find matching interaction
    const interaction = currentCassette.interactions.find(
      (i, idx) => idx >= interactionIndex && 
        i.request.method === method && 
        i.request.url === url &&
        JSON.stringify(i.request.headers) === JSON.stringify(sanitizeHeaders(requestHeaders))
    );

    if (!interaction) {
      throw new Error(`[Cassette] No matching interaction found for ${method} ${url} in ${currentCassette.service}. Record new cassettes with RECORD_CASSETTES=true`);
    }

    interactionIndex = currentCassette.interactions.indexOf(interaction) + 1;

    // Return mock response
    const mockResponse = new Response(JSON.stringify(interaction.response.body), {
      status: interaction.response.status,
      headers: interaction.response.headers,
    });

    return mockResponse;
  }
}

// Service-specific cassette helpers
export const cassettes = {
  cosmos: () => startCassette('cosmos_reasoner_nim'),
  nim_llm: () => startCassette('nim_llm'),
  isaac_sim: () => startCassette('isaac_sim'),
  isaac_lab: () => startCassette('isaac_lab'),
  osmo: () => startCassette('osmo'),
  isaac_sim_rtx: () => startCassette('isaac_sim_rtx'),
  leapp_export: () => startCassette('leapp_export'),
  nvidia_video: () => startCassette('nvidia_video'),
  stop: stopCassette,
};

// Patch global fetch for automatic cassette recording/replay
export function patchGlobalFetch(): void {
  if (typeof globalThis.fetch === 'function' && !(globalThis.fetch as any).__cassettePatched) {
    const originalFetch = globalThis.fetch.bind(globalThis);
    (globalThis.fetch as any) = async (url: string | URL | Request, options?: RequestInit) => {
      const urlString = url instanceof URL ? url.toString() : url instanceof Request ? url.url : url;
      
      // Only intercept NVIDIA API calls
      if (typeof urlString === 'string' && (
        urlString.includes('api.nvidia.com') ||
        urlString.includes('localhost:8211') ||
        urlString.includes('localhost:8212') ||
        urlString.includes('omniverse') ||
        urlString.includes('cosmos')
      )) {
        return cassetteFetch(urlString, options);
      }
      return originalFetch(url, options);
    };
    (globalThis.fetch as any).__cassettePatched = true;
  }
}