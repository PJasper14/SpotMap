import { useState } from 'react';
import { CATEGORY_COLORS, type Spot, type NutritionCategory } from './SpotMap';

const LABELS: Record<NutritionCategory, string> = {
  normal: 'Normal',
  underweight: 'Underweight',
  severe: 'Severe',
  overweight: 'Overweight',
};

interface StatsPanelProps {
  spots: Spot[];
}

export default function StatsPanel({ spots }: StatsPanelProps) {
  const [collapsed, setCollapsed] = useState(false);
  const total = spots.length;

  const counts = (Object.keys(CATEGORY_COLORS) as NutritionCategory[]).map((cat) => ({
    cat,
    count: spots.filter((s) => s.category === cat).length,
  }));

  return (
    <div className={`stats-panel${collapsed ? ' stats-collapsed' : ''}`}>
      <div
        className="stats-header"
        onClick={() => setCollapsed((v) => !v)}
        role="button"
        tabIndex={0}
        aria-expanded={!collapsed}
        onKeyDown={(e) => e.key === 'Enter' && setCollapsed((v) => !v)}
      >
        <p className="stats-title">Summary</p>
        <svg
          className={`stats-chevron${collapsed ? ' rotated' : ''}`}
          xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
        >
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </div>
      {!collapsed && (
        <>
          <div className="stats-grid">
            {counts.map(({ cat, count }) => (
              <div key={cat} className="stats-item">
                <div className="stats-dot" style={{ backgroundColor: CATEGORY_COLORS[cat] }} />
                <div className="stats-info">
                  <span className="stats-count">{count}</span>
                  <span className="stats-label">{LABELS[cat]}</span>
                </div>
              </div>
            ))}
          </div>
          <div className="stats-total">
            <span>Total</span>
            <span className="stats-total-num">{total}</span>
          </div>
        </>
      )}
    </div>
  );
}
