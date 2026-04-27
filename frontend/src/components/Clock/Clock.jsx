import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import s from './Clock.module.css';

const LOCALE_MAP = {
  vi: 'vi-VN',
  en: 'en-US',
  ja: 'ja-JP',
  zh: 'zh-CN',
  ko: 'ko-KR',
  fr: 'fr-FR',
  de: 'de-DE',
};

export default function Clock() {
  const [time, setTime] = useState(new Date());
  const { i18n } = useTranslation();

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const pad = n => String(n).padStart(2, '0');
  const locale = LOCALE_MAP[i18n.language] || 'en-US';

  const timeStr = `${pad(time.getHours())}:${pad(time.getMinutes())}:${pad(time.getSeconds())}`;
  const dateStr = time.toLocaleDateString(locale, {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric'
  });

  return (
    <div className={s.wrapper}>
      <div className={s.clock}>{timeStr}</div>
      <div className={s.date}>{dateStr}</div>
    </div>
  );
}
