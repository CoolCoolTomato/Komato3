import React, { useLayoutEffect, useRef } from 'react';
import { gsap } from 'gsap';
import { SplitText } from 'gsap/SplitText';
import { ScrambleTextPlugin } from 'gsap/ScrambleTextPlugin';

import './ScrambledText.css';

gsap.registerPlugin(SplitText, ScrambleTextPlugin);

export interface ScrambledTextProps {
  radius?: number;
  duration?: number;
  speed?: number;
  scrambleChars?: string;
  className?: string;
  style?: React.CSSProperties;
  children: React.ReactNode;
}

const ScrambledText: React.FC<ScrambledTextProps> = ({
  radius = 100,
  duration = 1.2,
  speed = 0.5,
  scrambleChars = '.:',
  className = '',
  style = {},
  children
}) => {
  const rootRef = useRef<HTMLDivElement | null>(null);
  const charsRef = useRef<HTMLElement[]>([]);

  useLayoutEffect(() => {
    if (!rootRef.current) return;

    const paragraph = rootRef.current.querySelector('p');
    if (!paragraph) return;

    const split = SplitText.create(paragraph, {
      type: 'chars',
      charsClass: 'char'
    });

    charsRef.current = split.chars as HTMLElement[];

    charsRef.current.forEach(char => {
      const width = char.getBoundingClientRect().width;
      const content = char.textContent || '';

      gsap.set(char, {
        display: 'inline-block',
        width,
        textAlign: 'center',
        attr: {
          'data-content': content
        }
      });
    });

    const handleMove = (e: PointerEvent) => {
      charsRef.current.forEach(char => {
        const { left, top, width, height } = char.getBoundingClientRect();
        const dx = e.clientX - (left + width / 2);
        const dy = e.clientY - (top + height / 2);
        const dist = Math.hypot(dx, dy);

        if (dist >= radius) return;

        gsap.to(char, {
          overwrite: true,
          duration: duration * (1 - dist / radius),
          scrambleText: {
            text: char.dataset.content || '',
            chars: scrambleChars,
            speed
          },
          ease: 'none'
        });
      });
    };

    const el = rootRef.current;
    el.addEventListener('pointermove', handleMove);

    return () => {
      el.removeEventListener('pointermove', handleMove);
      split.revert();
    };
  }, [radius, duration, speed, scrambleChars, children]);

  return (
    <div ref={rootRef} className={`text-block ${className}`} style={style}>
      <p>{children}</p>
    </div>
  );
};

export default ScrambledText;