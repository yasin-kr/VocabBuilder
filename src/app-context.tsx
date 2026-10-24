import { createContext, useCallback, useContext, useEffect, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { configureStore, createSlice } from '@reduxjs/toolkit';
import { Provider, useDispatch, useSelector } from 'react-redux';
import { api } from './services/api';
import type { User } from './types';
import { Icon } from './components/Icon';

const categoriesSlice = createSlice({
  name: 'categories',
  initialState: [] as string[],
  reducers: { loaded: (_, action: { payload: string[] }) => action.payload },
});
const store = configureStore({ reducer: { categories: categoriesSlice.reducer } });
type Toast = { id: number; message: string; kind: 'success' | 'error' | 'info' };
type AppContextValue = {
  user: User | null;
  ready: boolean;
  categories: string[];
  revision: number;
  refresh: () => void;
  signIn: (data: { email: string; password: string }) => Promise<void>;
  signUp: (data: { name: string; email: string; password: string }) => Promise<void>;
  enterDemo: () => Promise<void>;
  logout: () => Promise<void>;
  notify: (message: string, kind?: Toast['kind']) => void;
};
const AppContext = createContext<AppContextValue | null>(null);

function SessionProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [ready, setReady] = useState(false);
  const [revision, setRevision] = useState(0);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const timers = useRef<ReturnType<typeof setTimeout>[]>([]);
  const nextToastId = useRef(0);
  const categories = useSelector((state: ReturnType<typeof store.getState>) => state.categories);
  const dispatch = useDispatch();
  const notify = useCallback((message: string, kind: Toast['kind'] = 'success') => {
    const id = ++nextToastId.current;
    setToasts((items) => [...items.slice(-3), { id, message, kind }]);
    timers.current.push(
      setTimeout(() => setToasts((items) => items.filter((item) => item.id !== id)), 6000),
    );
  }, []);

  useEffect(() => {
    let active = true;
    api
      .restore()
      .then((value) => {
        if (active) setUser(value);
      })
      .catch(() => {})
      .finally(() => {
        if (active) setReady(true);
      });
    return () => {
      active = false;
    };
  }, []);
  useEffect(() => () => timers.current.forEach(clearTimeout), []);
  useEffect(() => {
    let active = true;
    if (user)
      api
        .categories()
        .then((items) => {
          if (active) dispatch(categoriesSlice.actions.loaded(items));
        })
        .catch((error) => notify(errorMessage(error), 'error'));
    else dispatch(categoriesSlice.actions.loaded([]));
    return () => {
      active = false;
    };
  }, [user, dispatch, notify]);

  const value: AppContextValue = {
    user,
    ready,
    categories,
    revision,
    refresh: () => setRevision((value) => value + 1),
    signIn: async (data) => {
      setUser(await api.signIn(data));
    },
    signUp: async (data) => {
      setUser(await api.signUp(data));
    },
    enterDemo: async () => {
      setUser(await api.enterDemo());
    },
    logout: async () => {
      await api.signOut();
      setUser(null);
    },
    notify,
  };
  return (
    <AppContext.Provider value={value}>
      {children}
      <div className="toast-region" aria-live="polite" aria-atomic="false">
        {toasts.map((toast) => (
          <div
            key={toast.id}
            className={`toast toast-${toast.kind}`}
            role={toast.kind === 'error' ? 'alert' : 'status'}
          >
            <Icon name={toast.kind === 'error' ? 'alert' : 'check'} size={20} />
            <span>{toast.message}</span>
            <button
              type="button"
              className="icon-button"
              aria-label="Bildirimi kapat"
              onClick={() => setToasts((items) => items.filter((item) => item.id !== toast.id))}
            >
              <Icon name="close" size={18} />
            </button>
          </div>
        ))}
      </div>
    </AppContext.Provider>
  );
}

export function AppProvider({ children }: { children: ReactNode }) {
  return (
    <Provider store={store}>
      <SessionProvider>{children}</SessionProvider>
    </Provider>
  );
}
export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('AppProvider is missing');
  return context;
}
export function errorMessage(error: unknown) {
  return error instanceof Error ? error.message : 'Bir sorun oluştu. Lütfen tekrar deneyin.';
}
