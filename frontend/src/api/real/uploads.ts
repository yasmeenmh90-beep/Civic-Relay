import { apiClient } from './client';

export interface ImageUploadResponse {
  image_url: string;
  analysis?: {
    category_detected?: string;
    severity_assessment?: string;
    labels?: string[];
    confidence?: number;
  };
}

export interface AudioUploadResponse {
  audio_url: string;
  transcript?: string;
}

/**
 * Uploads an image file to POST /uploads/image.
 */
export async function uploadImage(file: File): Promise<ImageUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('image', file);

  const response = await apiClient<any>('/uploads/image', {
    method: 'POST',
    body: formData,
  });

  return {
    image_url: response.image_url || response.url || response.file_url || '',
    analysis: response.analysis || response.vision_analysis,
  };
}

/**
 * Uploads an audio recording to POST /uploads/audio.
 */
export async function uploadAudio(file: File | Blob): Promise<AudioUploadResponse> {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('audio', file);

  const response = await apiClient<any>('/uploads/audio', {
    method: 'POST',
    body: formData,
  });

  return {
    audio_url: response.audio_url || response.url || '',
    transcript: response.transcript || response.text || '',
  };
}
