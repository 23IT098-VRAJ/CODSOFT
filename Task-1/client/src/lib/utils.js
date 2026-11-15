import clsx from 'clsx';
import { twMerge } from 'tailwind-merge';

// Class-name helper used by the animated components (the Magic UI / shadcn
// convention): joins conditional classes and lets a later Tailwind class
// override an earlier one, so a `className` prop can restyle a component.
export function cn(...inputs) {
  return twMerge(clsx(inputs));
}
