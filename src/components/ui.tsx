import React from 'react';
import { cn } from '../lib/utils';
import { LucideIcon } from 'lucide-react';

export const Button = React.forwardRef<
  HTMLButtonElement,
  React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: 'primary' | 'ghost' | 'danger', size?: 'default' | 'sm' | 'full' }
>(({ className, variant = 'ghost', size = 'default', ...props }, ref) => {
  return (
    <button
      ref={ref}
      className={cn(
        "inline-flex items-center justify-center gap-1.5 font-outfit font-bold transition-all active:scale-95 active:opacity-85 disabled:opacity-35 disabled:pointer-events-none select-none",
        {
          "bg-primary text-white shadow-lg shadow-orange-200/60 hover:bg-primary-dim": variant === 'primary',
          "bg-white text-slate-600 border border-slate-200 hover:bg-slate-50 shadow-sm": variant === 'ghost',
          "bg-white text-danger border border-danger hover:bg-danger-bg shadow-sm": variant === 'danger',
          "px-4 py-2.5 rounded-xl text-sm": size === 'default',
          "px-3 py-1.5 rounded-lg text-xs": size === 'sm',
          "w-full px-4 py-3.5 rounded-xl text-sm": size === 'full',
        },
        className
      )}
      {...props}
    />
  );
});
Button.displayName = "Button";

export const Input = React.forwardRef<HTMLInputElement, React.InputHTMLAttributes<HTMLInputElement>>(({ className, ...props }, ref) => (
  <input
    ref={ref}
    className={cn(
      "w-full bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-outfit text-sm px-4 py-3 outline-none transition-all placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(249,115,22,0.1)]",
      className
    )}
    {...props}
  />
));
Input.displayName = "Input";

export const Textarea = React.forwardRef<HTMLTextAreaElement, React.TextareaHTMLAttributes<HTMLTextAreaElement>>(({ className, ...props }, ref) => (
  <textarea
    ref={ref}
    className={cn(
      "w-full bg-slate-50 border border-slate-200 rounded-2xl text-slate-800 font-outfit text-sm px-4 py-3 outline-none transition-all placeholder:text-slate-400 focus:border-orange-400 focus:bg-white focus:shadow-[0_0_0_4px_rgba(249,115,22,0.1)] resize-y min-h-[100px]",
      className
    )}
    {...props}
  />
));
Textarea.displayName = "Textarea";

export const Card = React.forwardRef<HTMLDivElement, React.HTMLAttributes<HTMLDivElement>>(({ className, children, ...props }, ref) => (
  <div ref={ref} className={cn("bg-white border border-slate-200 rounded-[24px] p-6 shadow-sm mb-4 flex flex-col", className)} {...props}>
    {children}
  </div>
));
Card.displayName = "Card";

export const Badge = ({ children, variant = 'muted', className }: { children: React.ReactNode, variant?: 'success' | 'danger' | 'muted', className?: string }) => (
  <span className={cn(
    "inline-block px-2.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wide",
    {
      "bg-emerald-500/10 text-emerald-600": variant === 'success',
      "bg-rose-500/10 text-rose-600": variant === 'danger',
      "bg-slate-100 text-slate-500": variant === 'muted',
    },
    className
  )}>
    {children}
  </span>
);

export const SectionHeader = ({ children, className }: { children: React.ReactNode, className?: string }) => (
  <div className={cn("text-[11px] font-bold tracking-widest uppercase text-slate-400 my-5 mb-3 flex items-center justify-between gap-4", className)}>
    <span>{children}</span>
    <div className="flex-1 h-px bg-slate-200" />
  </div>
);
