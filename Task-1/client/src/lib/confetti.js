// Magic UI "Confetti" (built on canvas-confetti). The library is imported
// on demand, so it is only downloaded by people who actually place an order,
// and it is skipped entirely for users who prefer reduced motion.
const GOLD = ['#D4A017', '#F6D878', '#0B1120', '#FFFFFF'];

export async function celebrate() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  const { default: confetti } = await import('canvas-confetti');

  // Two bursts from the bottom corners, then a soft shower from the middle.
  const burst = (originX, angle) =>
    confetti({ particleCount: 70, spread: 65, angle, startVelocity: 55, origin: { x: originX, y: 0.9 }, colors: GOLD });
  burst(0.1, 60);
  burst(0.9, 120);
  setTimeout(() => confetti({ particleCount: 90, spread: 110, origin: { y: 0.35 }, colors: GOLD, scalar: 0.9 }), 250);
}
