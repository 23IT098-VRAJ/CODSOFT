import React, { useEffect, useState } from 'react';
import { Search, ShieldCheck } from 'lucide-react';
import AdminLayout from './AdminLayout';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';
import { ErrorState, Pagination } from '../../components/ui';
import api, { errorMessage } from '../../lib/axios';
import { useDebounce } from '../../hooks';
import { formatDate, formatINR } from '../../lib/format';

export default function AdminUsers() {
  const { user: me } = useAuth();
  const { showToast } = useToast();
  const [search, setSearch] = useState('');
  const q = useDebounce(search.trim());
  const [page, setPage] = useState(1);
  const [result, setResult] = useState({ users: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [reload, setReload] = useState(0);

  useEffect(() => setPage(1), [q]);

  useEffect(() => {
    const controller = new AbortController();
    setLoading(true);
    setError('');
    api.get('/admin/users', { params: { q: q || undefined, page, limit: 10 }, signal: controller.signal })
      .then(({ data }) => { setResult(data); setLoading(false); })
      .catch((err) => {
        if (controller.signal.aborted) return;
        setError(errorMessage(err));
        setLoading(false);
      });
    return () => controller.abort();
  }, [q, page, reload]);

  const setRole = async (user, role) => {
    const verb = role === 'admin' ? 'Make' : 'Remove admin rights from';
    if (!window.confirm(`${verb} ${user.name}${role === 'admin' ? ' an admin' : ''}?`)) return;
    try {
      await api.put(`/admin/users/${user._id}/role`, { role });
      setResult((r) => ({ ...r, users: r.users.map((u) => (u._id === user._id ? { ...u, role } : u)) }));
      showToast(`${user.name} is now ${role === 'admin' ? 'an admin' : 'a customer'}`, 'success');
    } catch (err) {
      showToast(errorMessage(err), 'error');
    }
  };

  return (
    <AdminLayout title="Users" subtitle={`${result.total} account${result.total === 1 ? '' : 's'}`}>
      <div className="relative max-w-sm mb-4">
        <Search className="w-4 h-4 text-gray-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
        <input type="search" className="input pl-10" placeholder="Search by name or email" aria-label="Search users" value={search} onChange={(e) => setSearch(e.target.value)} />
      </div>

      {error ? <ErrorState message={error} onRetry={() => setReload((n) => n + 1)} /> : (
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr>{['User', 'Joined', 'Orders', 'Spent', 'Role', ''].map((h) => <th key={h} className="table-head">{h}</th>)}</tr>
              </thead>
              <tbody className={`divide-y divide-parchment ${loading ? 'opacity-50' : ''}`}>
                {loading && !result.users.length
                  ? Array.from({ length: 4 }).map((_, i) => <tr key={i}><td colSpan={6} className="table-cell"><div className="h-10 skeleton" /></td></tr>)
                  : result.users.map((u) => {
                    const isMe = u._id === me._id;
                    return (
                      <tr key={u._id} className="hover:bg-warmIvory/60">
                        <td className="table-cell">
                          <div className="flex items-center gap-3">
                            <span className="w-9 h-9 rounded-full bg-midnight text-vividGold font-bold flex items-center justify-center shrink-0">{u.name?.[0]?.toUpperCase()}</span>
                            <div>
                              <p className="font-medium text-midnight">{u.name} {isMe && <span className="text-smoke font-normal">(you)</span>}</p>
                              <p className="text-smoke text-xs">{u.email}</p>
                            </div>
                          </div>
                        </td>
                        <td className="table-cell text-smoke text-xs whitespace-nowrap">{formatDate(u.createdAt)}</td>
                        <td className="table-cell text-bodyInk">{u.orders}</td>
                        <td className="table-cell font-semibold text-midnight whitespace-nowrap">{formatINR(u.spent)}</td>
                        <td className="table-cell">
                          {u.role === 'admin' ? <span className="badge-purple"><ShieldCheck className="w-3 h-3" /> Admin</span> : <span className="badge-gray">Customer</span>}
                        </td>
                        <td className="table-cell text-right">
                          {!isMe && (
                            <button onClick={() => setRole(u, u.role === 'admin' ? 'user' : 'admin')} className="btn-outline !py-1.5 !px-3 !text-xs whitespace-nowrap">
                              {u.role === 'admin' ? 'Remove admin' : 'Make admin'}
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                {!loading && !result.users.length && (
                  <tr><td colSpan={6} className="table-cell text-center text-smoke py-10">No users match.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}
      <Pagination page={page} pages={result.pages} onChange={setPage} />
    </AdminLayout>
  );
}
