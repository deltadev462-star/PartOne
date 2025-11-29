import React, { useState, useRef, useEffect } from 'react';

export const Select = React.forwardRef(({ children, value, onValueChange, ...props }, ref) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedValue, setSelectedValue] = useState(value || '');
  const selectRef = useRef(null);

  useEffect(() => {
    setSelectedValue(value || '');
  }, [value]);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  const handleSelect = (newValue) => {
    setSelectedValue(newValue);
    setIsOpen(false);
    if (onValueChange) {
      onValueChange(newValue);
    }
  };

  const contextValue = {
    isOpen,
    setIsOpen,
    selectedValue,
    handleSelect
  };

  return (
    <SelectContext.Provider value={contextValue}>
      <div ref={selectRef} {...props}>
        {children}
      </div>
    </SelectContext.Provider>
  );
});
Select.displayName = 'Select';

const SelectContext = React.createContext();

const useSelectContext = () => {
  const context = React.useContext(SelectContext);
  if (!context) {
    throw new Error('Select components must be used within a Select');
  }
  return context;
};

export const SelectTrigger = React.forwardRef(({ className = '', children, ...props }, ref) => {
  const { isOpen, setIsOpen } = useSelectContext();
  
  return (
    <button
      ref={ref}
      type="button"
      onClick={() => setIsOpen(!isOpen)}
      className={`flex h-10 w-full items-center justify-between rounded-md border border-gray-200 bg-white dark:bg-[#101010] dark:border-gray-700 px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground   disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
      <svg
        xmlns="http://www.w3.org/2000/svg"
        width="24"
        height="24"
        viewBox="0 0 24 24"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        className={`h-4 w-4 opacity-50 transition-transform ${isOpen ? 'rotate-180' : ''}`}
      >
        <polyline points="6 9 12 15 18 9"></polyline>
      </svg>
    </button>
  );
});
SelectTrigger.displayName = 'SelectTrigger';

export const SelectValue = React.forwardRef(({ className = '', placeholder, children, ...props }, ref) => {
  const { selectedValue } = useSelectContext();
  
  return (
    <span ref={ref} className={className} {...props}>
      {children || selectedValue || placeholder || 'Select...'}
    </span>
  );
});
SelectValue.displayName = 'SelectValue';

export const SelectContent = React.forwardRef(({ className = '', children, ...props }, ref) => {
  const { isOpen } = useSelectContext();
  
  if (!isOpen) return null;
  
  return (
    <div
      ref={ref}
      className={`absolute z-50 mt-1     overflow-hidden rounded-md border border-gray-200 bg-white dark:bg-[#101010] dark:border-gray-700 text-popover-foreground shadow-md animate-in fade-in-80 ${className}`}
      {...props}
    >
      <div className="p-1 max-h-60 overflow-y-auto">
        {children}
      </div>
    </div>
  );
});
SelectContent.displayName = 'SelectContent';

export const SelectItem = React.forwardRef(({ className = '', children, value, ...props }, ref) => {
  const { handleSelect, selectedValue } = useSelectContext();
  const isSelected = selectedValue === value;
  
  return (
    <div
      ref={ref}
      onClick={() => handleSelect(value)}
      className={`relative flex w-full cursor-pointer select-none items-center rounded-sm py-1.5 pl-8 pr-2 text-sm outline-none ${
        isSelected ? 'bg-gray-100 dark:bg-gray-800' : ''
      } hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-accent-foreground data-[disabled]:pointer-events-none data-[disabled]:opacity-50 ${className}`}
      {...props}
    >
      {isSelected && (
        <span className="absolute left-2 flex h-3.5 w-3.5 items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="24"
            height="24"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className="h-4 w-4"
          >
            <polyline points="20 6 9 17 4 12"></polyline>
          </svg>
        </span>
      )}
      {children}
    </div>
  );
});
SelectItem.displayName = 'SelectItem';