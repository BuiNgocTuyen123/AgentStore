import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import Clock from '../../components/Clock/Clock';
import s from './SuperProfileDetail.module.css';

const API = '/api';

const PLATFORMS = [
  { id: 'tiktok',    label: 'TikTok',    icon: '🎵', color: '#69C9D0' },
  { id: 'instagram', label: 'Instagram', icon: '📸', color: '#E1306C' },
  { id: 'facebook',  label: 'Facebook',  icon: '👥', color: '#1877F2' },
];

const STATUS_STYLE = {
  draft:    { label: 'Nháp',       color: '#9CA3AF', bg: 'rgba(156,163,175,.15)' },
  active:   { label: 'Đang chạy', color: '#10B981', bg: 'rgba(16,185,129,.15)'  },
  banned:   { label: 'Bị khóa',   color: '#EF4444', bg: 'rgba(239,68,68,.15)'   },
  training: { label: 'Đào tạo',   color: '#F59E0B', bg: 'rgba(245,158,11,.15)'  },
};

const ACC_STATUS = {
  raw:     { label: 'Thô',           color: '#9CA3AF' },
  setup:   { label: 'Running Setup', color: '#3B82F6' },
  farming: { label: 'Đang nuôi',     color: '#10B981' },
  die:     { label: 'Die',           color: '#EF4444' },
};

const EMPTY_ACC = { platform: 'tiktok', username: '', profile_id: '', cookie: '', proxy: '' };

