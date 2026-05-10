import { create } from 'zustand';
import { PredictionResponse } from '../types/api';
import { predictImage } from '../api/predict';

type Status = 'idle' | 'loading' | 'success' | 'error';

interface AnalysisState {
  file: File | null;
  previewUrl: string | null;
  status: Status;
  result: PredictionResponse | null;
  error: string | null;
  setFile: (file: File) => void;
  analyze: () => Promise<void>;
  reset: () => void;
}

export const useAnalysisStore = create<AnalysisState>((set, get) => ({
  file: null,
  previewUrl: null,
  status: 'idle',
  result: null,
  error: null,

  setFile: (file: File) => {
    const prev = get().previewUrl;
    if (prev) URL.revokeObjectURL(prev);
    set({
      file,
      previewUrl: URL.createObjectURL(file),
      status: 'idle',
      result: null,
      error: null,
    });
  },

  analyze: async () => {
    const { file } = get();
    if (!file) return;
    set({ status: 'loading', error: null });
    try {
      const result = await predictImage(file);
      set({ status: 'success', result });
    } catch (err) {
      set({ status: 'error', error: (err as Error).message });
    }
  },

  reset: () => {
    const prev = get().previewUrl;
    if (prev) URL.revokeObjectURL(prev);
    set({ file: null, previewUrl: null, status: 'idle', result: null, error: null });
  },
}));
