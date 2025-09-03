import { useEffect, useRef, useState } from 'react';

interface WiggleOptions {
  active: boolean;
  amplitudeDeg?: number;
  bobPx?: number;
  speed?: number;
}

export function useWiggle({ active, amplitudeDeg = 2, bobPx = 3, speed = 2.2 }: WiggleOptions) {
  const frame = useRef(0);
  const start = useRef<number | null>(null);
  const [state, setState] = useState({ rotation: 0, y: 0 });

  useEffect(() => {
    let raf: number;
    function loop(ts: number) {
      if (!start.current) start.current = ts;
      const elapsed = (ts - start.current) / 1000;
      if (active) {
        const angle = Math.sin(elapsed * Math.PI * 2 * speed) * amplitudeDeg;
        const y = Math.cos(elapsed * Math.PI * 2 * speed * 0.5) * bobPx;
        setState({ rotation: angle, y });
      } else if (state.rotation !== 0 || state.y !== 0) {
        setState((prev) => ({ rotation: prev.rotation * 0.85, y: prev.y * 0.75 }));
      }
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
  }, [active, amplitudeDeg, bobPx, speed]);

  return state;
}
