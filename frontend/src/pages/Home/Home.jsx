import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import ThemeToggle from '../../components/ThemeToggle/ThemeToggle';
import LanguageSwitcher from '../../components/LanguageSwitcher/LanguageSwitcher';
import s from './Home.module.css';

export default function Home() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  return (
    <div className={s.page}>
      <div className={s.bg}>
        <div className={`${s.blob} ${s.blob1}`} />
        <div className={`${s.blob} ${s.blob2}`} />
      </div>

      <div className={s.card}>
        <div className={s.emoji}>🛍️</div>

        <p className={s.greeting}>{t('home.welcome')}</p>
        <h1 className={s.username}>{user.username || 'Friend'}</h1>
        <p className={s.subtitle}>{t('home.subtitle')}</p>

        <div className={s.badge}>
          <span>⭐</span>
          {t('home.role')}: {user.role || 'user'}
        </div>

        <div className={s.actions}>
          <button className={s.btnPrimary} onClick={() => navigate('/products')}>
            🛒 {t('home.browseProducts')}
          </button>
          {user.role === 'admin' && (
            <button className={s.btnPrimary} onClick={() => navigate('/admin')}
              style={{ background: 'linear-gradient(135deg, #06B6D4, #7C3AED)' }}>
              ⚡ {t('home.adminPanel')}
            </button>
          )}
          <button className={s.btnSecondary} onClick={handleLogout}>
            {t('home.logout')}
          </button>
        </div>
      </div>
    </div>
  );
}
