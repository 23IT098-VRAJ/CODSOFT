import { useState, useRef } from 'react';
import { Droppable, Draggable } from '@hello-pangea/dnd';
import TaskCard from './TaskCard';

const COLUMN_COLORS = {};

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
          <span className="text-[10px] font-medium tracking-widest uppercase text-[#8A8680]">{column.label}</span>
          <span className="bg-white border border-[#E5E2DC] text-[#4B4845] text-xs font-medium px-1.5 py-0.5 rounded-md min-w-[20px] text-center">
            {tasks.length}
          </span>
        </div>
        <button
          onClick={handleShowAdd}
          className="text-xs font-medium text-[#8A8680] hover:text-[#1A1917] transition-colors"
        >
          + Add Task
        </button>
      </div>

      <Droppable droppableId={column.id}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`min-h-[120px] bg-[#F0EFEC] rounded-xl p-3 border flex-1 transition-colors
              ${snapshot.isDraggingOver ? 'border-[#1A1917] bg-[#ECEAE7]' : 'border-[#E5E2DC]'}`}
          >
            {/* Inline add form */}
            {showAddForm && (
              <div className="bg-white border border-[#E5E2DC] rounded-xl p-3 mb-2 shadow-[0_1px_3px_rgba(0,0,0,0.06)]">
                <input
                  ref={inputRef}
                  type="text"
                  value={newTitle}
                  onChange={(e) => setNewTitle(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Task title..."
                  className="w-full text-sm text-[#1A1917] placeholder:text-[#BAB6B0] border-none outline-none bg-transparent"
                />
                <div className="flex gap-2 mt-2">
                  <button
                    onClick={handleAdd}
                    className="px-3 py-1 text-xs font-medium text-[#1A1917] hover:text-[#2E2C2A] transition-colors"
                  >Add</button>
                  <button
                    onClick={() => { setShowAddForm(false); setNewTitle(''); }}
                    className="px-3 py-1 text-xs text-[#8A8680] transition-colors"
                  >Cancel</button>
                </div>
              </div>
            )}

            {/* Tasks */}
            {tasks.length === 0 && !showAddForm && !snapshot.isDraggingOver && (
              <div className="border border-dashed border-[#D4D0C9] rounded-xl p-6 text-center">
                <p className="text-xs text-[#BAB6B0]">No tasks here · Drop or add one</p>
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
