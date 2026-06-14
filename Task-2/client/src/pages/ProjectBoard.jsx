import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import { DragDropContext } from '@hello-pangea/dnd';
import Navbar, { NAVBAR_HEIGHT } from '../components/Navbar';
import ProjectHeader from '../components/ProjectHeader';
import KanbanColumn from '../components/KanbanColumn';
import TaskModal from '../components/TaskModal';
import MemberAvatar from '../components/MemberAvatar';
import StatusBadge from '../components/StatusBadge';
import PriorityBadge from '../components/PriorityBadge';
import api from '../lib/axios';

const COLUMNS = [
  { id: 'Todo', label: 'To Do' },
  { id: 'In Progress', label: 'In Progress' },
  { id: 'Done', label: 'Done' },
];

const STATUS_ORDER = { 'Todo': 0, 'In Progress': 1, 'Done': 2 };

// Pencil SVG
const PencilIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <path d="M11 4H4a2 2 0 00-2 2v14a2 2 0 002 2h14a2 2 0 002-2v-7"/>
    <path d="M18.5 2.5a2.121 2.121 0 013 3L12 15l-4 1 1-4 9.5-9.5z"/>
  </svg>
);

// Trash SVG
const TrashIcon = () => (
  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
    <polyline points="3 6 5 6 21 6"/>
    <path d="M19 6l-1 14H6L5 6"/>
    <path d="M10 11v6"/><path d="M14 11v6"/>
    <path d="M9 6V4h6v2"/>
  </svg>
);

