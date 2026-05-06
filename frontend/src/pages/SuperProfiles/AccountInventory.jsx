import { useState, useEffect, useCallback } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import s from './AccountInventory.module.css';

const API = '/api';

const PLATFORMS = [
  { id: 'tiktok',    label: 'TikTok',    icon: '🎵', color: '#69C9D0' },
  { id: 'instagram', label: 'Instagram', icon: '📸', color: '#E1306C' },
  { id: 'facebook',  label: 'Facebook',  icon: '👥', color: '#1877F2' },
];

const ACC_STATUS = {
  raw:     { label: 'Thô',           color: '#9CA3AF', bg: 'rgba(156,163,175,0.1)' },
  setup:   { label: 'Running Setup', color: '#3B82F6', bg: 'rgba(59,130,246,0.1)' },
  farming: { label: 'Đang nuôi',     color: '#10B981', bg: 'rgba(16,185,129,0.1)' },
  die:     { label: 'Die',           color: '#EF4444', bg: 'rgba(239,68,68,0.1)' },
};

const EMPTY_ACC = { super_profile_id: '', platform: 'tiktok', username: '', url: '', computer: '' };

export default function AccountInventory() {
  const [searchParams] = useSearchParams();
  const initTab = searchParams.get('plat') || 'tiktok';

  const [accounts, setAccounts]   = useState([]);
  const [profiles, setProfiles]   = useState([]); // Để hiển thị select dropdown
  const [loading, setLoading]     = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [form, setForm]           = useState(EMPTY_ACC);
  const [formErr, setFormErr]     = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState(initTab);

  // Khi URL thay đổi (nhấn từ menu), cập nhật tab
  useEffect(() => {
    const plat = searchParams.get('plat');
    if (plat) setActiveTab(plat);
  }, [searchParams]);

  const token = localStorage.getItem('token');
  const headers = { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` };

  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const [resAcc, resProf] = await Promise.all([
        fetch(`${API}/accounts`, { headers }),
        fetch(`${API}/super-profiles`, { headers })
      ]);
      const dataAcc = await resAcc.json();
      const dataProf = await resProf.json();
      setAccounts(Array.isArray(dataAcc) ? dataAcc : []);
      setProfiles(Array.isArray(dataProf) ? dataProf : []);
    } catch {
      setAccounts([]); setProfiles([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const handleCreate = async (e) => {
    e.preventDefault();
    setFormErr('');
    if (!form.super_profile_id) { setFormErr('Vui lòng chọn 1 Super Profile để gán!'); return; }
    
    setSubmitting(true);
    try {
      const res = await fetch(`${API}/accounts`, {
        method: 'POST', headers, body: JSON.stringify(form),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Lỗi thêm account');
      setShowModal(false);
      setForm(EMPTY_ACC);
      fetchData();
    } catch (err) {
      setFormErr(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  const handleUpdateStatus = async (acc, status) => {
    await fetch(`${API}/accounts/${acc.id}`, {
      method: 'PUT', headers, body: JSON.stringify({ ...acc, status }),
    });
    fetchData();
  };

  const handleDelete = async (id) => {
    if (!window.confirm('Xóa Account này khỏi kho?')) return;
    await fetch(`${API}/accounts/${id}`, { method: 'DELETE', headers });
    fetchData();
  };

  const filtered = accounts.filter(a => a.platform === activeTab);

  return (
    <div className={s.page}>
      <div className={s.headerRow}>
        <div>
          <h1 className={s.title}>Kho Tài Khoản</h1>
          <p className={s.subtitle}>Quản lý tài nguyên nuôi acc đa nền tảng</p>
        </div>
        <button className={s.btnCreate} onClick={() => { setShowModal(true); setFormErr(''); setForm(EMPTY_ACC); }}>
          + Thêm Tài Khoản
        </button>
      </div>

      {/* PLATFORM TABS */}
      <div className={s.tabs}>
        {PLATFORMS.map(p => {
          const count = accounts.filter(a => a.platform === p.id).length;
          return (
            <button key={p.id}
              className={`${s.tab} ${activeTab === p.id ? s.tabActive : ''}`}
              onClick={() => setActiveTab(p.id)}
              style={activeTab === p.id ? { borderColor: p.color, color: p.color, background: p.color + '15' } : {}}>
              {p.icon} {p.label} <span className={s.badge}>{count}</span>
            </button>
          );
        })}
      </div>

      {/* LIST */}
      {loading ? (
        <div className={s.loading}><div className={s.spinner} /><p>Đang tải kho...</p></div>
      ) : filtered.length === 0 ? (
        <div className={s.empty}>
          <div className={s.emptyIcon}>📦</div>
          <p>Chưa có tài khoản nào thuộc nền tảng này.</p>
        </div>
      ) : (
        <div className={s.tableWrap}>
          <table className={s.table}>
            <thead>
              <tr>
                <th>Username</th>
                <th>URL</th>
                <th>Computer</th>
                <th>Thuộc Profile (KOL)</th>
                <th>Trạng thái</th>
                <th>Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map(acc => {
                const st = ACC_STATUS[acc.status] || ACC_STATUS.warming;
                const owner = profiles.find(p => p.id === acc.super_profile_id);
                return (
                  <tr key={acc.id}>
                    <td style={{fontWeight: 600}}>{acc.username || '—'}</td>
                    <td>
                      {acc.url ? (
                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                          <a href={acc.url} target="_blank" rel="noreferrer" title={acc.url}
                             style={{ color: 'var(--accent)', textDecoration: 'none', maxWidth: '120px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', display: 'inline-block', verticalAlign: 'middle' }}>
                            {acc.url}
                          </a>
                          <button onClick={() => { navigator.clipboard.writeText(acc.url); alert('Đã copy URL!'); }}
                                  style={{ background: 'transparent', border: 'none', cursor: 'pointer', fontSize: '14px', opacity: 0.7 }}
                                  title="Copy URL">
                            📋
                          </button>
                        </div>
                      ) : '—'}
                    </td>
                    <td>{acc.computer || '—'}</td>
                    <td>
                      {owner ? (
                        <div className={s.ownerTag}>
                          <span className={s.ownerAvatar}>{owner.name?.[0]}</span>
                          {owner.name}
                        </div>
                      ) : <span style={{color:'var(--text-sub)'}}>Không có</span>}
                    </td>
                    <td>
                      <div className={s.statusSelectWrapper}>
                        <div className={s.statusIndicator} style={{ background: st.color, boxShadow: `0 0 8px ${st.color}` }}></div>
                        <select className={s.statusSelect} style={{ color: st.color, background: st.bg }}
                          value={acc.status} onChange={e => handleUpdateStatus(acc, e.target.value)}>
                          <option value="raw">⚪ Thô</option>
                          <option value="setup">🔵 Running Setup</option>
                          <option value="farming">🟢 Đang nuôi</option>
                          <option value="die">🔴 Die</option>
                        </select>
                      </div>
                    </td>
                    <td>
                      <button className={s.btnDel} onClick={() => handleDelete(acc.id)}>🗑️</button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* CREATE MODAL */}
      {showModal && (
        <div className={s.overlay} onClick={e => e.target === e.currentTarget && setShowModal(false)}>
          <div className={s.modal}>
            <h2 className={s.modalTitle}>📦 Thêm Tài Khoản Mới</h2>
            {formErr && <div className={s.formError}>⚠️ {formErr}</div>}
            
            <form onSubmit={handleCreate} className={s.form}>
              <div className={s.fieldGroup}>
                <label className={s.label}>1. Lựa chọn KOL ảo sở hữu *</label>
                <select className={s.input} required value={form.super_profile_id}
                  onChange={e => setForm(f => ({ ...f, super_profile_id: e.target.value }))}>
                  <option value="">-- Chọn KOL ảo --</option>
                  {profiles.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.gender === 'female' ? 'Nữ' : 'Nam'}) - {p.niche}</option>
                  ))}
                </select>
                <span style={{fontSize: 11, color: 'var(--text-sub)'}}>* Lưu ý: Tài khoản này sẽ chỉ hoạt động cho KOL đã chọn để tránh sai lệch content.</span>
              </div>

              <div className={s.fieldGroup}>
                <label className={s.label}>2. Nền tảng *</label>
                <div className={s.platRow}>
                  {PLATFORMS.map(p => (
                    <label key={p.id} className={`${s.platChip} ${form.platform === p.id ? s.platChipActive : ''}`}
                      style={form.platform === p.id ? { borderColor: p.color, color: p.color, background: p.color + '18' } : {}}>
                      <input type="radio" style={{ display: 'none' }} name="platform" value={p.id}
                        checked={form.platform === p.id} onChange={() => setForm(f => ({ ...f, platform: p.id }))} />
                      {p.icon} {p.label}
                    </label>
                  ))}
                </div>
              </div>

              <div className={s.twoCol}>
                <div className={s.fieldGroup}>
                  <label className={s.label}>Username</label>
                  <input className={s.input} placeholder="@username" value={form.username}
                    onChange={e => setForm(f => ({ ...f, username: e.target.value }))} />
                </div>
                <div className={s.fieldGroup}>
                  <label className={s.label}>Computer (Máy nuôi)</label>
                  <input className={s.input} placeholder="VD: PC-01" value={form.computer}
                    onChange={e => setForm(f => ({ ...f, computer: e.target.value }))} />
                </div>
              </div>

              <div className={s.fieldGroup}>
                <label className={s.label}>URL Profile</label>
                <input className={s.input} placeholder="https://tiktok.com/@..." value={form.url}
                  onChange={e => setForm(f => ({ ...f, url: e.target.value }))} />
              </div>

              <div className={s.modalActions}>
                <button type="button" className={s.btnCancel} onClick={() => setShowModal(false)}>Hủy</button>
                <button type="submit" className={s.btnSubmit} disabled={submitting}>
                  {submitting ? <span className={s.spinnerSm} /> : '+ Nhập Kho'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
