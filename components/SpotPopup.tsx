'use client';

import { useState, useEffect, useRef } from 'react';
import { type Spot, type NutritionCategory, CATEGORY_COLORS } from './SpotMap';

const CATEGORIES: NutritionCategory[] = ['normal', 'underweight', 'severe', 'overweight'];
const CAT_LABELS: Record<NutritionCategory, string> = {
  normal: 'Normal Weight',
  underweight: 'Underweight / Stunted / Wasted',
  severe: 'Severely Underweight / Stunted / Wasted',
  overweight: 'Overweight / Obese',
};

interface SpotPopupProps {
  spot: Spot;
  pos: { x: number; y: number };
  onSave: (updated: Spot) => void;
  onDelete: (id: string) => void;
  onClose: () => void;
}

export default function SpotPopup({ spot, pos, onSave, onDelete, onClose }: SpotPopupProps) {
  const [editing, setEditing] = useState(!spot.name); // auto-edit if new
  const [name, setName] = useState(spot.name ?? '');
  const [age, setAge] = useState(spot.age ?? '');
  const [notes, setNotes] = useState(spot.notes ?? '');
  const [category, setCategory] = useState<NutritionCategory>(spot.category);
  const [errors, setErrors] = useState<{ name?: string; age?: string }>({});
  const popupRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) onClose();
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [onClose]);

  const POPUP_W = 420;
  const POPUP_MARGIN = 12;
  const viewportW = typeof window !== 'undefined' ? window.innerWidth : 800;
  const viewportH = typeof window !== 'undefined' ? window.innerHeight : 600;
  const POPUP_H_EST = 280;
  const spaceAbove = pos.y - POPUP_MARGIN;
  const flipBelow = spaceAbove < POPUP_H_EST;
  let left = pos.x - POPUP_W / 2;
  left = Math.max(POPUP_MARGIN, Math.min(left, viewportW - POPUP_W - POPUP_MARGIN));

  const style: React.CSSProperties = {
    position: 'fixed',
    left,
    width: POPUP_W,
    maxHeight: `calc(${viewportH}px - ${POPUP_MARGIN * 2}px)`,
    overflowY: 'auto',
    zIndex: 3000,
    ...(flipBelow ? { top: pos.y + 20 } : { bottom: viewportH - pos.y + 8 }),
  };

  const handleSave = () => {
    const errs: { name?: string; age?: string } = {};
    if (!name.trim()) errs.name = 'Required';
    if (!age.trim()) errs.age = 'Required';
    if (Object.keys(errs).length) { setErrors(errs); return; }
    setErrors({});
    onSave({ ...spot, name: name.trim(), age: age.trim(), notes, category });
    setEditing(false);
  };

  return (
    <div className="spot-popup" style={style} ref={popupRef}>
      <div className="spot-popup-arrow" style={flipBelow ? { display: 'none' } : {}} />

      {/* Header */}
      <div className="spot-popup-header">
        <div className="spot-popup-header-left">
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
            fill={CATEGORY_COLORS[category]} stroke="white" strokeWidth="1.5" strokeLinejoin="round"
            width="16" height="16">
            <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
            <path d="M9 21V12h6v9" stroke="white" strokeWidth="1.5"/>
          </svg>
          <span>{editing ? 'Edit Details' : (name || 'House Details')}</span>
        </div>
        <div className="spot-popup-actions">
          {!editing && (
            <button className="popup-icon-btn popup-icon-edit" onClick={() => setEditing(true)} title="Edit">
              {/* Pencil */}
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/>
                <path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/>
              </svg>
            </button>
          )}
          {editing && (
            <button className="popup-icon-btn popup-icon-save" onClick={handleSave} title="Save">
              {/* Check */}
              <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
                fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <polyline points="20 6 9 17 4 12"/>
              </svg>
            </button>
          )}
          <button className="popup-icon-btn popup-icon-delete" onClick={() => onDelete(spot.id)} title="Delete">
            {/* Trash */}
            <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <polyline points="3 6 5 6 21 6"/>
              <path d="M19 6l-1 14H6L5 6"/>
              <path d="M10 11v6M14 11v6"/>
              <path d="M9 6V4h6v2"/>
            </svg>
          </button>
          <button className="spot-popup-close" onClick={onClose} title="Close">
            <svg xmlns="http://www.w3.org/2000/svg" width="13" height="13" viewBox="0 0 24 24"
              fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/>
            </svg>
          </button>
        </div>
      </div>

      {/* View mode */}
      {!editing && (
        <div className="spot-popup-view">
          <div className="view-row">
            <span className="view-label">Name</span>
            <span className="view-value">{name || <em className="view-empty">—</em>}</span>
          </div>
          <div className="view-row">
            <span className="view-label">Age</span>
            <span className="view-value">{age || <em className="view-empty">—</em>}</span>
          </div>
          <div className="view-row">
            <span className="view-label">Category</span>
            <span className="view-value view-cat">
              <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                fill={CATEGORY_COLORS[category]} stroke="white" strokeWidth="1.5" strokeLinejoin="round"
                width="13" height="13">
                <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
                <path d="M9 21V12h6v9" stroke="white" strokeWidth="1.5"/>
              </svg>
              {CAT_LABELS[category]}
            </span>
          </div>
          {notes && (
            <div className="view-row view-row--col">
              <span className="view-label">Notes</span>
              <span className="view-value">{notes}</span>
            </div>
          )}
        </div>
      )}

      {/* Edit mode */}
      {editing && (
        <div className="spot-popup-body">
          <div className="popup-row">
            <label className="popup-label">
              Child's Name
              <input className={`popup-input${errors.name ? ' popup-input--error' : ''}`}
                type="text" placeholder="e.g. Juan Dela Cruz"
                value={name} onChange={(e) => { setName(e.target.value); setErrors((p) => ({ ...p, name: undefined })); }}
                autoFocus />
              {errors.name && <span className="popup-error">{errors.name}</span>}
            </label>
            <label className="popup-label popup-label--sm">
              Age
              <input className={`popup-input${errors.age ? ' popup-input--error' : ''}`}
                type="number" min="0" max="150" placeholder="e.g. 3"
                value={age} onChange={(e) => { setAge(e.target.value.replace(/\D/g, '')); setErrors((p) => ({ ...p, age: undefined })); }} />
              {errors.age && <span className="popup-error">{errors.age}</span>}
            </label>
          </div>

          <label className="popup-label">
            Category
            <div className="popup-cat-grid">
              {CATEGORIES.map((cat) => (
                <button key={cat} className={`popup-cat-btn${category === cat ? ' active' : ''}`}
                  style={{ '--cat': CATEGORY_COLORS[cat] } as React.CSSProperties}
                  onClick={() => setCategory(cat)} type="button">
                  <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24"
                    fill={CATEGORY_COLORS[cat]} stroke="white" strokeWidth="1.5" strokeLinejoin="round"
                    width="14" height="14">
                    <path d="M3 9.5L12 3l9 6.5V20a1 1 0 0 1-1 1H4a1 1 0 0 1-1-1V9.5z"/>
                    <path d="M9 21V12h6v9" stroke="white" strokeWidth="1.5"/>
                  </svg>
                  <span>{CAT_LABELS[cat]}</span>
                </button>
              ))}
            </div>
          </label>

          <label className="popup-label">
            Notes
            <textarea className="popup-input popup-textarea" placeholder="Additional observations…"
              value={notes} onChange={(e) => setNotes(e.target.value)} rows={2} />
          </label>
        </div>
      )}
    </div>
  );
}
