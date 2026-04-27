import { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ThemeToggle from '../../components/ThemeToggle/ThemeToggle';
import LanguageSwitcher from '../../components/LanguageSwitcher/LanguageSwitcher';
import PasswordInput from '../../components/PasswordInput/PasswordInput';
import s from '../../styles/Auth.module.css';

export default function Register() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form, setForm] = useState({ username: '', email: '', password: '', confirm: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    if (form.password !== form.confirm) { setError(t('auth.passwordMismatch')); return; }
    setLoading(true);
    try {
      const res = await fetch('/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: form.username, email: form.email, password: form.password }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('common.error'));
      setSuccess(t('auth.registerSuccess'));
      setTimeout(() => navigate('/login'), 1500);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.page}>
      <ThemeToggle />
      <LanguageSwitcher />
      <div className={s.bg}>
        <div className={`${s.blob} ${s.blob1}`} />
        <div className={`${s.blob} ${s.blob2}`} />
        <div className={`${s.blob} ${s.blob3}`} />
      </div>
      <div className={s.card}>
        <div className={s.header}>
          <div className={s.logo}>✨</div>
          <h1 className={s.title}>{t('auth.registerTitle')}</h1>
          <p className={s.subtitle}>{t('auth.registerSubtitle')}</p>
        </div>

        {error   && <div className={s.error}>{error}</div>}
        {success && <div className={s.success}>{success}</div>}

        <form onSubmit={handleSubmit} className={s.form}>
          <div className={s.group}>
            <label className={s.label}>{t('auth.username')}</label>
            <div className={s.inputWrapper}>
              <span className={s.inputIcon}>👤</span>
              <input className={s.input} type="text" name="username"
                placeholder={t('auth.usernamePlaceholder')} value={form.username} onChange={handleChange} required />
            </div>
          </div>
          <div className={s.group}>
            <label className={s.label}>{t('auth.email')}</label>
            <div className={s.inputWrapper}>
              <span className={s.inputIcon}>✉️</span>
              <input className={s.input} type="email" name="email"
                placeholder={t('auth.emailPlaceholder')} value={form.email} onChange={handleChange} required />
            </div>
          </div>
          <div className={s.group}>
            <label className={s.label}>{t('auth.password')}</label>
            <PasswordInput
              name="password"
              placeholder={t('auth.passwordPlaceholder')}
              value={form.password}
              onChange={handleChange}
            />
          </div>
          <div className={s.group}>
            <label className={s.label}>{t('auth.confirmPassword')}</label>
            <PasswordInput
              name="confirm"
              placeholder={t('auth.passwordPlaceholder')}
              value={form.confirm}
              onChange={handleChange}
            />
          </div>
          <button className={s.btn} type="submit" disabled={loading}>
            {loading ? <span className={s.spinner} /> : t('auth.registerBtn')}
          </button>
        </form>

        <p className={s.switchText}>
          {t('auth.hasAccount')}{' '}
          <Link to="/login" className={s.link}>{t('auth.loginLink')}</Link>
        </p>
      </div>
    </div>
  );
}
