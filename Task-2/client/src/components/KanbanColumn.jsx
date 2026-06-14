import { useState, useRef } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';

const COLUMN_COLORS = {
  'Todo': 'bg-gray-100 text-gray-600',
  'In Progress': 'bg-blue-100 text-blue-700',
  'Done': 'bg-green-100 text-green-700',
};

export const KanbanColumn = ({ column, tasks, project, onTaskClick, onAddTask }) => {
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const inputRef = useRef(null);

  const handleShowAdd = () => {
    setShowAddForm(true);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  const handleAdd = () => {
    if (!newTitle.trim()) return;
    onAddTask({ title: newTitle.trim(), status: column.id });
    setNewTitle('');
    setShowAddForm(false);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') handleAdd();
    if (e.key === 'Escape') { setShowAddForm(false); setNewTitle(''); }
  };

  return (
    <div className="flex flex-col w-80 flex-shrink-0">
      {/* Column header */}
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-sm font-semibold text-gray-700">{column.label}</span>
          <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${COLUMN_COLORS[column.id] || 'bg-gray-100 text-gray-600'}`}>
            {tasks.length}
          </span>
        </div>
        <button
          onClick={handleShowAdd}
          className="text-indigo-600 hover:text-indigo-800 text-sm font-medium transition"
        >
          + Add Task
        </button>
      </div>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[100px] bg-gray-50 rounded-2xl p-3 border flex-1 transition-colors
              ${snapshot.isDraggingOver ? 'border-indigo-300 bg-indigo-50' : 'border-gray-200'}`}
          >
            {/* Inline add form */}
            {showAddForm && (
              <div className="bg-white rounded-xl shadow-sm p-3 mb-2 border border-indigo-200">
                <input
                  ref={inputRef}
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Task title..."
                  className="w-full text-sm border-none outline-none bg-transparent"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleAdd}
                    className="px-3 py-1 bg-indigo-600 text-white text-xs rounded-lg hover:bg-indigo-700 transition"
                  >Add</button>
                  <button
                    onClick={() => { setShowAddForm(false); setNewTitle(''); }}
                    className="px-3 py-1 text-gray-500 text-xs hover:text-gray-700 transition"
                  >Cancel</button>
                </div>
              </div>
            )}

            {/* Tasks */}
            {tasks.length === 0 && !showAddForm && !snapshot.isDraggingOver && (
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center">
                <p className="text-xs text-gray-400">No tasks here · Drop or add one</p>
              </div>
            )}

            {tasks.map((task, index) => (
              <Draggable key={task._id} draggableId={task._id.toString()} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    <TaskCard
                      task={task}
                      project={project}
                      onClick={onTaskClick}
                      isDragging={snapshot.isDragging}
                    />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </div>
  );
};

export default KanbanColumn;
