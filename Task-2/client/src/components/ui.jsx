// Shared presentational pieces: the same badge, avatar, dialog and empty
// state everywhere, instead of a slightly different copy on each page.
import { useEffect, useId } from 'react';
import { createPortal } from 'react-dom';
import { AnimatePresence, m } from 'motion/react';
import { Loader2, X } from 'lucide-react';
import { DUR, EASE_DRAWER, POP, SPRING_LAYOUT, T_EXIT, T_STATE } from '../lib/motion';
import { cn } from '../lib/utils';

export function Spinner({ className = 'w-4 h-4' }) {
  return <Loader2 className={cn('animate-spin', className)} aria-label="Loading" />;
}

export function PageLoader() {
  return <div className="flex items-center justify-center h-64 text-muted"><Spinner className="w-6 h-6" /></div>;
}

// ── Avatars ───────────────────────────────────────────────────────────
const AVATAR_SIZES = { sm: 'w-6 h-6 text-[10px]', md: 'w-8 h-8 text-xs', lg: 'w-12 h-12 text-base' };

export function Avatar({ user, size = 'md', className }) {
  if (!user) return null;
  return (
    <span title={user.name} style={{ backgroundColor: user.avatarColor || '#6366f1' }}
      className={cn('rounded-full inline-flex items-center justify-center font-semibold text-white shrink-0 ring-2 ring-surface', AVATAR_SIZES[size], className)}>
      {user.name?.charAt(0)?.toUpperCase() || '?'}
    </span>
  );
}

export function AvatarStack({ users = [], max = 4, size = 'sm' }) {
  return (
    <div className="flex -space-x-1.5">
      {users.slice(0, max).map((u) => <Avatar key={u._id} user={u} size={size} />)}
      {users.length > max && (
        <span className={cn('rounded-full bg-sunken text-ink-soft font-medium inline-flex items-center justify-center ring-2 ring-surface', AVATAR_SIZES[size])}>
          +{users.length - max}
        </span>
      )}
    </div>
  );
}

// ── Badges ────────────────────────────────────────────────────────────
const TONES = {
  Low: 'bg-success-soft text-success',
  Medium: 'bg-warn-soft text-warn',
  High: 'bg-danger-soft text-danger',
  Todo: 'bg-sunken text-ink-soft',
  'In Progress': 'bg-info-soft text-info',
  Done: 'bg-success-soft text-success',
  Active: 'bg-success-soft text-success',
  Completed: 'bg-info-soft text-info',
  'On Hold': 'bg-warn-soft text-warn',
};

export function Badge({ value, label, className }) {
  if (!value) return null;
  return <span className={cn('badge', TONES[value] || 'bg-sunken text-muted', className)}>{label || value}</span>;
}

// ── Progress ──────────────────────────────────────────────────────────
// The bar grows with a transform (scaleX), not by animating its width.
export function ProgressBar({ percent, color = '#1A1917', className }) {
  return (
    <div className={cn('h-1.5 bg-sunken rounded-full overflow-hidden', className)} role="progressbar" aria-valuenow={percent} aria-valuemin={0} aria-valuemax={100}>
      <m.div className="h-full w-full rounded-full origin-left" style={{ backgroundColor: color }}
        initial={{ scaleX: 0 }} animate={{ scaleX: Math.min(100, Math.max(0, percent)) / 100 }} transition={{ duration: 0.5, ease: EASE_DRAWER }} />
    </div>
  );
}

// motion-ui "ProgressRing": the arc draws itself using SVG pathLength.
export function ProgressRing({ percent, size = 120, stroke = 10, color = '#1A1917', children }) {
  const r = (size - stroke) / 2;
  return (
    <div className="relative inline-flex items-center justify-center" style={{ width: size, height: size }}>
      <svg width={size} height={size} className="-rotate-90" aria-hidden="true">
        <circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke="#F0EFEC" strokeWidth={stroke} />
        <m.circle cx={size / 2} cy={size / 2} r={r} fill="none" stroke={color} strokeWidth={stroke} strokeLinecap="round"
          initial={{ pathLength: 0 }} animate={{ pathLength: percent / 100 }} transition={{ duration: 0.7, ease: EASE_DRAWER }} />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">{children}</div>
    </div>
  );
}

// ── Tabs ──────────────────────────────────────────────────────────────
// motion-ui "segmented control": one highlight pill glides between options
// (a shared layoutId) instead of each option fading its own background.
export function Tabs({ tabs, value, onChange, className }) {
  const id = useId();
  return (
    <div role="tablist" className={cn('inline-flex bg-sunken rounded-lg p-0.5', className)}>
      {tabs.map((tab) => {
        const active = tab.value === value;
        const Icon = tab.icon;
        return (
          <button key={tab.value} role="tab" aria-selected={active} onClick={() => onChange(tab.value)}
            className={cn('relative px-3 py-1.5 text-xs font-medium rounded-md whitespace-nowrap', active ? 'text-ink' : 'text-muted hover:text-ink-soft')}>
            {active && <m.span layoutId={`tab-pill-${id}`} transition={SPRING_LAYOUT} className="absolute inset-0 bg-surface rounded-md shadow-card" />}
            <span className="relative inline-flex items-center gap-1.5">
              {Icon && <Icon className="w-3.5 h-3.5" />}{tab.label}
              {tab.count !== undefined && <span className="text-faint">{tab.count}</span>}
            </span>
          </button>
        );
      })}
    </div>
  );
}

