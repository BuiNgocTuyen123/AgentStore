import { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import s from './UserMenu.module.css';

export default function UserMenu() {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);
  const navigate = useNavigate();

  // Đóng dropdown khi click ra ngoài
  useEffect(() => {
    const handler = e => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const token = localStorage.getItem('token');
  if (!token) return null; // Không hiển thị nếu chưa đăng nhập

  const user = JSON.parse(localStorage.getItem('user') || '{}');
  
  // Avatar mặc định nếu không có
  const defaultAvatar = `https://ui-avatars.com/api/?name=${user.username || 'User'}&background=random`;
  const avatar = user.avatar || defaultAvatar;

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/login');
  };

  const navigateTo = (path) => {
    setOpen(false);
    navigate(path);
  };

  return (
    <div className={s.wrapper} ref={ref}>
      <div className={s.avatarContainer} onClick={() => setOpen(v => !v)}>
        {user.role === 'admin' && (
          <div className={s.crown}>👑</div>
        )}
        <img src={avatar} alt="Avatar" className={s.avatar} />
      </div>

      {open && (
        <div className={s.dropdown}>
          <div className={s.userInfo}>
            <div className={s.userName}>{user.username}</div>
            <div className={s.userEmail}>{user.email}</div>
          </div>
          <div className={s.divider}></div>
          <button className={s.option} onClick={() => navigateTo('/')}>
            🏠 Trang chủ
          </button>
          <button className={s.option} onClick={() => navigateTo('/products')}>
            🛒 Sản phẩm
          </button>
          {user.role === 'admin' && (
            <button className={s.option} onClick={() => navigateTo('/admin')}>
              ⚡ Bảng điều khiển (Admin)
            </button>
          )}
          <button className={s.option} onClick={() => navigateTo('/super-profiles')}>
            🎭 KOL Manager
          </button>
          <div className={s.divider}></div>
          <button className={`${s.option} ${s.logout}`} onClick={handleLogout}>
            🚪 Đăng xuất
          </button>
        </div>
      )}
    </div>
  );
}
