import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { useTheme } from '../../context/ThemeContext';
import s from './SuperProfiles.module.css';

const API = '/api';

const PLATFORMS = [
  { id: 'tiktok',    label: 'TikTok',    icon: '🎵' },
  { id: 'instagram', label: 'Instagram', icon: '📸' },
  { id: 'facebook',  label: 'Facebook',  icon: '👥' },
];

const GENDERS = [
  { value: 'female', label: 'Nữ',  icon: '♀️' },
  { value: 'male',   label: 'Nam', icon: '♂️' },
  { value: 'lgbt',   label: 'LGBT',icon: '🏳️‍🌈' },
];

const NICHES = ['Thời trang', 'Du lịch', 'Ẩm thực', 'Công nghệ', 'Gym & Fitness', 'Lifestyle', 'Gaming', 'Beauty'];

const EMPTY = {
  name: '', niche: '', personality: '', gender: 'female',
  age: 22, language: 'vi', location: 'vi', platforms: [],
};

const STATUS_STYLE = {
  draft:    { label: 'Nháp',       color: '#9CA3AF', bg: 'rgba(156,163,175,0.15)' },
  active:   { label: 'Đang chạy', color: '#10B981', bg: 'rgba(16,185,129,0.15)'  },
  banned:   { label: 'Bị khóa',   color: '#EF4444', bg: 'rgba(239,68,68,0.15)'   },
  training: { label: 'Đào tạo',   color: '#F59E0B', bg: 'rgba(245,158,11,0.15)'  },
};

