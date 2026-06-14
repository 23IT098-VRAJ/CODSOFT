import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import MemberAvatar from './MemberAvatar';
import api from '../lib/axios';

export const ProjectHeader = ({ project, viewMode, onViewChange, onMemberAdded, onStatusChange }) => {
  const navigate = useNavigate();
  const [showAddMember, setShowAddMember] = useState(false);
  const [email, setEmail] = useState('');
  const [memberError, setMemberError] = useState('');
  const [memberSuccess, setMemberSuccess] = useState('');
  const [addingMember, setAddingMember] = useState(false);

  if (!project) return null;

  const handleAddMember = async () => {
    setMemberError('');
    setMemberSuccess('');
    setAddingMember(true);
    try {
      const res = await api.post(`/api/projects/${project._id}/members`, { email });
      setMemberSuccess('Member added ✓');
      setEmail('');
      if (onMemberAdded) onMemberAdded(res.data);
      setTimeout(() => {
        setShowAddMember(false);
        setMemberSuccess('');
      }, 1500);
    } catch (err) {
      setMemberError(err.response?.data?.message || 'Failed to add member');
    } finally {
      setAddingMember(false);
    }
  };

  const handleStatusChange = async (e) => {
    try {
      await api.put(`/api/projects/${project._id}`, { status: e.target.value });
      if (onStatusChange) onStatusChange(e.target.value);
    } catch (err) {
      console.error(err);
    }
  };

  const formattedDue = project.dueDate
    ? new Date(project.dueDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
    : null;

  return (
    <div className="bg-white border-b border-[#E5E2DC] px-6 py-4">
      {/* Row 1 */}
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="w-2 h-2 rounded-full flex-shrink-0"
              style={{ backgroundColor: project.color || '#3730A3' }}
            />
            <h2 className="text-xl font-semibold tracking-tight text-[#1A1917] truncate">{project.name}</h2>
          </div>
          {project.description && (
            <p className="text-sm text-[#8A8680] mt-0.5">{project.description}</p>
          )}
        </div>

        <div className="flex items-center gap-3 ml-4">
          {/* View toggle */}
          <div className="inline-flex bg-[#F0EFEC] rounded-lg p-0.5">
            {['kanban', 'list'].map((mode) => (
              <button
                key={mode}
                onClick={() => onViewChange(mode)}
                className={`capitalize transition-all ${
                  viewMode === mode
                    ? 'bg-white text-[#1A1917] shadow-[0_1px_3px_rgba(0,0,0,0.08)] rounded-md px-3 py-1.5 text-xs font-medium'
                    : 'text-[#8A8680] hover:text-[#4B4845] rounded-md px-3 py-1.5 text-xs font-medium'
                }`}
              >
                {mode === 'kanban' ? '⊞ Kanban' : '☰ List'}
              </button>
            ))}
          </div>

          {/* Settings */}
          <button
            onClick={() => navigate(`/projects/${project._id}/edit`)}
            className="text-[#8A8680] hover:text-[#1A1917] transition-colors p-1.5"
            title="Edit project"
          >
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
              <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
            </svg>
          </button>
        </div>
      </div>

      {/* Row 2 */}
      <div className="flex items-center gap-4 mt-3 flex-wrap">
        {/* Members */}
        <div className="flex items-center -space-x-2">
          {project.members?.map((member) => (
            <MemberAvatar key={member._id} user={member} size="sm" showTooltip />
          ))}
          {/* Add member button */}
          <button
            onClick={() => setShowAddMember(true)}
            className="w-8 h-8 border border-dashed border-[#D4D0C9] text-[#8A8680] hover:border-[#1A1917] hover:text-[#1A1917] transition-all rounded-full flex items-center justify-center ml-1"
            title="Add member"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
        </div>

        {/* Due date */}
        {formattedDue && (
          <div className="flex items-center gap-1 text-xs text-[#8A8680]">
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <rect x="3" y="4" width="18" height="18" rx="2" ry="2"/>
              <line x1="16" y1="2" x2="16" y2="6"/><line x1="8" y1="2" x2="8" y2="6"/>
              <line x1="3" y1="10" x2="21" y2="10"/>
            </svg>
            {formattedDue}
          </div>
        )}

        {/* Status dropdown */}
        <select
          defaultValue={project.status}
          onChange={handleStatusChange}
          className="border border-[#E5E2DC] rounded-lg px-2.5 py-1 text-xs text-[#4B4845] bg-[#F7F6F4] focus:border-[#1A1917] focus:outline-none focus:ring-1 focus:ring-[#1A1917] transition-all"
        >
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
          <option value="On Hold">On Hold</option>
        </select>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-[#1A1917]/20 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white border border-[#E5E2DC] rounded-xl p-6 w-96 shadow-[0_24px_80px_rgba(0,0,0,0.12)]">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-base font-semibold tracking-tight text-[#1A1917]">Add Member</h3>
              <button onClick={() => { setShowAddMember(false); setMemberError(''); setMemberSuccess(''); }}
                className="text-[#8A8680] hover:text-[#1A1917] transition-colors text-xl">×</button>
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter member's email"
              className="w-full bg-[#F7F6F4] border border-[#E5E2DC] rounded-lg px-3 py-2.5 text-sm text-[#1A1917] placeholder:text-[#BAB6B0] focus:border-[#1A1917] focus:outline-none focus:ring-1 focus:ring-[#1A1917] focus:bg-white transition-all mb-3"
            />
            {memberError && <p className="text-[#7F1D1D] text-xs mb-3">{memberError}</p>}
            {memberSuccess && <p className="text-[#064E3B] text-xs mb-3">{memberSuccess}</p>}
            <button
              onClick={handleAddMember}
              disabled={addingMember || !email}
              className="w-full bg-[#1A1917] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#2E2C2A] transition-colors mt-6 disabled:opacity-40 flex items-center justify-center gap-2"
            >
              {addingMember ? 'Adding...' : 'Add Member'}
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProjectHeader;
