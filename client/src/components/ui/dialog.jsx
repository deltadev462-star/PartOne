import React from 'react';

export const Dialog = ({ open, onOpenChange, children }) => {
  if (!open) return null;
  
  return (
    <>
      <div 
        className="fixed inset-0 z-50 bg-black/50" 
        onClick={() => onOpenChange?.(false)}
      />
      {children}
    </>
  );
};

export const DialogContent = React.forwardRef(({ className = '', children, ...props }, ref) => (
  <div
    ref={ref}
    className={`fixed left-[50%] top-[50%] z-50 grid w-full max-w-lg translate-x-[-50%] translate-y-[-50%] gap-4 border bg-background p-6 shadow-lg duration-200 animate-in fade-in-0 zoom-in-95 slide-in-from-left-1/2 slide-in-from-top-[48%] sm:rounded-lg ${className}`}
    {...props}
  >
    {children}
  </div>
));
DialogContent.displayName = 'DialogContent';

export const DialogHeader = ({ className = '', ...props }) => (
  <div
    className={`flex flex-col space-y-1.5 text-center sm:text-left ${className}`}
    {...props}
  />
);

export const DialogTitle = React.forwardRef(({ className = '', ...props }, ref) => (
  <h2
    ref={ref}
    className={`text-lg font-semibold leading-none tracking-tight ${className}`}
    {...props}
  />
));
DialogTitle.displayName = 'DialogTitle';

export const DialogDescription = React.forwardRef(({ className = '', ...props }, ref) => (
  <p
    ref={ref}
    className={`text-sm text-muted-foreground ${className}`}
    {...props}
  />
));
DialogDescription.displayName = 'DialogDescription';

export const DialogFooter = ({ className = '', ...props }) => (
  <div
    className={`flex flex-col-reverse sm:flex-row sm:justify-end sm:space-x-2 ${className}`}
    {...props}
  />
);

export const DialogTrigger = React.forwardRef(({ ...props }, ref) => (
  <button ref={ref} {...props} />
));
DialogTrigger.displayName = 'DialogTrigger';