// ── Overlays ──────────────────────────────────────────────────────────
function useOverlay(open, onClose) {
  useEffect(() => {
    if (!open) return undefined;
    const onKey = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    const { overflow } = document.body.style;
    document.body.style.overflow = 'hidden'; // the page behind does not scroll
    return () => {
      window.removeEventListener('keydown', onKey);
      document.body.style.overflow = overflow;
    };
  }, [open, onClose]);
}

const Backdrop = ({ onClose }) => (
  <m.div initial={{ opacity: 0 }} animate={{ opacity: 1, transition: T_STATE }} exit={{ opacity: 0, transition: T_EXIT }}
    onClick={onClose} className="absolute inset-0 bg-ink/25 backdrop-blur-[2px]" />
);

// A centred dialog: 200ms in, 150ms out, from 0.95 scale — never from zero.
export function Modal({ open, onClose, title, children, className }) {
  useOverlay(open, onClose);
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4" role="dialog" aria-modal="true" aria-label={title}>
          <Backdrop onClose={onClose} />
          <m.div {...POP} className={cn('relative card shadow-overlay w-full max-w-md p-6 max-h-[90vh] overflow-y-auto', className)}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-base font-semibold tracking-tight">{title}</h2>
              <button onClick={onClose} aria-label="Close" className="btn-icon -mr-2"><X className="w-4 h-4" /></button>
            </div>
            {children}
          </m.div>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// A panel that slides in from the right: 400ms in, 350ms out on the drawer curve.
export function Drawer({ open, onClose, title, children, footer }) {
  useOverlay(open, onClose);
  return createPortal(
    <AnimatePresence>
      {open && (
        <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
          <Backdrop onClose={onClose} />
          <m.aside
            initial={{ x: '100%' }}
            animate={{ x: 0, transition: { duration: DUR.drawerIn, ease: EASE_DRAWER } }}
            exit={{ x: '100%', transition: { duration: DUR.drawerOut, ease: EASE_DRAWER } }}
            className="absolute inset-y-0 right-0 w-full max-w-lg bg-surface shadow-overlay flex flex-col"
          >
            <header className="flex items-center justify-between px-6 h-14 border-b border-line shrink-0">
              <h2 className="text-sm font-semibold tracking-tight">{title}</h2>
              <button onClick={onClose} aria-label="Close" className="btn-icon -mr-2"><X className="w-4 h-4" /></button>
            </header>
            <div className="flex-1 overflow-y-auto scroll-thin">{children}</div>
            {footer && <footer className="border-t border-line px-6 py-3 shrink-0">{footer}</footer>}
          </m.aside>
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

// Replaces window.confirm with a dialog that matches the app.
export function ConfirmDialog({ open, onClose, onConfirm, title, message, confirmLabel = 'Delete', busy = false }) {
  return (
    <Modal open={open} onClose={onClose} title={title}>
      <p className="text-sm text-ink-soft">{message}</p>
      <div className="flex justify-end gap-2 mt-6">
        <button onClick={onClose} className="btn-outline">Cancel</button>
        <button onClick={onConfirm} disabled={busy} className="btn-danger">{busy && <Spinner />}{confirmLabel}</button>
      </div>
    </Modal>
  );
}

// ── States ────────────────────────────────────────────────────────────
export function EmptyState({ icon: Icon, title, message, action, className }) {
  return (
    <div className={cn('border border-dashed border-line-strong rounded-xl px-6 py-12 flex flex-col items-center text-center', className)}>
      {Icon && <span className="w-11 h-11 rounded-xl bg-sunken flex items-center justify-center mb-4"><Icon className="w-5 h-5 text-muted" /></span>}
      <p className="text-sm font-medium text-ink">{title}</p>
      {message && <p className="text-xs text-muted mt-1 max-w-xs">{message}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}

export function ErrorState({ message, onRetry }) {
  return (
    <div className="card px-6 py-10 text-center">
      <p className="text-sm font-medium">Couldn't load this</p>
      <p className="text-xs text-muted mt-1">{message}</p>
      {onRetry && <button onClick={onRetry} className="btn-outline mt-5">Try again</button>}
    </div>
  );
}

export function Field({ label, error, hint, className, children }) {
  return (
    <label className={cn('block', className)}>
      <span className="label">{label}</span>
      {children}
      {error ? <p className="field-error" role="alert">{error}</p> : hint ? <p className="text-xs text-muted mt-1">{hint}</p> : null}
    </label>
  );
}
