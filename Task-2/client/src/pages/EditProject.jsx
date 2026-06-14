import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import Navbar, { NAVBAR_HEIGHT } from '../components/Navbar';
import api from '../lib/axios';

const COLORS = ["#3730A3","#78350F","#064E3B","#7F1D1D","#4C1D95","#881337"];

export default function EditProject() {
  const navigate = useNavigate();
  const { id } = useParams();
  const [form, setForm] = useState({
    name: '',
    description: '',
    dueDate: '',
    color: '#3730A3',
    status: 'Active',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);

  useEffect(() => {
    const fetchProject = async () => {
      try {
        const res = await api.get(`/api/projects/${id}`);
        const p = res.data;
        setForm({
          name: p.name || '',
          description: p.description || '',
          dueDate: p.dueDate ? new Date(p.dueDate).toISOString().split('T')[0] : '',
          color: p.color || '#3730A3',
          status: p.status || 'Active',
        });
      } catch (err) {
        setError('Failed to load project');
      } finally {
        setFetching(false);
      }
    };
    fetchProject();
  }, [id]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await api.put(`/api/projects/${id}`, form);
      navigate(`/projects/${id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update project');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Are you sure you want to delete this project? All tasks will be deleted too.')) return;
    try {
      await api.delete(`/api/projects/${id}`);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to delete project');
    }
  };

  if (fetching) {
    return (
      <div className="min-h-screen bg-[#F7F6F4]">
        <Navbar />
        <div className={`${NAVBAR_HEIGHT} flex items-center justify-center h-64`}>
          <div className="w-8 h-8 border-4 border-[#E5E2DC] border-t-[#1A1917] rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#F7F6F4]">
      <Navbar />
      <main className={NAVBAR_HEIGHT}>
        <div className="max-w-2xl mx-auto px-6 py-10">
          <Link to={`/projects/${id}`} className="flex items-center gap-1.5 text-sm text-[#8A8680] hover:text-[#1A1917] transition-colors mb-6">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back to Project
          </Link>

          <h1 className="text-xl font-semibold tracking-tight text-[#1A1917] mb-6">Edit Project</h1>

          <div className="bg-white border border-[#E5E2DC] rounded-xl p-6 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label className="block text-xs font-medium tracking-widest uppercase text-[#8A8680] mb-1.5">
                  Project Name <span className="text-[#7F1D1D]">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full bg-[#F7F6F4] border border-[#E5E2DC] rounded-lg px-3 py-2.5 text-sm text-[#1A1917] placeholder:text-[#BAB6B0] focus:border-[#1A1917] focus:outline-none focus:ring-1 focus:ring-[#1A1917] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium tracking-widest uppercase text-[#8A8680] mb-1.5">Description</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-[#F7F6F4] border border-[#E5E2DC] rounded-lg px-3 py-2.5 text-sm text-[#1A1917] placeholder:text-[#BAB6B0] focus:border-[#1A1917] focus:outline-none focus:ring-1 focus:ring-[#1A1917] focus:bg-white transition-all resize-none"
                />
              </div>

              <div>
                <label className="block text-xs font-medium tracking-widest uppercase text-[#8A8680] mb-1.5">Due Date</label>
                <input
                  type="date"
                  value={form.dueDate}
                  onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
                  className="w-full bg-[#F7F6F4] border border-[#E5E2DC] rounded-lg px-3 py-2.5 text-sm text-[#1A1917] placeholder:text-[#BAB6B0] focus:border-[#1A1917] focus:outline-none focus:ring-1 focus:ring-[#1A1917] focus:bg-white transition-all"
                />
              </div>

              <div>
                <label className="block text-xs font-medium tracking-widest uppercase text-[#8A8680] mb-1.5">Project Color</label>
                <div className="flex gap-3">
                  {COLORS.map((color) => (
                    <button
                      key={color}
                      type="button"
                      onClick={() => setForm({ ...form, color })}
                      className={`w-7 h-7 rounded-full transition-all duration-200 flex-shrink-0 ${
                        form.color === color ? 'ring-2 ring-offset-2 ring-[#1A1917] scale-110' : ''
                      }`}
                      style={{ backgroundColor: color }}
                    />
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium tracking-widest uppercase text-[#8A8680] mb-1.5">Status</label>
                <select
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                  className="w-full bg-[#F7F6F4] border border-[#E5E2DC] rounded-lg px-3 py-2.5 text-sm text-[#1A1917] focus:border-[#1A1917] focus:outline-none focus:ring-1 focus:ring-[#1A1917] focus:bg-white transition-all"
                >
                  <option value="Active">Active</option>
                  <option value="Completed">Completed</option>
                  <option value="On Hold">On Hold</option>
                </select>
              </div>

              {error && (
                <p className="text-[#7F1D1D] text-xs bg-[#FEF2F2] border border-[#7F1D1D]/20 rounded-lg px-3 py-2">{error}</p>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-[#1A1917] text-white text-sm font-medium py-2.5 rounded-lg hover:bg-[#2E2C2A] transition-colors mt-6 disabled:opacity-40 flex items-center justify-center gap-2"
              >
                {loading && (
                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                  </svg>
                )}
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </form>

            {/* Delete */}
            <div className="mt-8 pt-6 border-t border-[#E5E2DC]">
              <button
                onClick={handleDelete}
                className="w-full text-[#7F1D1D] border border-[#7F1D1D]/30 hover:border-[#7F1D1D] hover:bg-[#FEF2F2] rounded-lg px-4 py-2.5 text-sm font-medium transition-all mt-4"
              >
                🗑️ Delete Project
              </button>
              <p className="text-xs text-[#BAB6B0] text-center mt-2">This will permanently delete the project and all its tasks.</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
