import { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import Navbar, { NAVBAR_HEIGHT } from '../components/Navbar';
import api from '../lib/axios';

const COLORS = ["#3730A3","#78350F","#064E3B","#7F1D1D","#4C1D95","#881337"];

export default function CreateProject() {
  const navigate = useNavigate();
  const [form, setForm] = useState({
    name: '',
    description: '',
    dueDate: '',
    color: '#3730A3',
    status: 'Active',
  });
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      const res = await api.post('/api/projects', form);
      navigate(`/projects/${res.data._id}`);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#F7F6F4]">
      <Navbar />
      <main className={NAVBAR_HEIGHT}>
        <div className="max-w-2xl mx-auto px-6 py-10">
          {/* Back */}
          <Link to="/dashboard" className="flex items-center gap-1.5 text-sm text-[#8A8680] hover:text-[#1A1917] transition-colors mb-6">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M19 12H5M12 5l-7 7 7 7"/></svg>
            Back to Dashboard
          </Link>

          <h1 className="text-xl font-semibold tracking-tight text-[#1A1917] mb-6">Create New Project</h1>

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
                  placeholder="My Awesome Project"
                />
              </div>

              <div>
                <label className="block text-xs font-medium tracking-widest uppercase text-[#8A8680] mb-1.5">Description</label>
                <textarea
                  rows={4}
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  className="w-full bg-[#F7F6F4] border border-[#E5E2DC] rounded-lg px-3 py-2.5 text-sm text-[#1A1917] placeholder:text-[#BAB6B0] focus:border-[#1A1917] focus:outline-none focus:ring-1 focus:ring-[#1A1917] focus:bg-white transition-all resize-none"
                  placeholder="What is this project about?"
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

              {/* Color picker */}
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
                      style={{
                        backgroundColor: color,
                        ringColor: color,
                      }}
                    />
                  ))}
                </div>
              </div>

              {/* Status */}
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
                {loading ? 'Creating...' : 'Create Project'}
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