export default function SuperProfiles() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const locFilter = searchParams.get('loc'); // vi, kr, th...

  const { isDark } = useTheme();

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading]   = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]         = useState(EMPTY);
  const [formErr, setFormErr]   = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [searchQ, setSearchQ]   = useState('');

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`${API}/super-profiles`, { headers });
      const data = await res.json();
      setProfiles(Array.isArray(data) ? data : []);
    } catch {
      setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchProfiles(); }, [fetchProfiles]);

  const togglePlatform = (pid) => {
    setForm(f => ({
      ...f,
      platforms: f.platforms.includes(pid)
        ? f.platforms.filter(p => p !== pid)
        : [...f.platforms, pid],
    }));
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormErr('');
    if (form.platforms.length === 0) { setFormErr('Vui lòng chọn ít nhất 1 nền tảng'); return; }
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/super-profiles`, {
        method: 'POST', headers,
        body: JSON.stringify({ ...form, age: Number(form.age) }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi tạo profile');
      setShowModal(false);
      setForm(EMPTY);
      fetchProfiles();
    } catch (err) {
      setFormErr(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id, e) => {
    e.stopPropagation();
    if (!window.confirm('Xóa Super Profile này và tất cả Social Accounts liên quan?')) return;
    await fetch(`${API}/super-profiles/${id}`, { method: 'DELETE', headers });
    fetchProfiles();
  };

  const filtered = profiles.filter(p => {
    const matchSearch = p.name?.toLowerCase().includes(searchQ.toLowerCase()) || 
                        p.niche?.toLowerCase().includes(searchQ.toLowerCase());
    const matchLoc = locFilter ? (p.location === locFilter || p.language === locFilter) : true;
    return matchSearch && matchLoc;
  });

  const stats = {
    total:   profiles.length,
    active:  profiles.filter(p => p.status === 'active').length,
    banned:  profiles.filter(p => p.status === 'banned').length,
    draft:   profiles.filter(p => p.status === 'draft').length,
  };

  return (
    <div className={`${isDark ? 'dark' : 'light'} ${s.page}`}>
      <div className={s.gridBg} />

      <main className={s.main}>
        {/* TITLE */}
        <div className={s.titleRow}>
          <div>
            <div className={s.titleLine}>
              <span className={s.titleIcon}>🤖</span>
              <h1 className={s.title}>Super Profiles</h1>
              <span className={s.titleTag}>KOL MANAGER</span>
            </div>
            <p className={s.subtitle}>Quản lý toàn bộ nhân vật ảo đa nền tảng của bạn</p>
          </div>
          <button className={s.btnCreate} onClick={() => { setShowModal(true); setFormErr(''); setForm(EMPTY); }}>
            + Tạo Super Profile
          </button>
        </div>

        {/* STATS */}
        <div className={s.statsGrid}>
          {[
            { icon: '🎭', value: stats.total,  label: 'Tổng profiles',    color: 'var(--accent)' },
            { icon: '🟢', value: stats.active, label: 'Đang hoạt động',  color: '#10B981' },
            { icon: '📝', value: stats.draft,  label: 'Đang nháp',       color: '#F59E0B' },
            { icon: '🔴', value: stats.banned, label: 'Bị khóa',         color: '#EF4444' },
          ].map((s2, i) => (
            <div className={s.statCard} key={i}>
              <span className={s.statIcon}>{s2.icon}</span>
              <span className={s.statValue} style={{ color: s2.color }}>{s2.value}</span>
              <span className={s.statLabel}>{s2.label}</span>
            </div>
          ))}
        </div>

        {/* SEARCH */}
        <div className={s.searchWrap}>
          <span className={s.searchIcon}>🔍</span>
          <input
            className={s.searchInput}
            placeholder="Tìm theo tên hoặc ngách nội dung..."
            value={searchQ}
            onChange={e => setSearchQ(e.target.value)}
          />
        </div>

        {/* PROFILE GRID */}
        {loading ? (
          <div className={s.loading}><div className={s.spinner} /><p>Đang tải...</p></div>
        ) : filtered.length === 0 ? (
          <div className={s.empty}>
            <div className={s.emptyIcon}>🎭</div>
            <p>Chưa có Super Profile nào.{' '}
              <button className={s.emptyBtn} onClick={() => setShowModal(true)}>Tạo ngay!</button>
            </p>
          </div>
        ) : (
          <div className={s.grid}>
            {filtered.map(profile => {
              const st = STATUS_STYLE[profile.status] || STATUS_STYLE.draft;
              return (
                <div key={profile.id} className={s.card} onClick={() => navigate(`/super-profiles/${profile.id}`)}>
                  {/* Avatar circle */}
                  <div className={s.avatar}>
                    <span className={s.avatarText}>{profile.name?.[0]?.toUpperCase() || '?'}</span>
                    <span className={s.genderBadge}>
                      {profile.gender === 'female' ? '♀️' : profile.gender === 'male' ? '♂️' : '🏳️‍🌈'}
                    </span>
                  </div>

                  <div className={s.cardBody}>
                    <div className={s.cardTopRow}>
                      <h3 className={s.cardName}>{profile.name}</h3>
                      <span className={s.statusBadge} style={{ color: st.color, background: st.bg }}>
                        {st.label}
                      </span>
                    </div>

                    <div className={s.cardMeta}>
                      <span>🎯 {profile.niche || 'Chưa xác định'}</span>
                      <span>🎂 {profile.age} tuổi</span>
                      <span>🌏 {profile.location || '—'}</span>
                    </div>

                    {profile.personality && (
                      <p className={s.cardPersonality}>"{profile.personality.slice(0, 80)}{profile.personality.length > 80 ? '...' : ''}"</p>
                    )}

                    <div className={s.platformRow}>
                      {(profile.platforms || []).map(p => {
                        const plat = PLATFORMS.find(x => x.id === p);
                        return plat ? (
                          <span key={p} className={s.platformChip}>
                            {plat.icon} {plat.label}
                          </span>
                        ) : null;
                      })}
                    </div>
                  </div>

                  <div className={s.cardActions}>
                    <button className={s.btnView} onClick={(e) => { e.stopPropagation(); navigate(`/super-profiles/${profile.id}`); }}>
                      Quản lý →
                    </button>
                    <button className={s.btnDelete} onClick={(e) => handleDelete(profile.id, e)}>🗑️</button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </main>

      {/* CREATE MODAL */}
      {showModal && (
        <div className={s.overlay} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className={s.modal}>
            <div className={s.modalHeader}>
              <h2 className={s.modalTitle}>🎭 Tạo Super Profile mới</h2>
              <button className={s.closeBtn} onClick={() => setShowModal(false)}>✕</button>
            </div>

            {formErr && <div className={s.formError}>⚠️ {formErr}</div>}

            <form onSubmit={handleCreate} className={s.form}>
              {/* Tên */}
              <div className={s.fieldGroup}>
                <label className={s.label}>Tên KOL ảo *</label>
                <input className={s.input} placeholder="VD: Anna, Sophia, Minh Anh..." value={form.name}
                  onChange={e => setForm(f => ({ ...f, name: e.target.value }))} required />
              </div>

              {/* Nền tảng */}
              <div className={s.fieldGroup}>
                <label className={s.label}>Nền tảng mạng xã hội *</label>
                <div className={s.checkboxRow}>
                  {PLATFORMS.map(p => (
                    <label key={p.id} className={`${s.checkChip} ${form.platforms.includes(p.id) ? s.checkChipActive : ''}`}>
                      <input type="checkbox" style={{ display: 'none' }}
                        checked={form.platforms.includes(p.id)}
                        onChange={() => togglePlatform(p.id)} />
                      {p.icon} {p.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Giới tính */}
              <div className={s.fieldGroup}>
                <label className={s.label}>Giới tính *</label>
                <div className={s.checkboxRow}>
                  {GENDERS.map(g => (
                    <label key={g.value} className={`${s.checkChip} ${form.gender === g.value ? s.checkChipActive : ''}`}>
                      <input type="radio" style={{ display: 'none' }} name="gender" value={g.value}
                        checked={form.gender === g.value} onChange={e => setForm(f => ({ ...f, gender: e.target.value }))} />
                      {g.icon} {g.label}
                    </label>
                  ))}
                </div>
              </div>

              {/* Tuổi */}
              <div className={s.fieldGroup}>
                <label className={s.label}>Tuổi: <strong>{form.age}</strong></label>
                <input type="range" min={18} max={70} value={form.age}
                  className={s.slider}
                  onChange={e => setForm(f => ({ ...f, age: e.target.value }))} />
                <div className={s.sliderLabels}><span>18</span><span>70</span></div>
              </div>

              {/* Ngách nội dung */}
              <div className={s.fieldGroup}>
                <label className={s.label}>Ngách nội dung</label>
                <select className={s.input} value={form.niche} onChange={e => setForm(f => ({ ...f, niche: e.target.value }))}>
                  <option value="">-- Chọn ngách --</option>
                  {NICHES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>

              {/* Tính cách */}
              <div className={s.fieldGroup}>
                <label className={s.label}>Tính cách / Backstory</label>
                <textarea className={s.textarea} rows={3}
                  placeholder="VD: Cô gái 22 tuổi, vui vẻ, thích màu hồng, hay chia sẻ đời sống hàng ngày..."
                  value={form.personality}
                  onChange={e => setForm(f => ({ ...f, personality: e.target.value }))} />
              </div>

              {/* Ngôn ngữ & Location */}
              <div className={s.twoCol}>
                <div className={s.fieldGroup}>
                  <label className={s.label}>Ngôn ngữ</label>
                  <select className={s.input} value={form.language} onChange={e => setForm(f => ({ ...f, language: e.target.value }))}>
                    <option value="vi">🇻🇳 Tiếng Việt</option>
                    <option value="en">🇺🇸 English</option>
                    <option value="th">🇹🇭 Thai</option>
                    <option value="id">🇮🇩 Indonesian</option>
                  </select>
                </div>
                <div className={s.fieldGroup}>
                  <label className={s.label}>Khu vực</label>
                  <select className={s.input} value={form.location} onChange={e => setForm(f => ({ ...f, location: e.target.value }))}>
                    <option value="vi">🇻🇳 Việt Nam</option>
                    <option value="kr">🇰🇷 Hàn Quốc</option>
                    <option value="th">🇹🇭 Thái Lan</option>
                    <option value="us">🇺🇸 US/UK</option>
                  </select>
                </div>
              </div>

              <div className={s.modalActions}>
                <button type="button" className={s.btnCancel} onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className={s.btnSubmit} disabled={submitting}>
                  {submitting ? <span className={s.spinnerSm} /> : '🚀 Tạo Profile'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
