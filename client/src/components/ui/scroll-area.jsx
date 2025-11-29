import React from 'react';

export const ScrollArea = React.forwardRef(({ className = '', children, ...props }, ref) => (
  <div
    ref={ref}
    className={`relative overflow-auto ${className}`}
    {...props}
  >
    <div className="h-full w-full">{children}</div>
  </div>
));

ScrollArea.displayName = 'ScrollArea';