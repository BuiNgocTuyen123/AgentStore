import { useState, useRef, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import s from './LanguageSwitcher.module.css';

const LANGUAGES = [
  { code: 'vi', label: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'en', label: 'English',    flag: '🇺🇸' },
];

export default function LanguageSwitcher() {
  const { i18n } = useTranslation();
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  const current = LANGUAGES.find(l => l.code === i18n.language) || LANGUAGES[0];

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const handleSelect = (code) => {
    i18n.changeLanguage(code);
    setOpen(false);
  };

  return (
    <div className={s.wrapper} ref={ref}>
      <button className={s.btn} onClick={() => setOpen(v => !v)} title="Ngôn ngữ / Language">
        {current.flag}
      </button>

      {open && (
        <div className={s.dropdown}>
          {LANGUAGES.map(lang => (
            <button
              key={lang.code}
              className={`${s.option} ${i18n.language === lang.code ? s.active : ''}`}
              onClick={() => handleSelect(lang.code)}
            >
              <span className={s.flag}>{lang.flag}</span>
              {lang.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
