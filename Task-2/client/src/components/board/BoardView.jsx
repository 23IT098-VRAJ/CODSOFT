import { useRef, useState } from 'react';
import { DragDropContext, Draggable, Droppable } from '@hello-pangea/dnd';
import { CalendarDays, MessageSquare, Plus } from 'lucide-react';
import { Avatar, Badge } from '../ui';
import { formatDate, isOverdue, STATUS_LABELS, TASK_STATUSES } from '../../lib/format';

// A task on the board. The drag library owns this element's transform while
// it is being dragged, so the card itself carries no animation of its own —
// only a quick shadow on hover.
export function TaskCard({ task, color, onOpen, dragging }) {
  const overdue = isOverdue(task);
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => onOpen(task)}
      onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && (e.preventDefault(), onOpen(task))}
      className={`card p-3.5 mb-2 cursor-pointer select-none hover:shadow-lift transition-shadow ${dragging ? 'shadow-overlay border-ink rotate-1' : ''}`}
    >
      <div className="flex items-start gap-2">
        <span className="w-1.5 h-1.5 rounded-full mt-1.5 shrink-0" style={{ backgroundColor: color }} />
        <p className={`text-sm font-medium leading-snug ${task.status === 'Done' ? 'text-muted line-through' : 'text-ink'}`}>{task.title}</p>
      </div>
      {task.description && <p className="text-xs text-muted line-clamp-2 mt-1.5 ml-3.5">{task.description}</p>}
      <div className="flex items-center justify-between mt-3">
        <Badge value={task.priority} />
        <div className="flex items-center gap-2">
          {task.dueDate && (
            <span className={`text-[11px] inline-flex items-center gap-1 ${overdue ? 'text-danger bg-danger-soft px-1.5 py-0.5 rounded-md' : 'text-muted'}`}>
              <CalendarDays className="w-3 h-3" /> {formatDate(task.dueDate)}
            </span>
          )}
          {task.assigneeId && <Avatar user={task.assigneeId} size="sm" />}
        </div>
      </div>
    </div>
  );
}

function Column({ status, tasks, color, onOpen, onAdd, dragDisabled }) {
  const [adding, setAdding] = useState(false);
  const [title, setTitle] = useState('');
  const inputRef = useRef(null);

  const start = () => {
    setAdding(true);
    requestAnimationFrame(() => inputRef.current?.focus());
  };
  const cancel = () => {
    setAdding(false);
    setTitle('');
  };
  const submit = (e) => {
    e.preventDefault();
    if (!title.trim()) return;
    onAdd({ title: title.trim(), status });
    setTitle('');
    inputRef.current?.focus(); // stay ready for the next one
  };

  return (
    <section className="flex flex-col w-[19rem] shrink-0" aria-label={STATUS_LABELS[status]}>
      <div className="flex items-center justify-between mb-3 px-1">
        <div className="flex items-center gap-2">
          <h3 className="eyebrow">{STATUS_LABELS[status]}</h3>
          <span className="bg-surface border border-line text-ink-soft text-xs font-medium px-1.5 rounded-md min-w-[1.25rem] text-center tabular-nums">{tasks.length}</span>
        </div>
        <button onClick={start} className="btn-icon !p-1" aria-label={`Add a task to ${STATUS_LABELS[status]}`}><Plus className="w-4 h-4" /></button>
      </div>

      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div ref={provided.innerRef} {...provided.droppableProps}
            className={`flex-1 min-h-[8rem] rounded-xl p-2.5 border ${snapshot.isDraggingOver ? 'border-ink bg-[#ECEAE7]' : 'border-line bg-sunken'}`}>
            {adding && (
              <form onSubmit={submit} className="card p-3 mb-2">
                <input ref={inputRef} value={title} onChange={(e) => setTitle(e.target.value)} onKeyDown={(e) => e.key === 'Escape' && cancel()}
                  placeholder="Task title" maxLength={200} aria-label="New task title"
                  className="w-full text-sm bg-transparent outline-none placeholder:text-faint" />
                <div className="flex gap-2 mt-2.5">
                  <button type="submit" className="btn-primary !py-1 !px-3 !text-xs">Add</button>
                  <button type="button" onClick={cancel} className="btn-ghost !py-1 !px-3 !text-xs">Cancel</button>
                </div>
              </form>
            )}

            {tasks.length === 0 && !adding && !snapshot.isDraggingOver && (
              <button onClick={start} className="w-full border border-dashed border-line-strong rounded-xl p-5 text-xs text-faint hover:text-muted hover:border-muted">
                Drop a task here, or add one
              </button>
            )}

            {tasks.map((task, index) => (
              <Draggable key={task._id} draggableId={task._id} index={index} isDragDisabled={dragDisabled}>
                {(drag, state) => (
                  <div ref={drag.innerRef} {...drag.draggableProps} {...drag.dragHandleProps}>
                    <TaskCard task={task} color={color} onOpen={onOpen} dragging={state.isDragging} />
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </section>
  );
}

// The Kanban board. `columns` maps each status to its tasks in display order.
export default function BoardView({ columns, color, onOpen, onAdd, onMove, dragDisabled }) {
  const handleDragEnd = ({ draggableId, source, destination }) => {
    if (!destination) return;
    if (source.droppableId === destination.droppableId && source.index === destination.index) return;
    onMove(draggableId, destination.droppableId, destination.index);
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <div className="flex gap-4 overflow-x-auto scroll-thin pb-4 items-start">
        {TASK_STATUSES.map((status) => (
          <Column key={status} status={status} tasks={columns[status]} color={color} onOpen={onOpen} onAdd={onAdd} dragDisabled={dragDisabled} />
        ))}
      </div>
      {dragDisabled && (
        <p className="text-xs text-muted mt-1 flex items-center gap-1.5"><MessageSquare className="w-3.5 h-3.5" /> Clear the filters to drag tasks — positions only make sense when the whole column is showing.</p>
      )}
    </DragDropContext>
  );
}
