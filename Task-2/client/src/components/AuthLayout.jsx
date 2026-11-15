import { useEffect, useState } from 'react';
import { m, useReducedMotion } from 'motion/react';
import { CheckCircle2 } from 'lucide-react';
import { EASE_OUT, STAGGER_STAGED } from '../lib/motion';

// ── A small, living preview of the product ────────────────────────────
// Six placeholder tasks on a three-column board. Every couple of seconds one
// task moves a column to the right, the way real work does; a finished task
// eventually returns to the start. Each card keeps its identity (layoutId),
// so it glides to its new column instead of disappearing and reappearing.
const COLUMNS = ['To Do', 'In Progress', 'Done'];
const START = [
  { id: 1, col: 0, w: 'w-4/5', dot: '#6366f1' },
  { id: 2, col: 0, w: 'w-3/5', dot: '#f59e0b' },
  { id: 3, col: 0, w: 'w-2/3', dot: '#0ea5e9' },
  { id: 4, col: 1, w: 'w-3/4', dot: '#10b981' },
  { id: 5, col: 1, w: 'w-1/2', dot: '#ec4899' },
  { id: 6, col: 2, w: 'w-2/3', dot: '#8b5cf6' },
];

function BoardPreview() {
  const reduce = useReducedMotion();
  const [cards, setCards] = useState(START);

  useEffect(() => {
    if (reduce) return undefined; // a still picture for those who prefer it
    let step = 0;
    const timer = setInterval(() => {
      setCards((prev) => {
        const next = prev.map((c) => ({ ...c }));
        const card = next[step % next.length];
        card.col = (card.col + 1) % COLUMNS.length;
        return next;
      });
      step += 1;
    }, 2200);
    return () => clearInterval(timer);
  }, [reduce]);

  return (
    <div className="grid grid-cols-3 gap-3" aria-hidden="true">
      {COLUMNS.map((label, col) => (
        <div key={label} className="rounded-xl bg-white/[0.06] border border-white/10 p-2.5 min-h-[13rem]">
          <p className="text-[9px] font-medium tracking-widest uppercase text-white/50 mb-2.5 px-0.5">{label}</p>
          <div className="space-y-2">
            {cards.filter((c) => c.col === col).map((c) => (
              <m.div key={c.id} layoutId={`preview-${c.id}`} transition={{ type: 'spring', stiffness: 260, damping: 28 }}
                className="rounded-lg bg-white p-2.5 shadow-lg">
                <div className="flex items-center gap-1.5 mb-2">
                  <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.dot }} />
                  <span className={`h-1.5 rounded-full bg-ink/80 ${c.w}`} />
                </div>
                <span className="block h-1 rounded-full bg-ink/15 w-full" />
                <div className="flex items-center justify-between mt-2.5">
                  <span className="h-2.5 w-8 rounded bg-ink/10" />
                  {col === 2 ? <CheckCircle2 className="w-3 h-3 text-emerald-600" /> : <span className="w-3 h-3 rounded-full" style={{ backgroundColor: c.dot }} />}
                </div>
              </m.div>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

let entrancePlayed = false;

const POINTS = ['Drag tasks across a board', 'See who is doing what', 'Know what is late before it hurts'];

// Shared frame for the sign-in and sign-up pages: the form on one side, a
// dark panel with the product preview on the other (hidden on small screens).
export default function AuthLayout({ title, subtitle, children, footer }) {
  // A one-off staged entrance, 100ms between parts. It plays the first time
  // an auth screen is shown; switching between sign-in and sign-up does not
  // replay it.
  const [replay] = useState(() => !entrancePlayed);
  useEffect(() => {
    entrancePlayed = true;
  }, []);
  const staged = (step) => ({
    initial: replay ? { opacity: 0, y: 10 } : false,
    animate: { opacity: 1, y: 0 },
    transition: { duration: 0.4, ease: EASE_OUT, delay: step * STAGGER_STAGED },
  });

  return (
    <div className="min-h-screen grid lg:grid-cols-2 bg-paper">
      <div className="flex items-center justify-center px-4 py-12">
        <div className="w-full max-w-sm">
          <m.div {...staged(0)} className="mb-8">
            <p className="text-lg font-semibold tracking-tight text-ink">TaskFlow</p>
            <h1 className="text-2xl font-semibold tracking-tight text-ink mt-6">{title}</h1>
            <p className="text-sm text-muted mt-1">{subtitle}</p>
          </m.div>
          <m.div {...staged(1)} className="card p-7">{children}</m.div>
          <m.p {...staged(2)} className="text-center text-sm text-muted mt-6">{footer}</m.p>
        </div>
      </div>

      <div className="hidden lg:flex relative overflow-hidden bg-ink items-center justify-center p-12">
        {/* soft light, adapted from motion-ui's "soft spotlight" backdrop */}
        <div aria-hidden="true" className="absolute -top-32 -right-24 w-[32rem] h-[32rem] rounded-full bg-indigo-500/20 blur-[120px]" />
        <div aria-hidden="true" className="absolute -bottom-40 -left-24 w-[28rem] h-[28rem] rounded-full bg-amber-400/10 blur-[120px]" />
        <div aria-hidden="true" className="absolute inset-0 opacity-[0.05] [background-image:radial-gradient(circle,#fff_1px,transparent_1px)] [background-size:5px_5px]" />

        <div className="relative w-full max-w-md">
          <m.div {...staged(1)}>
            <h2 className="text-3xl font-semibold tracking-tight text-white leading-tight">Plan it. Move it.<br />Ship it together.</h2>
            <ul className="mt-5 space-y-2">
              {POINTS.map((p) => (
                <li key={p} className="flex items-center gap-2.5 text-sm text-white/70"><CheckCircle2 className="w-4 h-4 text-white/40" /> {p}</li>
              ))}
            </ul>
          </m.div>
          <m.div {...staged(3)} className="mt-10"><BoardPreview /></m.div>
        </div>
      </div>
    </div>
  );
}
