import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import Clock from '../../components/Clock/Clock';
import ThemeToggle from '../../components/ThemeToggle/ThemeToggle';
import LanguageSwitcher from '../../components/LanguageSwitcher/LanguageSwitcher';
import PasswordInput from '../../components/PasswordInput/PasswordInput';
import s from './AdminDashboard.module.css';

const API = 'http://tuyenxinhtrai.site:8080/api';

const EMPTY_FORM = { username: '', email: '', password: '', role: 'user' };

export default function AdminDashboard() {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { isDark } = useTheme();

  const [users, setUsers]       = useState([]);
  const [loading, setLoading]   = useState(true);
  const [error, setError]       = useState('');
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]         = useState(EMPTY_FORM);
  const [formErr, setFormErr]   = useState('');
  const [formOk, setFormOk]     = useState('');
  const [submitting, setSubmitting] = useState(false);

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/admin/users`, { headers });
      if (res.status === 403) { navigate('/'); return; }
      const data = await res.json();
      setUsers(data.users || []);
    } catch {
      setError(t('admin.fetchError'));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchUsers(); }, [fetchUsers]);

  /* ── Modal handlers ── */
  const openModal = () => { setFormErr(''); setFormOk(''); setShowModal(true); };
  const closeModal = () => setShowModal(false);

  const handleFormChange = e => setForm({ ...form, [e.target.name]: e.target.value });

  const handleCreate = async e => {
    e.preventDefault();
    setFormErr(''); setFormOk('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/admin/users`, {
        method: 'POST', headers,
        body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || t('common.error'));
      setFormOk(t('admin.createSuccess'));
      setForm(EMPTY_FORM); // Chỉ reset khi tạo thành công
      fetchUsers();
      setTimeout(() => closeModal(), 1200);
    } catch (err) {
      setFormErr(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  /* ── Role toggle & delete ── */
  const handleRoleToggle = async (user) => {
    const newRole = user.role === 'admin' ? 'user' : 'admin';
    const res = await fetch(`${API}/admin/users/${user.id}/role`, {
      method: 'PUT', headers, body: JSON.stringify({ role: newRole }),
    });
    if (res.ok) fetchUsers();
  };

  const handleDelete = async (id) => {
    if (!window.confirm(t('admin.confirmDelete'))) return;
    const res = await fetch(`${API}/admin/users/${id}`, { method: 'DELETE', headers });
    if (res.ok) fetchUsers();
  };

  const stats = {
    total:   users.length,
    admins:  users.filter(u => u.role === 'admin').length,
    regular: users.filter(u => u.role === 'user').length,
  };

  return (
    <div className={`${isDark ? 'dark' : 'light'} ${s.page}`}>
      <div className={s.gridBg} />

      {/* ── HEADER ── */}
      <header className={s.header}>
        <div className={s.headerLeft}>
          <button className={s.backBtn} onClick={() => navigate('/')}>← {t('admin.back')}</button>
        </div>
        <div className={s.headerCenter}><Clock /></div>
        <div className={s.headerRight}>
          <LanguageSwitcher />
          <ThemeToggle />
        </div>
      </header>

      {/* ── MAIN ── */}
      <main className={s.main}>
        <div style={{ marginBottom: 28 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 6 }}>
            <span style={{ fontSize: 28 }}>⚡</span>
            <span className={s.logo}>Admin Panel</span>
            <span className={s.logoTag}>SYS</span>
          </div>
          <p style={{ color: 'var(--text-sub)', fontSize: 14 }}>{t('admin.subtitle')}</p>
        </div>

        {/* ── STATS ── */}
        <div className={s.statsGrid}>
          {[
            { icon: '👥', value: stats.total,   label: t('admin.totalUsers') },
            { icon: '🛡️', value: stats.admins,  label: t('admin.totalAdmins') },
            { icon: '🌐', value: stats.regular, label: t('admin.totalRegular') },
          ].map((stat, i) => (
            <div className={s.statCard} key={i}>
              <div className={s.statIcon}>{stat.icon}</div>
              <div className={s.statValue}>{stat.value}</div>
              <div className={s.statLabel}>{stat.label}</div>
            </div>
          ))}
        </div>

        {/* ── USER TABLE ── */}
        <div className={s.panel}>
          <div className={s.panelHeader}>
            <div className={s.panelTitle}>
              <span className={s.dot} />
              {t('admin.userList')}
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <span className={s.count}>{stats.total} {t('admin.records')}</span>
              <button className={s.btnAdd} onClick={openModal}>
                + {t('admin.addUser')}
              </button>
            </div>
          </div>

          <div className={s.tableWrap}>
            {loading ? (
              <div className={s.loading}><div className={s.spinner} /><p>{t('common.loading')}</p></div>
            ) : error ? (
              <div className={s.empty}>⚠️ {error}</div>
            ) : users.length === 0 ? (
              <div className={s.empty}>📭 {t('admin.noUsers')}</div>
            ) : (
              <table>
                <thead>
                  <tr>
                    <th>#</th>
                    <th>ID</th>
                    <th>{t('admin.colUsername')}</th>
                    <th>{t('admin.colEmail')}</th>
                    <th>{t('admin.colRole')}</th>
                    <th>{t('admin.colActions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user, idx) => (
                    <tr key={user.id}>
                      <td style={{ color: 'var(--text-sub)', fontFamily: 'monospace' }}>{idx + 1}</td>
                      <td><span className={s.mono}>{user.id}</span></td>
                      <td style={{ fontWeight: 600 }}>{user.username || <span style={{ color: 'var(--text-sub)' }}>—</span>}</td>
                      <td style={{ color: 'var(--text-sub)' }}>{user.email}</td>
                      <td>
                        <span className={`${s.badge} ${user.role === 'admin' ? s.badgeAdmin : s.badgeUser}`}>
                          {user.role === 'admin' ? '🛡️' : '👤'} {user.role}
                        </span>
                      </td>
                      <td>
                        <div className={s.actions}>
                          <button className={s.btnRole} onClick={() => handleRoleToggle(user)}>
                            {user.role === 'admin' ? t('admin.demote') : t('admin.promote')}
                          </button>
                          <button className={s.btnDelete} onClick={() => handleDelete(user.id)}>
                            {t('admin.delete')}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </main>

      {/* ── CREATE USER MODAL ── */}
      {showModal && (
        <div className={s.overlay} onClick={e => e.target === e.currentTarget && closeModal()}>
          <div className={s.modalOuter}>
            <div className={s.modal}>
              <div className={s.modalHeader}>
                <h2 className={s.modalTitle}>➕ {t('admin.addUser')}</h2>
                <button className={s.closeBtn} onClick={closeModal}>✕</button>
              </div>

              {formErr && <div className={s.formError}>{formErr}</div>}
              {formOk  && <div className={s.formOk}>{formOk}</div>}

              <form onSubmit={handleCreate} className={s.modalForm}>
                <div className={s.fieldGroup}>
                  <label className={s.fieldLabel}>{t('admin.colUsername')}</label>
                  <input className={s.fieldInput} type="text" name="username"
                    placeholder="ten_dang_nhap" value={form.username} onChange={handleFormChange} required />
                </div>
                <div className={s.fieldGroup}>
                  <label className={s.fieldLabel}>{t('admin.colEmail')}</label>
                  <input className={s.fieldInput} type="email" name="email"
                    placeholder="email@example.com" value={form.email} onChange={handleFormChange} required />
                </div>
                <div className={s.fieldGroup}>
                  <label className={s.fieldLabel}>{t('auth.password')}</label>
                  <PasswordInput name="password" placeholder="••••••••"
                    value={form.password} onChange={handleFormChange} />
                </div>
                <div className={s.fieldGroup}>
                  <label className={s.fieldLabel}>{t('admin.colRole')}</label>
                  <select className={s.fieldInput} name="role" value={form.role} onChange={handleFormChange}>
                    <option value="user">👤 User</option>
                    <option value="admin">🛡️ Admin</option>
                  </select>
                </div>
                <div className={s.modalActions}>
                  <button type="button" className={s.btnCancel} onClick={closeModal}>{t('admin.cancel')}</button>
                  <button type="submit"
                    className={`${s.btnSubmit} ${isDark ? s.btnSubmitDark : s.btnSubmitLight}`}
                    disabled={submitting}>
                    {submitting ? <span className={s.spinnerSm} /> : t('admin.createBtn')}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
