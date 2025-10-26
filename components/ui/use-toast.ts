import * as React from 'react';

export type Toast = {
  id: string;
  title?: string;
  description?: string;
  variant?: 'default' | 'destructive';
};

type ToastActionType = { type: 'ADD_TOAST'; toast: Toast } | { type: 'DISMISS_TOAST'; toastId?: string };

const TOAST_LIMIT = 1;

function addToast(state: Toast[], toast: Toast): Toast[] {
  const existing = state.find((t) => t.id === toast.id);
  if (existing) return state;
  return [...state.slice(-(TOAST_LIMIT - 1)), toast];
}

function toastReducer(state: Toast[], action: ToastActionType): Toast[] {
  switch (action.type) {
    case 'ADD_TOAST':
      return addToast(state, action.toast);
    case 'DISMISS_TOAST':
      if (action.toastId) {
        return state.filter((toast) => toast.id !== action.toastId);
      }
      return [];
    default:
      return state;
  }
}

const ToastContext = React.createContext<{ state: Toast[]; dispatch: React.Dispatch<ToastActionType> } | undefined>(undefined);

export function ToastProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = React.useReducer(toastReducer, []);
  return <ToastContext.Provider value={{ state, dispatch }}>{children}</ToastContext.Provider>;
}

export function useToast() {
  const context = React.useContext(ToastContext);
  if (!context) {
    throw new Error('useToast must be used within a ToastProvider');
  }

  function toast(toast: Omit<Toast, 'id'>) {
    const id = crypto.randomUUID();
    context.dispatch({ type: 'ADD_TOAST', toast: { id, ...toast } });
  }

  function dismiss(toastId?: string) {
    context.dispatch({ type: 'DISMISS_TOAST', toastId });
  }

  return { ...context, toast, dismiss };
}
