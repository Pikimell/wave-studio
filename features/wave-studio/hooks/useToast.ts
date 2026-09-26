'use client';

import { useCallback, useEffect, useState } from 'react';
import type { ToastPayload } from '../domain/types';

export const useToast = () => {
  const [toast, setToast] = useState<ToastPayload | null>(null);

  const showToast = useCallback((message: string) => {
    setToast({ id: Date.now(), message });
  }, []);

  useEffect(() => {
    if (!toast) return;
    const timer = window.setTimeout(() => setToast(null), 3200);
    return () => window.clearTimeout(timer);
  }, [toast]);

  return { toast, showToast };
};
