import { type NutritionCategory, type MapStyle, CATEGORY_COLORS } from './SpotMap';

interface ToolbarProps {
  pitch: number;
  bearing: number;
  onPitchChange: (v: number) => void;
  onBearingChange: (v: number) => void;
  onReset: () => void;
  plotMode: boolean;
  onTogglePlot: () => void;
  activeCategory: NutritionCategory;
  onCategoryChange: (c: NutritionCategory) => void;
  onClearSpots: () => void;
  mapStyle: MapStyle;
  onMapStyleChange: (s: MapStyle) => void;
  onDownloadPdf: () => void;
  onPrint: () => void;
  pdfLoading: boolean;
  collapsed: boolean;
  onToggleCollapse: () => void;
}

const MAP_STYLE_LABELS: Record<MapStyle, string> = {
  osm: 'Street',
  satellite: 'Satellite',
  minimal: 'Minimal',
};

const CATEGORIES: NutritionCategory[] = ['normal', 'underweight', 'severe', 'overweight'];
const MAP_STYLES: MapStyle[] = ['osm', 'satellite', 'minimal'];

export default function Toolbar({
  pitch, bearing, onPitchChange, onBearingChange, onReset,
  plotMode, onTogglePlot, activeCategory, onCategoryChange, onClearSpots,
  mapStyle, onMapStyleChange,
  onDownloadPdf, onPrint, pdfLoading,
  collapsed, onToggleCollapse,
}: ToolbarProps) {
  return (
    <div className={`toolbar-wrapper${collapsed ? ' toolbar-collapsed' : ''}`}>
      {/* Collapse tab */}
      <button className="toolbar-collapse-tab" onClick={onToggleCollapse} title={collapsed ? 'Show toolbar' : 'Hide toolbar'}>
        <svg xmlns="http://www.w3.org/2000/svg" width="12" height="12" viewBox="0 0 24 24"
          fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round"
          style={{ transform: collapsed ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }}>
          <polyline points="18 15 12 9 6 15" />
        </svg>
      </button>

      {!collapsed && (
        <div className="toolbar">

          {/* ── Map style switcher ── */}
          <div className="toolbar-group">
            <span className="toolbar-label">Basemap</span>
            <div className="style-switcher">
              {MAP_STYLES.map((s) => (
                <button
                  key={s}
                  className={`style-btn${mapStyle === s ? ' active' : ''}`}
                  onClick={() => onMapStyleChange(s)}
                >
                  {MAP_STYLE_LABELS[s]}
                </button>
              ))}
            </div>
          </div>

          <div className="toolbar-divider" />

          {/* ── Plot mode toggle ── */}
          <div className="toolbar-group">
            <span className="toolbar-label">Plot Mode</span>
            <button
              className={`plot-toggle${plotMode ? ' active' : ''}`}
              onClick={onTogglePlot}
              title={plotMode ? 'Exit plot mode' : 'Click map to add spots · Click spot to cycle category · Drag to move · Right-click to remove'}
            >
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                <circle cx="12" cy="10" r="3" />
              </svg>
              {plotMode ? 'Plotting…' : 'Plot Spots'}
            </button>
          </div>

          {/* Category picker — only visible in plot mode */}
          {plotMode && (
            <>
              <div className="toolbar-divider" />
              <div className="toolbar-group">
                <span className="toolbar-label">Category</span>
                <div className="category-picker">
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      className={`cat-btn${activeCategory === cat ? ' active' : ''}`}
                      style={{ '--cat-color': CATEGORY_COLORS[cat] } as React.CSSProperties}
                      onClick={() => onCategoryChange(cat)}
                      title={cat}
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill={CATEGORY_COLORS[cat]} stroke="white" strokeWidth="1.5" strokeLinejoin="round" width="16" height="16">
                        <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
                        <path d="M9 21V12h6v9" stroke="white" strokeWidth="1.5"/>
                      </svg>
                    </button>
                  ))}
                </div>
              </div>
              <div className="toolbar-divider" />
              <div className="toolbar-group">
                <button className="clear-btn" onClick={onClearSpots} title="Remove all plotted spots">
                  <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                    fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <polyline points="3 6 5 6 21 6" />
                    <path d="M19 6l-1 14H6L5 6" />
                    <path d="M10 11v6M14 11v6" />
                    <path d="M9 6V4h6v2" />
                  </svg>
                  Clear All
                </button>
              </div>
            </>
          )}

          <div className="toolbar-divider" />

          {/* ── View controls ── */}
          <div className="toolbar-group toolbar-group--wide">
            <span className="toolbar-label">Tilt <span className="toolbar-val">{pitch}°</span></span>
            <input type="range" min={0} max={85} step={1} value={pitch}
              onChange={(e) => onPitchChange(Number(e.target.value))} />
          </div>

          <div className="toolbar-group toolbar-group--wide">
            <span className="toolbar-label">Rotate <span className="toolbar-val">{bearing}°</span></span>
            <input type="range" min={-180} max={180} step={1} value={bearing}
              onChange={(e) => onBearingChange(Number(e.target.value))} />
          </div>

          <button className="reset-btn" onClick={onReset}>Reset View</button>

          <div className="toolbar-divider" />

          {/* ── Export ── */}
          <div className="toolbar-group toolbar-group--row">
            <button className="toolbar-action-btn btn-pdf" onClick={onDownloadPdf} disabled={pdfLoading}>
              {pdfLoading ? <div className="btn-spinner" /> : (
                <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                  fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                  <polyline points="7 10 12 15 17 10" />
                  <line x1="12" y1="15" x2="12" y2="3" />
                </svg>
              )}
              {pdfLoading ? 'Generating…' : 'PDF'}
            </button>

            <button className="toolbar-action-btn btn-print" onClick={onPrint}>
              <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="6 9 6 2 18 2 18 9" />
                <path d="M6 18H4a2 2 0 0 1-2-2v-5a2 2 0 0 1 2-2h16a2 2 0 0 1 2 2v5a2 2 0 0 1-2 2h-2" />
                <rect x="6" y="14" width="12" height="8" />
              </svg>
              Print
            </button>
          </div>

        </div>
      )}
    </div>
  );
}