export default function SuperProfileDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const [profile, setProfile]   = useState(null);
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [accForm, setAccForm]   = useState(EMPTY_ACC);
  const [formErr, setFormErr]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab]   = useState('overview');
  const [editStatus, setEditStatus] = useState('');

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchProfile = useCallback(async () => {
    try {
      const res = await fetch(`${API}/super-profiles/${id}`, { headers });
      if (!res.ok) { navigate('/super-profiles'); return; }
      const data = await res.json();
      setProfile(data);
      setEditStatus(data.status);
    } catch { navigate('/super-profiles'); }
  }, [id]);

  const fetchAccounts = useCallback(async () => {
    try {
      const res = await fetch(`${API}/super-profiles/${id}/accounts`, { headers });
      const data = await res.json();
      setAccounts(Array.isArray(data) ? data : []);
    } catch { setAccounts([]); }
  }, [id]);

  useEffect(() => {
    setLoading(true);
    Promise.all([fetchProfile(), fetchAccounts()]).finally(() => setLoading(false));
  }, [fetchProfile, fetchAccounts]);

  const handleAddAccount = async (e) => {
    e.preventDefault();
    setFormErr('');
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/super-profiles/${id}/accounts`, {
        method: 'POST', headers, body: JSON.stringify(accForm),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi thêm account');
      setShowModal(false);
      setAccForm(EMPTY_ACC);
      fetchAccounts();
    } catch (err) {
      setFormErr(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteAccount = async (accId) => {
    if (!window.confirm('Xóa Social Account này?')) return;
    await fetch(`${API}/accounts/${accId}`, { method: 'DELETE', headers });
    fetchAccounts();
  };

  const handleUpdateAccStatus = async (accId, status) => {
    await fetch(`${API}/accounts/${accId}`, {
      method: 'PUT', headers, body: JSON.stringify({ status }),
    });
    fetchAccounts();
  };

  const handleUpdateProfileStatus = async (newStatus) => {
    await fetch(`${API}/super-profiles/${id}`, {
      method: 'PUT', headers,
      body: JSON.stringify({ ...profile, status: newStatus }),
    });
    setEditStatus(newStatus);
    fetchProfile();
  };

  if (loading) {
    return (
      <div className={`${isDark ? 'dark' : 'light'} ${s.page}`}>
        <div className={s.loading}><div className={s.spinner} /><p>Đang tải profile...</p></div>
      </div>
    );
  }

  if (!profile) return null;

  const st = STATUS_STYLE[profile.status] || STATUS_STYLE.draft;

  return (
    <div className={`${isDark ? 'dark' : 'light'} ${s.page}`}>
      <div className={s.gridBg} />

      <main className={s.main}>
        {/* PROFILE HERO */}
        <div className={s.hero}>
          <div className={s.heroAvatar}>
            <span className={s.heroAvatarText}>{profile.name?.[0]?.toUpperCase()}</span>
          </div>
          <div className={s.heroInfo}>
            <div className={s.heroTopRow}>
              <h1 className={s.heroName}>{profile.name}</h1>
              <span className={s.statusBadge} style={{ color: st.color, background: st.bg }}>{st.label}</span>
            </div>
            <div className={s.heroMeta}>
              <span>{profile.gender === 'female' ? '♀️ Nữ' : profile.gender === 'male' ? '♂️ Nam' : '🏳️‍🌈 LGBT'}</span>
              <span>🎂 {profile.age} tuổi</span>
              <span>🎯 {profile.niche || 'Chưa xác định'}</span>
              <span>🌏 {profile.location || '—'}</span>
              <span>🗣️ {profile.language?.toUpperCase() || '—'}</span>
            </div>
            {profile.personality && (
              <p className={s.heroPersonality}>"{profile.personality}"</p>
            )}
            <div className={s.platformRow}>
              {(profile.platforms || []).map(p => {
                const plat = PLATFORMS.find(x => x.id === p);
                return plat ? (
                  <span key={p} className={s.platformChip} style={{ borderColor: plat.color + '44', color: plat.color, background: plat.color + '18' }}>
                    {plat.icon} {plat.label}
                  </span>
                ) : null;
              })}
            </div>
          </div>

          {/* Quick status update */}
          <div className={s.heroActions}>
            <select className={s.statusSelect}
              value={editStatus}
              onChange={e => handleUpdateProfileStatus(e.target.value)}>
              <option value="draft">📝 Nháp</option>
              <option value="training">⚙️ Đào tạo</option>
              <option value="active">🟢 Đang chạy</option>
              <option value="banned">🔴 Bị khóa</option>
            </select>
          </div>
        </div>

        {/* TABS */}
        <div className={s.tabs}>
          {[
            { id: 'overview', label: '📊 Tổng quan' },
            { id: 'accounts', label: `📱 Social Accounts (${accounts.length})` },
          ].map(tab => (
            <button key={tab.id}
              className={`${s.tab} ${activeTab === tab.id ? s.tabActive : ''}`}
              onClick={() => setActiveTab(tab.id)}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB: OVERVIEW */}
        {activeTab === 'overview' && (
          <div className={s.overview}>
            <div className={s.statsRow}>
              {[
                { icon: '📱', label: 'Nền tảng', value: (profile.platforms || []).length },
                { icon: '🟢', label: 'Acc đang chạy', value: accounts.filter(a => a.status === 'active').length },
                { icon: '🔴', label: 'Acc bị khóa',   value: accounts.filter(a => a.status === 'banned').length },
                { icon: '⚡', label: 'Tổng acc',       value: accounts.length },
              ].map((item, i) => (
                <div key={i} className={s.miniStat}>
                  <span className={s.miniStatIcon}>{item.icon}</span>
                  <span className={s.miniStatValue}>{item.value}</span>
                  <span className={s.miniStatLabel}>{item.label}</span>
                </div>
              ))}
            </div>

            <div className={s.infoCard}>
              <h3 className={s.infoTitle}>📋 Thông tin chi tiết</h3>
              <div className={s.infoGrid}>
                {[
                  { label: 'Tên KOL',       value: profile.name },
                  { label: 'Giới tính',     value: profile.gender === 'female' ? 'Nữ' : profile.gender === 'male' ? 'Nam' : 'LGBT' },
                  { label: 'Tuổi',          value: profile.age },
                  { label: 'Ngách',         value: profile.niche || '—' },
                  { label: 'Ngôn ngữ',     value: profile.language || '—' },
                  { label: 'Khu vực',       value: profile.location || '—' },
                  { label: 'Nền tảng',     value: (profile.platforms || []).join(', ') || '—' },
                  { label: 'Trạng thái',   value: st.label },
                ].map((row, i) => (
                  <div key={i} className={s.infoRow}>
                    <span className={s.infoLabel}>{row.label}</span>
                    <span className={s.infoValue}>{row.value}</span>
                  </div>
                ))}
              </div>
              {profile.personality && (
                <div className={s.personalityBox}>
                  <p className={s.personalityLabel}>💬 Backstory / Tính cách</p>
                  <p className={s.personalityText}>{profile.personality}</p>
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB: SOCIAL ACCOUNTS */}
        {activeTab === 'accounts' && (
          <div className={s.accountsTab}>
            <div className={s.accountsHeader}>
              <h3 className={s.accountsTitle}>📱 Social Accounts</h3>
              <p style={{fontSize: 13, color: 'var(--text-sub)'}}>* Thêm tài khoản mới từ "Kho Tài Khoản"</p>
            </div>

            {accounts.length === 0 ? (
              <div className={s.empty}>
                <div className={s.emptyIcon}>📱</div>
                <p>Chưa có Social Account nào cho profile này</p>
                <button className={s.emptyBtn} onClick={() => navigate('/super-profiles/inventory')}>Đến Kho Tài Khoản →</button>
              </div>
            ) : (
              <div className={s.accountGrid}>
                {accounts.map(acc => {
                  const plat = PLATFORMS.find(p => p.id === acc.platform);
                  const accSt = ACC_STATUS[acc.status] || ACC_STATUS.warming;
                  return (
                    <div key={acc.id} className={s.accCard}>
                      <div className={s.accCardTop}>
                        <div className={s.accPlatform} style={{ color: plat?.color }}>
                          <span className={s.accPlatIcon}>{plat?.icon}</span>
                          <span className={s.accPlatLabel}>{plat?.label}</span>
                        </div>
                        <span className={s.accStatus} style={{ color: accSt.color }}>● {accSt.label}</span>
                      </div>

                      <div className={s.accInfo}>
                        <div className={s.accInfoRow}>
                          <span className={s.accInfoLabel}>Username</span>
                          <span className={s.accInfoVal}>{acc.username || <em style={{color:'var(--text-sub)'}}>Chưa có</em>}</span>
                        </div>
                        <div className={s.accInfoRow}>
                          <span className={s.accInfoLabel}>Computer</span>
                          <span className={s.accInfoVal}>{acc.computer || '—'}</span>
                        </div>
                        <div className={s.accInfoRow}>
                          <span className={s.accInfoLabel}>URL Profile</span>
                          <span className={s.accInfoVal} style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            {acc.url ? (
                              <>
                                <a href={acc.url} target="_blank" rel="noreferrer" title={acc.url}
                                  style={{ color: 'var(--accent)', textDecoration: 'none', maxWidth: '100px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block' }}>
                                  {acc.url}
                                </a>
                                <button onClick={() => { navigator.clipboard.writeText(acc.url); alert('Đã copy!'); }}
                                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '13px', opacity: 0.7 }} title="Copy URL">
                                  📋
                                </button>
                              </>
                            ) : '—'}
                          </span>
                        </div>
                      </div>

                      <div className={s.accActions}>
                        <div className={s.statusSelectWrapper}>
                          <div className={s.statusIndicator} style={{ background: accSt.color, boxShadow: `0 0 8px ${accSt.color}` }}></div>
                          <select className={s.accStatusSelect}
                            value={acc.status}
                            onChange={e => handleUpdateAccStatus(acc.id, e.target.value)}>
                            <option value="raw">⚪ Thô</option>
                            <option value="setup">🔵 Running Setup</option>
                            <option value="farming">🟢 Đang nuôi</option>
                            <option value="die">🔴 Die</option>
                          </select>
                        </div>
                        <button className={s.btnDelAcc} onClick={() => handleDeleteAccount(acc.id)}>🗑️</button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  );
}
