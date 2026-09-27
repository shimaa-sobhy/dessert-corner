import { useEffect, useRef, useState, type ReactNode } from 'react';

interface LazyMountProps {
  children: ReactNode;
  /** rootMargin passed to the IntersectionObserver; a small positive value
      mounts the content just before it enters the viewport (early enough to
      avoid pop-in, late enough to keep it out of the initial critical path).
      Wrappers must sit below real (non-collapsing) content so their observed
      position matches the true layout. */
  rootMargin?: string;
  className?: string;
}

export default function LazyMount({ children, rootMargin = '360px 0px', className }: LazyMountProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [on, setOn] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === 'undefined') {
      setOn(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setOn(true);
            io.disconnect();
          }
        }
      },
      { rootMargin }
    );
    io.observe(el);
    return () => io.disconnect();
  }, [rootMargin]);

  return (
    <div ref={ref} className={className}>
      {on ? children : null}
    </div>
  );
}