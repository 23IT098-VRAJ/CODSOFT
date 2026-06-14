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
      className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl p-6 w-full max-w-[520px] max-h-[90vh] overflow-y-auto shadow-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex justify-between items-start mb-4">
          <input
            type="text"
            value={form.title}
            onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="text-xl font-bold text-gray-900 border-b-2 border-indigo-500 outline-none w-full mr-3 pb-1 bg-transparent"
          />
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-2xl leading-none flex-shrink-0">
            ×
          </button>
        </div>

        {/* Color accent */}
        <div className="h-1 rounded-full mb-5" style={{ backgroundColor: project?.color || '#6366f1' }} />

        {/* Body */}
        <div className="space-y-4">
          {/* Description */}
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1">Description</label>
            <textarea
              rows={4}
              value={form.description}
              onChange={(e) => setForm({ ...form, description: e.target.value })}
              placeholder="Add a description..."
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            />
          </div>

          {/* Status */}
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1">Status</label>
            <select
              value={form.status}
              onChange={(e) => setForm({ ...form, status: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Todo">To Do</option>
              <option value="In Progress">In Progress</option>
              <option value="Done">Done</option>
            </select>
          </div>

          {/* Priority */}
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1">Priority</label>
            <select
              value={form.priority}
              onChange={(e) => setForm({ ...form, priority: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="Low">Low</option>
              <option value="Medium">Medium</option>
              <option value="High">High</option>
            </select>
          </div>

          {/* Assignee */}
          <div>
            <label className="block text-xs text-gray-500 font-medium mb-1">Assignee</label>
            <select
              value={form.assigneeId}
              onChange={(e) => setForm({ ...form, assigneeId: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
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
            <label className="block text-xs text-gray-500 font-medium mb-1">Due Date</label>
            <input
              type="date"
              value={form.dueDate}
              onChange={(e) => setForm({ ...form, dueDate: e.target.value })}
              className="w-full border border-gray-300 rounded-lg p-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>

        {error && (
          <p className="text-sm text-red-600 bg-red-50 rounded-lg px-3 py-2 mt-4">{error}</p>
        )}

        {/* Footer */}
        <div className="flex justify-between items-center mt-6 pt-4 border-t border-gray-200">
          <button
            onClick={handleDelete}
            className="px-4 py-2 border-2 border-red-300 text-red-600 hover:bg-red-50 text-sm font-medium rounded-lg transition"
          >
            Delete Task
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800 text-sm font-medium transition"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:bg-indigo-400 text-white text-sm font-semibold rounded-lg transition flex items-center gap-2"
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
