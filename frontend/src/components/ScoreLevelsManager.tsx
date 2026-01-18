import React, { useState, useEffect } from 'react';
import { ScoreLevel } from '../types/okr';
import { scoreLevelApi } from '../services/api';

interface ScoreLevelsManagerProps {
  onUpdate?: () => void;
}

const ScoreLevelsManager: React.FC<ScoreLevelsManagerProps> = ({ onUpdate }) => {
  const [levels, setLevels] = useState<ScoreLevel[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);

  useEffect(() => {
    fetchLevels();
  }, []);

  const fetchLevels = async () => {
    try {
      const response = await scoreLevelApi.getAll();
      setLevels(response.data);
      setError(null);
    } catch (err) {
      setError('Failed to load score levels');
      console.error(err);
    }
  };

  const handleLevelChange = (index: number, field: keyof ScoreLevel, value: any) => {
    const updatedLevels = [...levels];
    updatedLevels[index] = { ...updatedLevels[index], [field]: value };
    setLevels(updatedLevels);
    setHasChanges(true);
  };

  const handleAddLevel = () => {
    const newLevel: ScoreLevel = {
      name: 'New Level',
      scoreValue: 4.0,
      color: '#6c757d',
      displayOrder: levels.length,
    };
    setLevels([...levels, newLevel]);
    setHasChanges(true);
  };

  const handleRemoveLevel = (index: number) => {
    if (levels.length <= 2) {
      alert('You must have at least 2 score levels');
      return;
    }
    const updatedLevels = levels.filter((_, i) => i !== index);
    // Reorder remaining levels
    updatedLevels.forEach((level, i) => {
      level.displayOrder = i;
    });
    setLevels(updatedLevels);
    setHasChanges(true);
  };

  const handleSave = async () => {
    setLoading(true);
    setError(null);
    try {
      // Sort by score value before saving
      const sortedLevels = [...levels].sort((a, b) => a.scoreValue - b.scoreValue);
      // Update display orders
      sortedLevels.forEach((level, i) => {
        level.displayOrder = i;
      });

      await scoreLevelApi.updateAll(sortedLevels);
      setLevels(sortedLevels);
      setHasChanges(false);
      if (onUpdate) onUpdate();
      alert('Score levels updated successfully!');
    } catch (err) {
      setError('Failed to update score levels');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleReset = async () => {
    if (!window.confirm('Reset to default score levels? This will discard all customizations.')) {
      return;
    }

    setLoading(true);
    try {
      await scoreLevelApi.resetToDefaults();
      await fetchLevels();
      setHasChanges(false);
      if (onUpdate) onUpdate();
      alert('Score levels reset to defaults');
    } catch (err) {
      setError('Failed to reset score levels');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const sortedLevels = [...levels].sort((a, b) => a.scoreValue - b.scoreValue);

  return (
    <div className="p-6">
      <div className="mb-6">
        <h3 className="text-lg font-bold text-slate-800 mb-2">Score Level Configuration</h3>
        <p className="text-sm text-slate-600">
          Configure the global score levels used for all key results. Levels are automatically sorted by score value.
        </p>
      </div>

      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg mb-4">
          {error}
        </div>
      )}

      <div className="space-y-3 mb-6">
        {sortedLevels.map((level, index) => {
          const originalIndex = levels.findIndex(l => l === level);
          return (
            <div key={index} className="bg-white p-4 rounded-lg border-2 border-slate-200 shadow-sm">
              <div className="grid grid-cols-12 gap-3 items-center">
                <div className="col-span-3">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Level Name</label>
                  <input
                    type="text"
                    value={level.name}
                    onChange={(e) => handleLevelChange(originalIndex, 'name', e.target.value)}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Score Value</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    max="10"
                    value={level.scoreValue}
                    onChange={(e) => handleLevelChange(originalIndex, 'scoreValue', parseFloat(e.target.value))}
                    className="w-full px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                  />
                </div>

                <div className="col-span-2">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Color</label>
                  <div className="flex items-center gap-2">
                    <input
                      type="color"
                      value={level.color}
                      onChange={(e) => handleLevelChange(originalIndex, 'color', e.target.value)}
                      className="w-12 h-10 border border-slate-300 rounded cursor-pointer"
                    />
                    <input
                      type="text"
                      value={level.color}
                      onChange={(e) => handleLevelChange(originalIndex, 'color', e.target.value)}
                      className="flex-1 px-3 py-2 border border-slate-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500"
                      placeholder="#000000"
                    />
                  </div>
                </div>

                <div className="col-span-4">
                  <label className="block text-xs font-semibold text-slate-600 mb-1">Preview</label>
                  <div
                    className="w-full px-4 py-2 rounded-lg text-white font-bold text-center text-sm"
                    style={{ backgroundColor: level.color }}
                  >
                    {level.name} - {level.scoreValue.toFixed(2)}
                  </div>
                </div>

                <div className="col-span-1 flex justify-end">
                  <button
                    onClick={() => handleRemoveLevel(originalIndex)}
                    className="text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-lg transition-colors"
                    title="Remove level"
                    disabled={levels.length <= 2}
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      <div className="flex items-center gap-3">
        <button
          onClick={handleAddLevel}
          className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold text-sm transition-colors flex items-center gap-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          Add Level
        </button>

        <button
          onClick={handleSave}
          disabled={!hasChanges || loading}
          className="px-6 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-semibold text-sm transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {loading ? 'Saving...' : 'Save Changes'}
        </button>

        <button
          onClick={handleReset}
          disabled={loading}
          className="px-4 py-2 bg-slate-500 text-white rounded-lg hover:bg-slate-600 font-semibold text-sm transition-colors disabled:opacity-50"
        >
          Reset to Defaults
        </button>

        {hasChanges && (
          <span className="text-sm text-amber-600 font-semibold">
            * You have unsaved changes
          </span>
        )}
      </div>
    </div>
  );
};

export default ScoreLevelsManager;
