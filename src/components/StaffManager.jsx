import { useCallback, useEffect, useState } from 'react';
import { RefreshCw, Shield, UserCheck, UserPlus, UserX } from 'lucide-react';
import { useAuth } from '../contexts/useAuth';
import { useThemeLang } from '../contexts/useThemeLang';
import { createEphemeralSupabaseClient, supabase } from '../supabaseClient';
import { formatDateTime } from '../utils/format';

const USERNAME_REGEX = /^[a-zA-Z0-9_.]{3,30}$/;

async function fetchProfiles() {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .order('created_at', { ascending: true });
  if (error) throw error;
  return data || [];
}

export default function StaffManager() {
  const { user } = useAuth();
  const { dict } = useThemeLang();
  const t = dict.staff;

  const [profiles, setProfiles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [feedback, setFeedback] = useState(null);

  const [fullName, setFullName] = useState('');
  const [username, setUsername] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [creating, setCreating] = useState(false);

  const loadProfiles = useCallback(async () => {
    setLoading(true);
    try {
      const data = await fetchProfiles();
      setProfiles(data);
    } catch (err) {
      setFeedback({ type: 'error', text: `${err.message}` });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    let cancelled = false;
    fetchProfiles()
      .then((data) => {
        if (cancelled) return;
        setProfiles(data);
      })
      .catch((err) => {
        if (cancelled) return;
        setFeedback({ type: 'error', text: `${err.message}` });
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, []);

  async function handleCreateCashier(e) {
    e.preventDefault();
    setFeedback(null);

    if (!fullName.trim() || !username.trim() || !email.trim() || password.length < 6) {
      setFeedback({ type: 'error', text: t.errRequired });
      return;
    }

    if (!USERNAME_REGEX.test(username.trim())) {
      setFeedback({ type: 'error', text: t.errUsernameFormat });
      return;
    }

    const ephemeralClient = createEphemeralSupabaseClient();
    if (!ephemeralClient) {
      setFeedback({ type: 'error', text: dict.supabaseNotConfigured });
      return;
    }

    setCreating(true);
    try {
      const cleanUsername = username.trim().toLowerCase();
      const { data, error } = await ephemeralClient.auth.signUp({
        email: email.trim(),
        password,
        options: {
          data: {
            full_name: fullName.trim(),
            username: cleanUsername,
          },
        },
      });
      if (error) throw error;

      const createdName = fullName.trim();
      setFullName('');
      setUsername('');
      setEmail('');
      setPassword('');
      setFeedback({
        type: 'success',
        text: data.session
          ? `${createdName} (@${cleanUsername}) — ${dict.activeStatus}`
          : `${createdName} (@${cleanUsername})`,
      });
      await loadProfiles();
    } catch (err) {
      setFeedback({ type: 'error', text: `${err.message}` });
    } finally {
      setCreating(false);
    }
  }

  async function handleToggleActive(staff) {
    if (staff.id === user?.id) {
      setFeedback({ type: 'error', text: t.errSelfDeactivate });
      return;
    }
    setFeedback(null);
    const nextActive = !staff.is_active;
    const { error } = await supabase
      .from('profiles')
      .update({ is_active: nextActive, updated_at: new Date().toISOString() })
      .eq('id', staff.id);

    if (error) {
      setFeedback({ type: 'error', text: `${error.message}` });
      return;
    }
    setFeedback({
      type: 'success',
      text: `${staff.full_name} → ${nextActive ? dict.activeStatus : dict.inactiveStatus}.`,
    });
    await loadProfiles();
  }

  async function handleToggleRole(staff) {
    if (staff.id === user?.id) {
      setFeedback({ type: 'error', text: t.errSelfRole });
      return;
    }
    setFeedback(null);
    const nextRole = staff.role === 'owner' ? 'kasir' : 'owner';
    const { error } = await supabase
      .from('profiles')
      .update({ role: nextRole, updated_at: new Date().toISOString() })
      .eq('id', staff.id);

    if (error) {
      setFeedback({ type: 'error', text: `${error.message}` });
      return;
    }
    setFeedback({
      type: 'success',
      text: `${staff.full_name} → ${nextRole.toUpperCase()}.`,
    });
    await loadProfiles();
  }

  return (
    <div className="inventory-layout">
      {feedback && (
        <div className={`alert ${feedback.type === 'error' ? 'alert-error' : 'alert-success'}`}>
          {feedback.text}
        </div>
      )}

      <section className="card">
        <h2>
          <UserPlus size={18} /> {t.addTitle}
        </h2>
        <p className="muted-text">{t.addDesc}</p>
        <form onSubmit={handleCreateCashier} className="product-form">
          <div className="form-grid">
            <label>
              {t.fullNameLabel}
              <input
                type="text"
                className="input"
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder={t.fullNamePlaceholder}
                required
              />
            </label>
            <label>
              {t.usernameLabel}
              <input
                type="text"
                className="input"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder={t.usernamePlaceholder}
                required
              />
            </label>
            <label>
              {t.emailLabel}
              <input
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t.emailPlaceholder}
                required
              />
            </label>
            <label>
              {t.passwordLabel}
              <input
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••"
                minLength={6}
                required
              />
            </label>
          </div>
          <div className="form-actions">
            <button type="submit" className="btn btn-primary" disabled={creating}>
              <UserPlus size={15} />
              <span>{creating ? t.creatingBtn : t.createBtn}</span>
            </button>
          </div>
        </form>
      </section>

      <section className="card">
        <div className="section-header">
          <h2 style={{ margin: 0 }}>{t.listTitle}</h2>
          <button type="button" className="btn btn-outline" onClick={loadProfiles} disabled={loading}>
            <RefreshCw size={15} /> {dict.refresh}
          </button>
        </div>

        {loading ? (
          <p className="muted-text">{t.loadingList}</p>
        ) : (
          <div className="table-responsive">
            <table className="data-table">
              <thead>
                <tr>
                  <th>{t.colName}</th>
                  <th>{t.colRole}</th>
                  <th>{t.colStatus}</th>
                  <th>{t.colCreated}</th>
                  <th>{t.colActions}</th>
                </tr>
              </thead>
              <tbody>
                {profiles.length === 0 ? (
                  <tr>
                    <td colSpan="5" className="text-center muted-text">
                      {t.noStaff}
                    </td>
                  </tr>
                ) : (
                  profiles.map((staff) => {
                    const isSelf = staff.id === user?.id;
                    return (
                      <tr key={staff.id}>
                        <td>
                          <div>
                            <strong>{staff.full_name}</strong>{' '}
                            {isSelf && <span className="badge">{dict.you}</span>}
                          </div>
                          {staff.username && (
                            <span className="username-tag">@{staff.username}</span>
                          )}
                        </td>
                        <td>
                          <span
                            className={`badge ${
                              staff.role === 'owner' ? 'badge-owner' : ''
                            }`}
                          >
                            {staff.role.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <span
                            className={`status-pill ${
                              staff.is_active ? 'status-open' : 'status-closed'
                            }`}
                          >
                            {staff.is_active ? dict.activeStatus : dict.inactiveStatus}
                          </span>
                        </td>
                        <td>{formatDateTime(staff.created_at)}</td>
                        <td>
                          <div className="row-actions">
                            <button
                              type="button"
                              className="btn btn-outline btn-sm"
                              disabled={isSelf}
                              onClick={() => handleToggleRole(staff)}
                            >
                              <Shield size={13} />
                              {staff.role === 'owner' ? t.makeCashier : t.makeOwner}
                            </button>
                            <button
                              type="button"
                              className={`btn btn-sm ${
                                staff.is_active ? 'btn-danger' : 'btn-primary'
                              }`}
                              disabled={isSelf}
                              onClick={() => handleToggleActive(staff)}
                            >
                              {staff.is_active ? (
                                <>
                                  <UserX size={13} /> {t.deactivate}
                                </>
                              ) : (
                                <>
                                  <UserCheck size={13} /> {t.activate}
                                </>
                              )}
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
