const items = [
  { color: '#4ade80', label: 'CHILDREN WITH NORMAL WEIGHT' },
  { color: '#fde047', label: 'CHILDREN WITH UNDER WEIGHT / STUNTED / WASTED — mark "UW" / "ST" / "W"' },
  { color: '#ef4444', label: 'CHILDREN WITH SEVERELY UNDER WEIGHT / STUNTED / WASTED — mark "SUW" / "SST" / "SW"' },
  { color: '#f97316', label: 'CHILDREN WITH OVERWEIGHT AND OBESE — mark "OW" / "OB"' },
];

interface LegendProps {
  collapsed?: boolean;
  onToggle?: () => void;
}

export default function Legend({ collapsed = false, onToggle }: LegendProps) {
  return (
    <div className={`legend-panel${collapsed ? ' legend-collapsed' : ''}`}>
      <div className="legend-header" onClick={onToggle} role="button" aria-expanded={!collapsed} tabIndex={0}
        onKeyDown={(e) => e.key === 'Enter' && onToggle?.()}>
        <h3>Legend</h3>
        <svg
          className={`legend-chevron${collapsed ? ' rotated' : ''}`}
          xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </div>
      {!collapsed && (
        <div className="legend-body">
          {items.map((item) => (
            <div key={item.color} className="legend-item">
              <svg className="legend-icon" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={item.color} stroke="white" strokeWidth="1.5" strokeLinejoin="round">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
                <path d="M9 21V12h6v9" stroke="white" strokeWidth="1.5"/>
              </svg>
              <span>{item.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
