import ThemeToggle from '../ThemeToggle/ThemeToggle';
import LanguageSwitcher from '../LanguageSwitcher/LanguageSwitcher';
import UserMenu from '../UserMenu/UserMenu';
import s from './TopNav.module.css';

export default function TopNav() {
  return (
    <div className={s.nav}>
      <ThemeToggle />
      <LanguageSwitcher />
      <UserMenu />
    </div>
  );
}
