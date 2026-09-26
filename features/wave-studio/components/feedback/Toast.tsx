import type { ToastPayload } from '../../domain/types';

type ToastProps = {
  toast: ToastPayload | null;
};

export const Toast = ({ toast }: ToastProps) => (
  <div className={`toast ${toast ? 'show' : ''}`} role="status" aria-live="polite">
    {toast?.message}
  </div>
);
