import { Navigate, Outlet, Route, Routes } from 'react-router-dom';
import { useApp } from './app-context';
import { Header } from './components/Header';
import { AuthPage } from './pages/AuthPage';
import { WordsPage } from './pages/WordsPage';
import { TrainingPage } from './pages/TrainingPage';

function PrivateRoute() {
  const { user } = useApp();
  return user ? <Outlet /> : <Navigate to="/login" replace />;
}
function PublicRoute() {
  const { user } = useApp();
  return user ? <Navigate to="/dictionary" replace /> : <Outlet />;
}
export default function App() {
  const { ready, user } = useApp();
  if (!ready)
    return (
      <div className="page-loading" role="status">
        <span className="spinner" />
        Kelimeleriniz hazırlanıyor…
      </div>
    );
  return (
    <>
      <a href="#main-content" className="skip-link">
        İçeriğe geç
      </a>
      <Header />
      {user?.mode === 'demo' && (
        <div className="demo-banner">
          Demo alanı <span>·</span> Örnek kelimeler yalnızca bu tarayıcıda saklanır.
        </div>
      )}
      <Routes>
        <Route element={<PublicRoute />}>
          <Route path="/register" element={<AuthPage mode="register" />} />
          <Route path="/login" element={<AuthPage mode="login" />} />
        </Route>
        <Route element={<PrivateRoute />}>
          <Route path="/dictionary" element={<WordsPage scope="own" />} />
          <Route path="/recommend" element={<WordsPage scope="all" />} />
          <Route path="/training" element={<TrainingPage />} />
        </Route>
        <Route path="*" element={<Navigate to={user ? '/dictionary' : '/register'} replace />} />
      </Routes>
    </>
  );
}
