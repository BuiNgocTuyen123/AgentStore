import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ThemeToggle from '../../components/ThemeToggle/ThemeToggle';
import LanguageSwitcher from '../../components/LanguageSwitcher/LanguageSwitcher';
import PasswordInput from '../../components/PasswordInput/PasswordInput';
import s from '../../styles/Auth.module.css';

export default function Login() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [form, setForm] = useState({ username: '', password: '' });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const token = params.get('token');
    const urlError = params.get('error');

    if (urlError) {
      setError('Đăng nhập Google thất bại. Vui lòng thử lại.');
    }

    if (token) {
      try {
        // Fix lỗi font tiếng Việt khi decode JWT
        const base64Url = token.split('.')[1];
        const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
        const jsonPayload = decodeURIComponent(atob(base64).split('').map(function(c) {
            return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
        }).join(''));
        
        const payload = JSON.parse(jsonPayload);
        localStorage.setItem('token', token);
        localStorage.setItem('user', JSON.stringify({
          id: payload.user_id,
          username: payload.username,
          email: payload.email,
          role: payload.role,
          avatar: payload.avatar
        }));
        navigate('/');
      } catch (e) {
        setError('Lỗi xác thực Token Google');
      }
    }
  }, [navigate]);

  const handleChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async e => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('common.error'));
      localStorage.setItem('token', data.token);
      localStorage.setItem('user', JSON.stringify(data.user));
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className={s.page}>
      <div className={s.bg}>
        <div className={`${s.blob} ${s.blob1}`} />
        <div className={`${s.blob} ${s.blob2}`} />
        <div className={`${s.blob} ${s.blob3}`} />
      </div>
      <div className={s.card}>
        <div className={s.header}>
          <div className={s.logo}>🛍️</div>
          <h1 className={s.title}>{t('auth.loginTitle')}</h1>
          <p className={s.subtitle}>{t('auth.loginSubtitle')}</p>
        </div>

        {error && <div className={s.error}>{error}</div>}

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
            <label className={s.label}>{t('auth.password')}</label>
            <PasswordInput
              name="password"
              placeholder={t('auth.passwordPlaceholder')}
              value={form.password}
              onChange={handleChange}
            />
          </div>
          <button className={s.btn} type="submit" disabled={loading}>
            {loading ? <span className={s.spinner} /> : t('auth.loginBtn')}
          </button>
        </form>

        <div className={s.divider}>
          <span>HOẶC</span>
        </div>

        <button 
          className={`${s.btn} ${s.btnGoogle}`} 
          onClick={() => window.location.href = '/api/auth/google/login'}
        >
          <img src="https://img.icons8.com/color/48/000000/google-logo.png" alt="Google" width="20" />
          Tiếp tục với Google
        </button>

        <p className={s.switchText}>
          {t('auth.noAccount')}{' '}
          <Link to="/register" className={s.link}>{t('auth.registerLink')}</Link>
        </p>
      </div>
    </div>
  );
}
