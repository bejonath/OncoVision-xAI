import { PredictionResponse, HealthResponse } from '../types/api';

const BASE_URL = 'https://web-production-4d33c.up.railway.app';

export async function checkHealth(): Promise<HealthResponse> {
  const res = await fetch(`${BASE_URL}/health`);
  if (!res.ok) throw new Error('Health check failed');
  return res.json();
}

export async function predictImage(file: File): Promise<PredictionResponse> {
  const form = new FormData();
  form.append('file', file);
  const res = await fetch(`${BASE_URL}/predict`, {
    method: 'POST',
    body: form,
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }));
    throw new Error(err.detail ?? 'Prediction failed');
  }
  return res.json();
}
