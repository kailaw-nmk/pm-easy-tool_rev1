import { useState, useRef, useEffect, useCallback } from 'react';

interface DropdownItem {
  label: string;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  icon?: React.ReactNode;
}

interface Props {
  trigger: React.ReactNode;
  items: DropdownItem[];
  className?: string;
  activeClassName?: string;
}

export function ToolbarDropdown({ trigger, items, className, activeClassName }: Props) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) {
        close();
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [open, close]);

  return (
    <div ref={ref} className={`toolbar-dropdown ${className ?? ''}`}>
      <button
        className={activeClassName && open ? activeClassName : undefined}
        onClick={() => setOpen(!open)}
      >
        {trigger}
      </button>
      {open && (
        <div className="toolbar-dropdown-menu">
          {items.map((item, i) => (
            <button
              key={i}
              className={item.active ? 'dropdown-item-active' : undefined}
              disabled={item.disabled}
              onClick={() => {
                item.onClick();
                close();
              }}
            >
              {item.icon && <span className="dropdown-item-icon">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
