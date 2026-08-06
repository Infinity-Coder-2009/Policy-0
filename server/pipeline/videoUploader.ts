import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import { VideoUpload } from '../../src/types';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const uploadsDir = path.join(process.cwd(), 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

export interface VideoUploadResult {
  video: VideoUpload;
  localPath: string;
}

export function storeVideoUpload(fileName: string, mimeType: string, fileSizeBytes: number, localPath: string): VideoUpload {
  const id = `vid_${Date.now().toString(36)}`;
  const video: VideoUpload = {
    id,
    fileName,
    fileSizeBytes,
    mimeType,
    durationSec: 0,
    resolution: 'unknown',
    uploadedAt: new Date().toISOString(),
    localPath,
  };
  return video;
}

export function getVideoUploadPath(videoId: string): string {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const files = fs.readdirSync(uploadsDir).filter((f) => f.startsWith(videoId));
  if (files.length === 0) {
    throw new Error(`Video file not found for ID: ${videoId}`);
  }
  return path.join(uploadsDir, files[0]);
}

export function cleanupVideoUpload(videoId: string): void {
  const uploadsDir = path.join(process.cwd(), 'uploads');
  const files = fs.readdirSync(uploadsDir).filter((f) => f.startsWith(videoId));
  files.forEach((f) => {
    fs.unlinkSync(path.join(uploadsDir, f));
  });
}