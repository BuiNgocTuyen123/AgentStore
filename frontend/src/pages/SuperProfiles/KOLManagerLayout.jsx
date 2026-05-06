import { useState, useEffect } from 'react';
import { Outlet, useNavigate, useLocation, Link } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import Clock from '../../components/Clock/Clock';
import s from './KOLManagerLayout.module.css';

const MENU_DATA = [
  {
    id: 'kols',
    label: 'Quản lý KOLs',
    icon: '👤',
    path: '/super-profiles',
    children: [
      { label: 'Tất cả', path: '/super-profiles' },
      { label: '🇻🇳 Việt Nam', path: '/super-profiles?loc=vi' },
      { label: '🇰🇷 Hàn Quốc', path: '/super-profiles?loc=kr' },
      { label: '🇹🇭 Thái Lan', path: '/super-profiles?loc=th' },
    ]
  },
  {
    id: 'accounts',
    label: 'Quản lý tài khoản',
    icon: '🗄️',
    path: '/super-profiles/inventory',
    children: [
      { label: 'Tổng quan', path: '/super-profiles/inventory' },
      { label: '🎵 TikTok', path: '/super-profiles/inventory?plat=tiktok' },
      { label: '📸 Instagram', path: '/super-profiles/inventory?plat=instagram' },
      { label: '👥 Facebook', path: '/super-profiles/inventory?plat=facebook' },
    ]
  }
];

export default function KOLManagerLayout() {
  const { isDark } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();
  const currentPath = location.pathname + location.search;

  const [collapsed, setCollapsed] = useState(false);
  const [hoveredMenu, setHoveredMenu] = useState(null);

  // Toggle Sidebar
  const toggleSidebar = () => setCollapsed(!collapsed);

  return (
    <div className={`${isDark ? 'dark' : 'light'} ${s.page}`}>
      <div className={s.gridBg} />

      {/* HEADER GLOBAl */}
      <header className={s.header}>
        <div className={s.headerLeft}>
          <button className={s.backBtn} onClick={() => navigate('/')}>
            <span className={s.backIcon}>←</span> Trang chủ
          </button>
        </div>
        <div className={s.headerCenter}>
          <Clock />
        </div>
        <div className={s.headerRight}></div>
      </header>

      <div className={s.container}>
        {/* SIDEBAR */}
        <aside className={`${s.sidebar} ${collapsed ? s.collapsed : ''}`}>
          <button className={s.toggleBtn} onClick={toggleSidebar} title={collapsed ? "Mở rộng" : "Thu gọn"}>
            {collapsed ? '»' : '«'}
          </button>

          <div className={s.sidebarBrand}>
            <div className={s.brandIconBox}>🤖</div>
            {!collapsed && (
              <div className={s.brandText}>
                <div className={s.brandTitle}>NEXUS</div>
                <div className={s.brandSub}>KOL Workspace</div>
              </div>
            )}
          </div>
          
          <nav className={s.nav}>
            {MENU_DATA.map(item => {
              const isActiveParent = location.pathname.startsWith(item.path);
              const isHovered = hoveredMenu === item.id;
              
              return (
                <div 
                  key={item.id} 
                  className={s.navGroup}
                  onMouseEnter={() => setHoveredMenu(item.id)}
                  onMouseLeave={() => setHoveredMenu(null)}
                >
                  <div className={`${s.navParent} ${isActiveParent ? s.activeParent : ''}`}>
                    <span className={s.navIcon}>{item.icon}</span>
                    {!collapsed && <span className={s.navLabel}>{item.label}</span>}
                    {!collapsed && <span className={s.chevron}>{isHovered ? '▾' : '▸'}</span>}
                  </div>

                  {/* Sub-menu (chỉ hiện khi hover) */}
                  {isHovered && (
                    <div className={`${s.subMenu} ${collapsed ? s.subMenuFloating : ''}`}>
                      {item.children.map(child => {
                        const isActiveChild = currentPath === child.path;
                        return (
                          <Link 
                            key={child.path}
                            to={child.path}
                            className={`${s.subItem} ${isActiveChild ? s.activeSub : ''}`}
                          >
                            {child.label}
                          </Link>
                        );
                      })}
                    </div>
                  )}
                </div>
              );
            })}
          </nav>
        </aside>

        {/* CONTENT */}
        <main className={s.content}>
          <div className={s.contentWrapper}>
            <Outlet />
          </div>
        </main>
      </div>
    </div>
  );
}
