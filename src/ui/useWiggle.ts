import { useEffect, useRef, useState } from 'react';

interface WiggleOptions {
  active: boolean;
  amplitudeDeg?: number; // rotation amplitude
  bobPx?: number; // vertical bob amplitude
  speed?: number; // cycles per second
}

// Returns { rotation, y } updated with a smooth sin wave when active
export function useWiggle({ active, amplitudeDeg = 2, bobPx = 3, speed = 2.2 }: WiggleOptions) {
  const frame = useRef(0);
  const start = useRef<number | null>(null);
  const [state, setState] = useState({ rotation: 0, y: 0 });

  useEffect(() => {
    let raf: number;
    function loop(ts: number) {
      if (!start.current) start.current = ts;
      const elapsed = (ts - start.current) / 1000; // seconds
      if (active) {
        const angle = Math.sin(elapsed * Math.PI * 2 * speed) * amplitudeDeg;
        const y = Math.cos(elapsed * Math.PI * 2 * speed * 0.5) * bobPx; // slower bob
        setState({ rotation: angle, y });
      } else if (state.rotation !== 0 || state.y !== 0) {
        // ease back to neutral
        setState((prev) => ({ rotation: prev.rotation * 0.85, y: prev.y * 0.75 }));
      }
      raf = requestAnimationFrame(loop);
    }
    raf = requestAnimationFrame(loop);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [active, amplitudeDeg, bobPx, speed]);

  return state; // { rotation, y }
}
