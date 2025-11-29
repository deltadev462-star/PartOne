import React from 'react';

export const TooltipProvider = ({ children }) => {
  return <>{children}</>;
};

export const Tooltip = ({ children }) => {
  return <div className="relative inline-block">{children}</div>;
};

export const TooltipTrigger = React.forwardRef(({ asChild, children, ...props }, ref) => {
  const Comp = asChild ? 'span' : 'div';
  return (
    <Comp ref={ref} {...props}>
      {children}
    </Comp>
  );
});
TooltipTrigger.displayName = 'TooltipTrigger';

export const TooltipContent = React.forwardRef(({ className = '', sideOffset = 4, ...props }, ref) => (
  <div
    ref={ref}
    className={`z-50 overflow-hidden rounded-md border bg-popover px-3 py-1.5 text-sm text-popover-foreground shadow-md animate-in fade-in-0 zoom-in-95 data-[state=closed]:animate-out data-[state=closed]:fade-out-0 data-[state=closed]:zoom-out-95 data-[side=bottom]:slide-in-from-top-2 data-[side=left]:slide-in-from-right-2 data-[side=right]:slide-in-from-left-2 data-[side=top]:slide-in-from-bottom-2 ${className}`}
    {...props}
  />
));
TooltipContent.displayName = 'TooltipContent';