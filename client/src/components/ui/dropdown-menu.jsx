import React, { useState, useRef, useEffect, createContext, useContext } from 'react';

const DropdownContext = createContext();

export const DropdownMenu = ({ children, open: controlledOpen, onOpenChange }) => {
  const [uncontrolledOpen, setUncontrolledOpen] = useState(false);
  const isControlled = controlledOpen !== undefined;
  const open = isControlled ? controlledOpen : uncontrolledOpen;
  
  const setOpen = (newOpen) => {
    if (isControlled) {
      onOpenChange?.(newOpen);
    } else {
      setUncontrolledOpen(newOpen);
    }
  };

  const menuRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (menuRef.current && !menuRef.current.contains(event.target) && open) {
        setOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open]);

  return (
    <DropdownContext.Provider value={{ open, setOpen }}>
      <div ref={menuRef} className="relative inline-block text-left">
        {children}
      </div>
    </DropdownContext.Provider>
  );
};

export const DropdownMenuTrigger = React.forwardRef(({ asChild, children, onClick, ...props }, ref) => {
  const { open, setOpen } = useContext(DropdownContext);
  const Comp = asChild ? React.Children.only(children).type : 'button';
  
  const handleClick = (e) => {
    e.stopPropagation();
    onClick?.(e);
    setOpen(!open);
  };

  if (asChild) {
    return React.cloneElement(React.Children.only(children), {
      ...props,
      ref,
      onClick: handleClick,
    });
  }

  return (
    <Comp ref={ref} onClick={handleClick} {...props}>
      {children}
    </Comp>
  );
});
DropdownMenuTrigger.displayName = 'DropdownMenuTrigger';

export const DropdownMenuContent = React.forwardRef(({
  className = '',
  align = 'end',
  sideOffset = 4,
  ...props
}, ref) => {
  const { open } = useContext(DropdownContext);
  const contentRef = useRef(null);
  const [position, setPosition] = useState({ top: 0, left: 0 });
  const [mounted, setMounted] = useState(false);
  
  useEffect(() => {
    if (open && contentRef.current) {
      const trigger = contentRef.current.parentElement?.querySelector('button, span');
      if (trigger) {
        const rect = trigger.getBoundingClientRect();
        const menuHeight = contentRef.current.offsetHeight || 200; // estimated height
        const menuWidth = contentRef.current.offsetWidth || 128; // min-width 8rem
        const windowHeight = window.innerHeight;
        const windowWidth = window.innerWidth;
        
        let top = rect.bottom + sideOffset;
        let left = rect.left;
        
        // Check if dropdown would go off the bottom of the screen
        if (top + menuHeight > windowHeight) {
          // Position above the trigger instead
          top = rect.top - menuHeight - sideOffset;
        }
        
        // Handle alignment
        if (align === 'end') {
          left = rect.right - menuWidth;
        } else if (align === 'center') {
          left = rect.left + (rect.width / 2) - (menuWidth / 2);
        }
        
        // Ensure menu doesn't go off the right edge
        if (left + menuWidth > windowWidth) {
          left = windowWidth - menuWidth - 10;
        }
        
        // Ensure menu doesn't go off the left edge
        if (left < 10) {
          left = 10;
        }
        
        setPosition({ top, left });
        setMounted(true);
      }
    } else {
      setMounted(false);
    }
  }, [open, align, sideOffset]);
  
  if (!open) return null;

  return (
    <div
      ref={(el) => {
        contentRef.current = el;
        if (ref) {
          if (typeof ref === 'function') ref(el);
          else ref.current = el;
        }
      }}
      style={{
        position: 'fixed',
        top: `${position.top}px`,
        left: `${position.left}px`,
        opacity: mounted ? 1 : 0,
        transition: 'opacity 150ms',
      }}
      className={`z-[9999] min-w-[8rem] overflow-hidden rounded-md border bg-white dark:bg-gray-900 dark:border-gray-700 p-1 text-popover-foreground shadow-lg ${className}`}
      {...props}
    />
  );
});
DropdownMenuContent.displayName = 'DropdownMenuContent';

export const DropdownMenuItem = React.forwardRef(({ className = '', inset, onClick, ...props }, ref) => {
  const { setOpen } = useContext(DropdownContext);
  
  const handleClick = (e) => {
    onClick?.(e);
    setOpen(false);
  };

  return (
    <div
      ref={ref}
      onClick={handleClick}
      className={`relative flex cursor-pointer select-none items-center rounded-sm px-2 py-1.5 text-sm outline-none transition-colors focus:bg-gray-100 dark:focus:bg-gray-800 focus:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-accent-foreground ${
        inset ? 'pl-8' : ''
      } ${className}`}
      {...props}
    />
  );
});
DropdownMenuItem.displayName = 'DropdownMenuItem';

export const DropdownMenuSeparator = React.forwardRef(({ className = '', ...props }, ref) => (
  <div
    ref={ref}
    className={`-mx-1 my-1 h-px bg-muted ${className}`}
    {...props}
  />
));
DropdownMenuSeparator.displayName = 'DropdownMenuSeparator';

export const DropdownMenuLabel = React.forwardRef(({ className = '', inset, ...props }, ref) => (
  <div
    ref={ref}
    className={`px-2 py-1.5 text-sm font-semibold ${inset ? 'pl-8' : ''} ${className}`}
    {...props}
  />
));
DropdownMenuLabel.displayName = 'DropdownMenuLabel';

export const DropdownMenuGroup = React.forwardRef(({ ...props }, ref) => (
  <div ref={ref} {...props} />
));
DropdownMenuGroup.displayName = 'DropdownMenuGroup';