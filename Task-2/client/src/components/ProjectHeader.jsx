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
    <div className="bg-white border-b border-gray-200 px-6 py-4">
      {/* Row 1 */}
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span
              className="w-3 h-3 rounded-full flex-shrink-0"
              style={{ backgroundColor: project.color || '#6366f1' }}
            />
            <h2 className="text-2xl font-bold text-gray-900 truncate">{project.name}</h2>
          </div>
          {project.description && (
            <p className="text-sm text-gray-500 mt-1">{project.description}</p>
          )}
        </div>

        <div className="flex items-center gap-3 ml-4">
          {/* View toggle */}
          <div className="flex rounded-lg overflow-hidden border border-gray-200">
            {['kanban', 'list'].map((mode) => (
              <button
                key={mode}
                onClick={() => onViewChange(mode)}
                className={`px-3 py-1.5 text-xs font-medium capitalize transition ${
                  viewMode === mode
                    ? 'bg-indigo-600 text-white'
                    : 'bg-white text-gray-600 hover:bg-gray-50'
                }`}
              >
                {mode === 'kanban' ? '⊞ Kanban' : '☰ List'}
              </button>
            ))}
          </div>

          {/* Settings */}
          <button
            onClick={() => navigate(`/projects/${project._id}/edit`)}
            className="p-2 text-gray-400 hover:text-indigo-600 transition rounded-lg hover:bg-gray-50"
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
            className="w-8 h-8 rounded-full border-2 border-dashed border-gray-300 flex items-center justify-center text-gray-400 hover:border-indigo-400 hover:text-indigo-500 transition ml-1"
            title="Add member"
          >
            <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M12 5v14M5 12h14"/>
            </svg>
          </button>
        </div>

        {/* Due date */}
        {formattedDue && (
          <div className="flex items-center gap-1 text-sm text-gray-500">
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
          className="border border-gray-200 rounded-lg px-3 py-1 text-xs text-gray-600 bg-white focus:outline-none focus:ring-1 focus:ring-indigo-400"
        >
          <option value="Active">Active</option>
          <option value="Completed">Completed</option>
          <option value="On Hold">On Hold</option>
        </select>
      </div>

      {/* Add Member Modal */}
      {showAddMember && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50">
          <div className="bg-white rounded-2xl p-6 w-96 shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">Add Member</h3>
              <button onClick={() => { setShowAddMember(false); setMemberError(''); setMemberSuccess(''); }}
                className="text-gray-400 hover:text-gray-600 text-xl">×</button>
            </div>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="Enter member's email"
              className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 mb-3"
            />
            {memberError && <p className="text-sm text-red-600 mb-3">{memberError}</p>}
            {memberSuccess && <p className="text-sm text-green-600 mb-3">{memberSuccess}</p>}
            <button
              onClick={handleAddMember}
              disabled={addingMember || !email}
              className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:bg-indigo-400 transition"
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
