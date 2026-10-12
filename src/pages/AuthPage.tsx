import { useEffect, useState } from 'react';
import { yupResolver } from '@hookform/resolvers/yup';
import { useForm } from 'react-hook-form';
import { Link, useNavigate } from 'react-router-dom';
import { useApp } from '../app-context';
import { Icon } from '../components/Icon';
import { Illustration } from '../components/Illustration';
import { loginSchema, PASSWORD_HELP, registerSchema, type AuthFormValues } from '../lib/validation';
import './auth.css';

interface AuthPageProps {
  mode: 'login' | 'register';
}

export function AuthPage({ mode }: AuthPageProps) {
  const isRegister = mode === 'register';
  const title = isRegister ? 'Kayıt ol' : 'Giriş yap';
  const [showPassword, setShowPassword] = useState(false);
  const [isOpeningDemo, setIsOpeningDemo] = useState(false);
  const { signIn, signUp, enterDemo, notify } = useApp();
  const navigate = useNavigate();
  const {
    register,
    handleSubmit,
    reset,
    formState: { errors, isSubmitting },
  } = useForm<AuthFormValues>({
    resolver: yupResolver(isRegister ? registerSchema : loginSchema),
    mode: 'onSubmit',
    reValidateMode: 'onChange',
    defaultValues: { name: '', email: '', password: '' },
  });

  useEffect(() => {
    reset({ name: '', email: '', password: '' });
    setShowPassword(false);
  }, [mode, reset]);

  async function onSubmit(values: AuthFormValues) {
    try {
      if (isRegister) {
        await signUp({ name: values.name ?? '', email: values.email, password: values.password });
      } else {
        await signIn({ email: values.email, password: values.password });
      }
      navigate('/dictionary', { replace: true });
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Giriş yapılamadı. Lütfen tekrar deneyin.',
        'error',
      );
    }
  }

  async function openDemo() {
    setIsOpeningDemo(true);
    try {
      await enterDemo();
      navigate('/dictionary', { replace: true });
    } catch (error) {
      notify(
        error instanceof Error ? error.message : 'Demo açılamadı. Lütfen tekrar deneyin.',
        'error',
      );
    } finally {
      setIsOpeningDemo(false);
    }
  }

  return (
    <main id="main-content" className={`auth-page auth-page--${mode}`}>
      <div className="auth-content">
        <section className="auth-panel" aria-labelledby="auth-title">
          <h1 id="auth-title">{title}</h1>
          <p className="auth-description">
            {isRegister
              ? 'İngilizce kelime dağarcığınızı geliştirmek için hesap oluşturun. Aşağıdaki tüm alanları doldurun:'
              : 'Kelimelerinize ve alıştırmalarınıza kaldığınız yerden devam etmek için giriş yapın:'}
          </p>

          <form
            className="auth-form"
            onSubmit={handleSubmit(onSubmit)}
            noValidate
            aria-busy={isSubmitting}
          >
            {isRegister && (
              <div className="auth-field">
                <label className="auth-sr-only" htmlFor="auth-name">
                  Ad
                </label>
                <input
                  id="auth-name"
                  type="text"
                  autoComplete="name"
                  placeholder="Ad"
                  aria-required="true"
                  aria-invalid={Boolean(errors.name)}
                  aria-describedby={errors.name ? 'auth-name-error' : undefined}
                  {...register('name')}
                />
                {errors.name && (
                  <p className="auth-field-error" id="auth-name-error" role="alert">
                    {errors.name.message}
                  </p>
                )}
              </div>
            )}

            <div className="auth-field">
              <label className="auth-sr-only" htmlFor="auth-email">
                E-posta
              </label>
              <input
                id="auth-email"
                type="email"
                inputMode="email"
                autoComplete="email"
                autoCapitalize="none"
                spellCheck={false}
                placeholder="E-posta"
                aria-required="true"
                aria-invalid={Boolean(errors.email)}
                aria-describedby={errors.email ? 'auth-email-error' : undefined}
                {...register('email')}
              />
              {errors.email && (
                <p className="auth-field-error" id="auth-email-error" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div className="auth-field">
              <label className="auth-sr-only" htmlFor="auth-password">
                Şifre
              </label>
              <div className="auth-password-wrap">
                <input
                  id="auth-password"
                  type={showPassword ? 'text' : 'password'}
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  placeholder="Şifre"
                  aria-required="true"
                  aria-invalid={Boolean(errors.password)}
                  aria-describedby={errors.password ? 'auth-password-error' : 'auth-password-help'}
                  {...register('password')}
                />
                <button
                  className="auth-password-toggle"
                  type="button"
                  onClick={() => setShowPassword((value) => !value)}
                  aria-label={showPassword ? 'Şifreyi gizle' : 'Şifreyi göster'}
                  aria-pressed={showPassword}
                  aria-controls="auth-password"
                >
                  <Icon name={showPassword ? 'eye' : 'eye-off'} size={22} />
                </button>
              </div>
              {errors.password ? (
                <p className="auth-field-error" id="auth-password-error" role="alert">
                  {errors.password.message}
                </p>
              ) : (
                <p className="auth-field-help" id="auth-password-help">
                  {PASSWORD_HELP}
                </p>
              )}
            </div>

            <button
              className="auth-submit button button-primary"
              type="submit"
              disabled={isSubmitting || isOpeningDemo}
            >
              {isSubmitting ? (isRegister ? 'Hesap oluşturuluyor…' : 'Giriş yapılıyor…') : title}
            </button>
          </form>

          <Link className="auth-switch" to={isRegister ? '/login' : '/register'}>
            {isRegister ? 'Giriş yap' : 'Kayıt ol'}
          </Link>
        </section>

        <div className="auth-demo">
          <button
            className="auth-demo-button"
            type="button"
            onClick={openDemo}
            disabled={isOpeningDemo || isSubmitting}
          >
            {isOpeningDemo ? 'Demo açılıyor…' : 'Demoyu dene'}
            <Icon name="arrow-right" size={18} />
          </button>
          <p>Örnek kelimelerle deneyin. Demo ilerlemeniz bu cihazda saklanır.</p>
        </div>
      </div>

      <div className="auth-hero">
        <div className="auth-illustration">
          <Illustration variant="people" />
        </div>
        <p className="auth-tagline">
          Kelime <span>·</span> Çeviri <span>·</span> Dil bilgisi <span>·</span> Gelişim
        </p>
      </div>
    </main>
  );
}
