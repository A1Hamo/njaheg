// src/context/aiProviderStore.js
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export const useAIProvider = create(
  persist(
    (set, get) => ({
      provider:    'internal',   // 'internal' | 'external'
      language:    'en',
      creativity:  0.7,          // temperature proxy for display
      providerInfo: null,        // fetched from /ai/provider

      setProvider:     (provider)    => set({ provider }),
      setLanguage:     (language)    => set({ language }),
      setCreativity:   (creativity)  => set({ creativity }),
      setProviderInfo: (providerInfo) => set({ providerInfo }),
    }),
    { name: 'najah-ai-provider' }
  )
);