export default function ProjectBoard() {
  const { id } = useParams();
  const [project, setProject] = useState(null);
  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [viewMode, setViewMode] = useState('kanban');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showAddModal, setShowAddModal] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [projRes, tasksRes] = await Promise.all([
          api.get(`/api/projects/${id}`),
          api.get(`/api/tasks/${id}`),
        ]);
        setProject(projRes.data);
        setTasks(tasksRes.data);
      } catch (err) {
        setError('Failed to load project');
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [id]);

  const handleDragEnd = async ({ draggableId, source, destination }) => {
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;

    // Optimistic update
    const previousTasks = [...tasks];
    const movingTask = tasks.find((t) => t._id === draggableId);
    if (!movingTask) return;

    const updatedTask = { ...movingTask, status: destination.droppableId, order: destination.index };
    setTasks((prev) =>
      prev.map((t) => (t._id === draggableId ? updatedTask : t))
    );

    try {
      await api.patch(`/api/tasks/${draggableId}/move`, {
        status: destination.droppableId,
        order: destination.index,
      });
    } catch (err) {
      setTasks(previousTasks); // Revert on error
    }
  };

  const handleAddTask = async ({ title, status }) => {
    try {
      const res = await api.post('/api/tasks', { title, projectId: id, status });
      setTasks((prev) => [...prev, res.data]);
    } catch (err) {
      console.error('Failed to add task:', err);
    }
  };

  const handleSaveTask = (updatedTask) => {
    setTasks((prev) => prev.map((t) => (t._id === updatedTask._id ? updatedTask : t)));
    setSelectedTask(null);
  };

  const handleDeleteTask = (taskId) => {
    setTasks((prev) => prev.filter((t) => t._id !== taskId));
    setSelectedTask(null);
  };

  const handleListDelete = async (taskId) => {
    if (!window.confirm('Delete this task?')) return;
    try {
      await api.delete(`/api/tasks/${taskId}`);
      setTasks((prev) => prev.filter((t) => t._id !== taskId));
    } catch (err) {
      console.error('Failed to delete task:', err);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className={`${NAVBAR_HEIGHT} flex items-center justify-center h-64`}>
          <div className="w-8 h-8 border-4 border-indigo-200 border-t-indigo-600 rounded-full animate-spin" />
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className={`${NAVBAR_HEIGHT} flex items-center justify-center h-64`}>
          <p className="text-red-500">{error}</p>
        </div>
      </div>
    );
  }

  const sortedTasks = [...tasks].sort(
    (a, b) => STATUS_ORDER[a.status] - STATUS_ORDER[b.status]
  );

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className={NAVBAR_HEIGHT}>
        <ProjectHeader
          project={project}
          viewMode={viewMode}
          onViewChange={setViewMode}
          onMemberAdded={(updatedProject) => setProject(updatedProject)}
          onStatusChange={(newStatus) => setProject((p) => ({ ...p, status: newStatus }))}
        />

        <div className="px-6 py-6">
          {/* KANBAN VIEW */}
          {viewMode === 'kanban' && (
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className="flex gap-6 overflow-x-auto pb-6 kanban-scroll">
                {COLUMNS.map((col) => (
                  <KanbanColumn
                    key={col.id}
                    column={col}
                    tasks={tasks.filter((t) => t.status === col.id).sort((a, b) => a.order - b.order)}
                    project={project}
                    onTaskClick={(task) => setSelectedTask(task)}
                    onAddTask={handleAddTask}
                  />
                ))}
              </div>
            </DragDropContext>
          )}

          {/* LIST VIEW */}
          {viewMode === 'list' && (
            <div>
              <div className="bg-white rounded-2xl shadow-sm overflow-hidden">
                <table className="w-full">
                  <thead className="bg-gray-50 border-b border-gray-200">
                    <tr>
                      {['Task Name', 'Status', 'Priority', 'Assignee', 'Due Date', 'Actions'].map((h) => (
                        <th
                          key={h}
                          className="px-4 py-3 text-left text-xs font-semibold text-gray-500 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {sortedTasks.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-4 py-8 text-center text-gray-400 text-sm">
                          No tasks yet. Add one below!
                        </td>
                      </tr>
                    )}
                    {sortedTasks.map((task) => {
                      const isOverdue =
                        task.dueDate && new Date(task.dueDate) < new Date() && task.status !== 'Done';
                      return (
                        <tr
                          key={task._id}
                          className="border-b border-gray-100 hover:bg-gray-50 transition"
                        >
                          <td className="px-4 py-3">
                            <button
                              onClick={() => setSelectedTask(task)}
                              className="font-medium text-gray-800 hover:text-indigo-600 text-sm text-left"
                            >
                              {task.title}
                            </button>
                          </td>
                          <td className="px-4 py-3">
                            <StatusBadge status={task.status} />
                          </td>
                          <td className="px-4 py-3">
                            <PriorityBadge priority={task.priority} />
                          </td>
                          <td className="px-4 py-3">
                            {task.assigneeId ? (
                              <div className="flex items-center gap-2">
                                <MemberAvatar user={task.assigneeId} size="sm" />
                                <span className="text-xs text-gray-600">{task.assigneeId.name}</span>
                              </div>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            {task.dueDate ? (
                              <span className={`text-xs ${isOverdue ? 'text-red-500' : 'text-gray-500'}`}>
                                {new Date(task.dueDate).toLocaleDateString('en-US', {
                                  month: 'short', day: 'numeric', year: 'numeric',
                                })}
                              </span>
                            ) : (
                              <span className="text-xs text-gray-400">—</span>
                            )}
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex gap-2">
                              <button
                                onClick={() => setSelectedTask(task)}
                                className="text-gray-400 hover:text-indigo-600 transition"
                                title="Edit"
                              >
                                <PencilIcon />
                              </button>
                              <button
                                onClick={() => handleListDelete(task._id)}
                                className="text-gray-400 hover:text-red-500 transition"
                                title="Delete"
                              >
                                <TrashIcon />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Add task row */}
              <button
                onClick={() => setShowAddModal(true)}
                className="mt-4 w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-sm text-gray-500 hover:border-indigo-400 hover:text-indigo-600 transition"
              >
                + Add Task
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Task modal */}
      {selectedTask && (
        <TaskModal
          task={selectedTask}
          project={project}
          onClose={() => setSelectedTask(null)}
          onSave={handleSaveTask}
          onDelete={handleDeleteTask}
        />
      )}

      {/* Quick add modal for list view */}
      {showAddModal && (
        <QuickAddModal
          project={project}
          onAdd={(task) => {
            setTasks((prev) => [...prev, task]);
            setShowAddModal(false);
          }}
          onClose={() => setShowAddModal(false)}
        />
      )}
    </div>
  );
}

// Quick add modal for list view
function QuickAddModal({ project, onAdd, onClose }) {
  const [title, setTitle] = useState('');
  const [status, setStatus] = useState('Todo');
  const [loading, setLoading] = useState(false);

  const handleAdd = async (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    setLoading(true);
    try {
      const res = await api.post('/api/tasks', { title, projectId: project._id, status });
      onAdd(res.data);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 backdrop-blur-sm flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-2xl p-6 w-[480px] shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Add Task</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl">×</button>
        </div>
        <form onSubmit={handleAdd} className="space-y-4">
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Task title..."
            autoFocus
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full px-4 py-2.5 border border-gray-300 rounded-lg text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="Todo">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Done">Done</option>
          </select>
          <button
            type="submit"
            disabled={loading || !title.trim()}
            className="w-full bg-indigo-600 text-white py-2.5 rounded-lg text-sm font-medium hover:bg-indigo-700 disabled:bg-indigo-400 transition"
          >
            {loading ? 'Adding...' : 'Add Task'}
          </button>
        </form>
      </div>
    </div>
  );
}
