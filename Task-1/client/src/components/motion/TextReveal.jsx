import React from 'react';
import { m, useReducedMotion } from 'motion/react';
import { EASE_OUT, STAGGER_STAGED } from '../../lib/motion';
import { cn } from '../../lib/utils';

// motion-ui "TextReveal": a headline that arrives word by word. Each word
// rises on a soft spring while it fades and sharpens.
//
// `lines` is an array of { text, className, wordClassName } so one headline can have
// differently coloured lines yet keep a single, continuous stagger.
// It is a staged entrance — it plays once, on first load, and never replays.
const SPRING = { type: 'spring', stiffness: 140, damping: 26, mass: 1.2 };

export default function TextReveal({ lines, as: Tag = 'h1', className, delay = 0, stagger = STAGGER_STAGED, animate = true }) {
  const reduce = useReducedMotion();
  let index = 0;

  return (
    // Screen readers get the whole headline once; the animated words are hidden from them.
    <Tag className={className} aria-label={lines.map((l) => l.text).join(' ')}>
      {lines.map((line) => (
        <span key={line.text} aria-hidden="true" className={cn('block', line.className)}>
          {(line.text.match(/\S+\s*/g) || []).map((word, i) => {
            const d = delay + index * stagger;
            index += 1;
            return (
              <m.span
                key={`${word}-${i}`}
                // whitespace-pre keeps the word's trailing space, which an
                // inline-block would otherwise collapse to nothing
                // Colour goes on the word itself: `background-clip: text` on a
                // parent does not paint through a transformed child.
                className={cn('inline-block whitespace-pre will-change-transform', line.wordClassName)}
                initial={!animate ? false : reduce ? { opacity: 0 } : { y: '40%', opacity: 0, filter: 'blur(8px)' }}
                animate={reduce ? { opacity: 1 } : { y: 0, opacity: 1, filter: 'blur(0px)' }}
                transition={{
                  y: { ...SPRING, delay: d },
                  opacity: { duration: 0.5, ease: EASE_OUT, delay: d },
                  filter: { duration: 0.6, ease: EASE_OUT, delay: d },
                }}
              >
                {word}
              </m.span>
            );
          })}
        </span>
      ))}
    </Tag>
  );
}
