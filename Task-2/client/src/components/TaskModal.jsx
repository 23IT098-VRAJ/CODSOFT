import { useState } from 'react';
import api from '../lib/axios';

export const TaskModal = ({ task, project, onClose, onSave, onDelete }) => {
  const [form, setForm] = useState({
    title: task.title || '',
    description: task.description || '',
    status: task.status || 'Todo',
    priority: task.priority || 'Medium',
    assigneeId: task.assigneeId?._id || '',
    dueDate: task.dueDate ? new Date(task.dueDate).toISOString().split('T')[0] : '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');

  const handleSave = async () => {
    setSaving(true);
    setError('');
    try {
      const res = await api.put(`/api/tasks/${task._id}`, {
        ...form,
        assigneeId: form.assigneeId || null,
        dueDate: form.dueDate || null,
      });
      onSave(res.data);
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to save task');
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/api/tasks/${task._id}`);
      onDelete(task._id);
    } catch (err) {
      setError('Failed to delete task');
    }
  };

  return (
    <div
      className="fixed inset-0 bg-[#1A1917]/20 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white border border-[#E5E2DC] rounded-xl p-6 w-full max-w-[520px] max-h-[90vh] overflow-y-auto shadow-[0_24px_80px_rgba(0,0,0,0.12)]"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="text-xl font-semibold tracking-tight text-[#1A1917] border-b border-transparent hover:border-[#E5E2DC] focus:border-[#1A1917] outline-none w-full mr-3 pb-1 bg-transparent transition-colors"
          />
          <button onClick={onClose} className="text-[#8A8680] hover:text-[#1A1917] transition-colors text-2xl leading-none flex-shrink-0">
            ×
          </button>
        </div>



        {/* Body */}
        <div className="space-y-4">
          {/* Description */}
          <div>
            <label className="block text-xs font-medium tracking-widest uppercase text-[#8A8680] mb-1.5">Description</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Add a description..."
              className="w-full bg-[#F7F6F4] border border-[#E5E2DC] rounded-lg px-3 py-2 text-sm text-[#1A1917] placeholder:text-[#BAB6B0] focus:border-[#1A1917] focus:outline-none focus:ring-1 focus:ring-[#1A1917] focus:bg-white transition-all resize-none"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs font-medium tracking-widest uppercase text-[#8A8680] mb-1.5">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full bg-[#F7F6F4] border border-[#E5E2DC] rounded-lg px-3 py-2 text-sm text-[#1A1917] focus:border-[#1A1917] focus:outline-none focus:ring-1 focus:ring-[#1A1917] focus:bg-white transition-all"
            >
              <option value="Todo">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs font-medium tracking-widest uppercase text-[#8A8680] mb-1.5">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full bg-[#F7F6F4] border border-[#E5E2DC] rounded-lg px-3 py-2 text-sm text-[#1A1917] focus:border-[#1A1917] focus:outline-none focus:ring-1 focus:ring-[#1A1917] focus:bg-white transition-all"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-xs font-medium tracking-widest uppercase text-[#8A8680] mb-1.5">Assignee</label>
            <select
              value={form.assigneeId}
              onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
              className="w-full bg-[#F7F6F4] border border-[#E5E2DC] rounded-lg px-3 py-2 text-sm text-[#1A1917] focus:border-[#1A1917] focus:outline-none focus:ring-1 focus:ring-[#1A1917] focus:bg-white transition-all"
            >
              <option value="">Unassigned</option>
              {project?.members?.map((member) => (
                <option key={member._id} value={member._id}>
                  {member.name}
                </option>
              ))}
            </select>
          </div>

          {/* Due date */}
          <div>
            <label className="block text-xs font-medium tracking-widest uppercase text-[#8A8680] mb-1.5">Due Date</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full bg-[#F7F6F4] border border-[#E5E2DC] rounded-lg px-3 py-2 text-sm text-[#1A1917] focus:border-[#1A1917] focus:outline-none focus:ring-1 focus:ring-[#1A1917] focus:bg-white transition-all"
            />
          </div>
        </div>

        {error && (
          <p className="text-[#7F1D1D] text-xs bg-[#FEF2F2] border border-[#7F1D1D]/20 rounded-lg px-3 py-2 mt-4">{error}</p>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center mt-8 pt-4 border-t border-[#E5E2DC]">
          <button
            onClick={handleDelete}
            className="text-[#7F1D1D] text-sm font-medium px-3 py-1.5 rounded hover:bg-[#FEF2F2] transition-colors"
          >
            Delete Task
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="text-sm font-medium text-[#4B4845] hover:text-[#1A1917] px-3 py-1.5 rounded hover:bg-[#F0EFEC] transition-colors"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="bg-[#1A1917] text-white rounded-lg px-4 py-2 text-sm font-medium hover:bg-[#2E2C2A] transition-colors disabled:opacity-40 flex items-center gap-2"
            >
              {saving && (
                <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z"/>
                </svg>
              )}
              {saving ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TaskModal;
