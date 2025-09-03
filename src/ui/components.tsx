import { useEffect, useState } from 'react';
// Modal that blocks on mobile/tablet
export function DeviceBlockModal() {
  const [show, setShow] = useState(false);
  useEffect(() => {
    function check() {
      // Show if width < 1024px (laptop breakpoint)
      setShow(window.innerWidth < 1024);
    }
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);
  if (!show) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 text-foreground animate-fade-in">
      <div className="max-w-xs w-full bg-card/90 rounded-2xl shadow-glass p-8 text-center border border-border/80">
        <div className="text-3xl mb-4">⚠️</div>
        <h2 className="text-xl font-bold mb-2">Desktop Only</h2>
        <p className="text-muted-foreground/80 mb-4">This app is designed for PC and desktop screens.<br />Please open on a larger device for the best experience.</p>
      </div>
    </div>
  );
}
// Glassy settings modal
export function SettingsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [sound, setSound] = useState(true);
  const [reducedMotion, setReducedMotion] = useState(false);
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm animate-fade-in">
      <Card className="p-8 w-full max-w-md animate-pop relative border border-border/80">
        <button className="absolute top-4 right-4 text-muted-foreground/60 hover:text-foreground text-2xl" onClick={onClose} aria-label="Close">×</button>
        <h2 className="text-xl font-bold mb-4 text-foreground/90">Settings</h2>
        <div className="space-y-5">
          <div className="flex items-center justify-between">
            <span className="text-base">Sound Effects</span>
            <label className="inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={sound} onChange={() => setSound(v => !v)} className="sr-only" />
              <span className={"w-10 h-6 bg-muted rounded-full relative transition" + (sound ? ' bg-success/60' : ' bg-muted/60')}>
                <span className={"absolute left-1 top-1 w-4 h-4 rounded-full bg-foreground transition-transform " + (sound ? 'translate-x-4' : '')}></span>
              </span>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <span className="text-base">Reduced Motion</span>
            <label className="inline-flex items-center cursor-pointer">
              <input type="checkbox" checked={reducedMotion} onChange={() => setReducedMotion(v => !v)} className="sr-only" />
              <span className={"w-10 h-6 bg-muted rounded-full relative transition" + (reducedMotion ? ' bg-success/60' : ' bg-muted/60')}>
                <span className={"absolute left-1 top-1 w-4 h-4 rounded-full bg-foreground transition-transform " + (reducedMotion ? 'translate-x-4' : '')}></span>
              </span>
            </label>
          </div>
        </div>
        <div className="mt-8 text-xs text-muted-foreground/70 text-center">
          <div className="mb-2">Cute To-Do App</div>
          <div>Made with ❤️, glass, and code.</div>
        </div>
      </Card>
    </div>
  );
}
import React from 'react';
import { cva, type VariantProps } from 'class-variance-authority';
import { twMerge } from 'tailwind-merge';
import { motion } from 'framer-motion';

export function cn(...classes: (string | undefined | null | false)[]) {
  return twMerge(classes.filter(Boolean).join(' '));
}

// Card shell
export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement> & { glow?: boolean }>(
  ({ className, glow, ...props }, ref) => (
    <div
      ref={ref}
      className={cn(
        'relative rounded-2xl bg-card/80 shadow-glass border border-border/80 backdrop-blur-lg',
        glow && 'shadow-glow',
        'transition-all duration-300 hover:shadow-glow focus-within:shadow-glow',
        className
      )}
      {...props}
    />
  )
);
Card.displayName = 'Card';

const buttonStyles = cva(
  'inline-flex items-center gap-1.5 rounded-full font-semibold px-4 h-11 text-base shadow-soft transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-border/60 disabled:opacity-40 disabled:cursor-not-allowed active:scale-[0.97] select-none',
  {
    variants: {
      variant: {
        solid: 'bg-primary text-primary-foreground hover:brightness-105 shadow-glass',
        subtle: 'bg-card/80 text-foreground hover:bg-card/60',
        outline: 'border border-border text-foreground hover:bg-card/40',
        ghost: 'hover:bg-card/60 text-foreground',
        danger: 'bg-danger text-danger-foreground hover:brightness-110'
      },
      size: {
        sm: 'h-9 px-3 text-sm',
        md: 'h-11 px-4 text-base',
        lg: 'h-14 px-6 text-lg'
      }
    },
    defaultVariants: { variant: 'solid', size: 'md' }
  }
);
// Floating Action Button (FAB)
export function Fab({ onClick, icon, label, className }: { onClick: () => void; icon: React.ReactNode; label?: string; className?: string }) {
  return (
    <button
      onClick={onClick}
      className={cn(
        "fixed z-30 bottom-8 right-8 bg-card/80 text-foreground rounded-full shadow-glass border border-border/80 w-16 h-16 flex items-center justify-center text-3xl hover:scale-105 active:scale-95 transition-all duration-200 animate-pop group backdrop-blur-lg",
        className
      )}
      aria-label={label || 'Add'}
    >
      <span className="group-hover:animate-wiggle">{icon}</span>
    </button>
  );
}

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement>, VariantProps<typeof buttonStyles> {
  asChild?: boolean;
}
export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  ({ className, variant, size, ...props }, ref) => (
    <button ref={ref} className={cn(buttonStyles({ variant, size }), className)} {...props} />
  )
);
Button.displayName = 'Button';

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(function Input(
  { className, ...props }, ref
) {
  return (
    <input
      ref={ref}
      className={cn('w-full h-10 rounded-lg bg-accent/40 border border-accent/60 px-3 text-sm placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none transition', className)}
      {...props}
    />
  );
});

export const TextArea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(function TA({ className, ...props }, ref) {
  return (
    <textarea
      ref={ref}
      className={cn('w-full rounded-lg bg-accent/40 border border-accent/60 px-3 py-2 text-sm placeholder:text-muted-foreground/70 focus-visible:ring-2 focus-visible:ring-primary/50 focus-visible:outline-none transition resize-none', className)}
      {...props}
    />
  );
});

export function EmptyState() {
  return (
    <div className="p-12 text-center text-muted-foreground/70 text-sm animate-fade-in">
      No tasks yet. Add something you want to accomplish today.
    </div>
  );
}

export const FadeSlide = ({ children, className }: { children: React.ReactNode; className?: string }) => (
  <motion.div
    initial={{ opacity: 0, y: 6 }}
    animate={{ opacity: 1, y: 0 }}
    exit={{ opacity: 0, y: -6 }}
    transition={{ duration: 0.38, ease: [0.21, 0.68, 0.18, 1] }}
    className={className}
  >
    {children}
  </motion.div>
);
