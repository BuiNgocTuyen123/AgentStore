import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ThemeToggle from '../components/ThemeToggle/ThemeToggle';
import LanguageSwitcher from '../components/LanguageSwitcher/LanguageSwitcher';
import PasswordInput from '../components/PasswordInput/PasswordInput';
import s from '../styles/Auth.module.css';

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
      if (!res.ok) throw new Error(data.error || 'Đăng nhập thất bại');
      localStorage.setItem('token', data.token);
      navigate('/');
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="auth-page">
      <ThemeToggle />
      <div className="auth-bg">
        <div className="blob blob-1" />
        <div className="blob blob-2" />
        <div className="blob blob-3" />
      </div>
      <div className="auth-card">
        <div className="auth-header">
          <div className="auth-logo">🛍️</div>
          <h1 className="auth-title">Chào mừng trở lại</h1>
          <p className="auth-subtitle">Đăng nhập để tiếp tục mua sắm</p>
        </div>

        {error && <div className="auth-error">{error}</div>}

        <form onSubmit={handleSubmit} className="auth-form">
          <div className="form-group">
            <label className="form-label">Email</label>
            <div className="input-wrapper">
              <span className="input-icon">✉️</span>
              <input
                className="form-input"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={form.email}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label className="form-label">Mật khẩu</label>
            <div className="input-wrapper">
              <span className="input-icon">🔒</span>
              <input
                className="form-input"
                type="password"
                name="password"
                placeholder="••••••••"
                value={form.password}
                onChange={handleChange}
                required
              />
            </div>
          </div>

          <button className="auth-btn" type="submit" disabled={loading}>
            {loading ? <span className="btn-spinner" /> : 'Đăng nhập'}
          </button>
        </form>

        <div className="auth-divider">
          <span>HOẶC</span>
        </div>

        <button 
          className="auth-btn auth-btn-google" 
          onClick={() => window.location.href = '/api/auth/google/login'}
        >
          <img src="https://img.icons8.com/color/48/000000/google-logo.png" alt="Google" width="20" />
          Tiếp tục với Google
        </button>

        <p className="auth-switch">
          Chưa có tài khoản?{' '}
          <Link to="/register" className="auth-link">Đăng ký ngay</Link>
        </p>
      </div>
    </div>
  );
}
