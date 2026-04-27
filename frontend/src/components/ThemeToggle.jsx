import { useState, useRef } from 'react';
import { useTheme } from '../context/ThemeContext';

const SunIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
    <circle cx="12" cy="12" r="5" />
    <line x1="12" y1="1" x2="12" y2="3" />
    <line x1="12" y1="21" x2="12" y2="23" />
    <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
    <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
    <line x1="1" y1="12" x2="3" y2="12" />
    <line x1="21" y1="12" x2="23" y2="12" />
    <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
    <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
  </svg>
);

const MoonIcon = () => (
  <svg width="22" height="22" viewBox="0 0 24 24" fill="currentColor">
    <path d="M21 12.79A9 9 0 1 1 11.21 3 7 7 0 0 0 21 12.79z" />
  </svg>
);

export default function ThemeToggle() {
  const { isDark, toggleTheme } = useTheme();
  const [animating, setAnimating] = useState(false);
  const [flyPos, setFlyPos] = useState(null);
  const btnRef = useRef(null);

  const handleClick = () => {
    if (animating) return;
    const rect = btnRef.current.getBoundingClientRect();
    setFlyPos({ x: rect.left + rect.width / 2, y: rect.top + rect.height / 2, goingDark: !isDark });
    setAnimating(true);
    setTimeout(() => toggleTheme(), 450);
    setTimeout(() => { setFlyPos(null); setAnimating(false); }, 900);
  };

  return (
    <>
      {flyPos && (
        <div
          className={`fly-ripple ${flyPos.goingDark ? 'ripple-dark' : 'ripple-light'}`}
          style={{ left: flyPos.x, top: flyPos.y }}
        />
      )}
      {flyPos && (
        <div
          className={`fly-icon ${flyPos.goingDark ? 'fly-set' : 'fly-rise'}`}
          style={{ left: flyPos.x, top: flyPos.y }}
        >
          {flyPos.goingDark ? <SunIcon /> : <MoonIcon />}
        </div>
      )}
      <button
        ref={btnRef}
        className={`theme-btn ${animating ? 'btn-spin' : ''}`}
        onClick={handleClick}
        title={isDark ? 'Chuyển sang sáng' : 'Chuyển sang tối'}
      >
        <span className={animating ? 'icon-hide' : 'icon-show'}>
          {isDark ? <SunIcon /> : <MoonIcon />}
        </span>
      </button>
    </>
  );
}
