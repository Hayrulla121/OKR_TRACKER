import React, { useState, useEffect } from 'react';
import { Department, Objective, MetricType, ScoreLevel } from '../types/okr';
import { departmentApi, objectiveApi, keyResultApi, scoreLevelApi } from '../services/api';
import ScoreLevelsManager from './ScoreLevelsManager';

interface SettingsModalProps {
  departments: Department[];
  onClose: () => void;
  onUpdate: () => void;
}

type Tab = 'departments' | 'objectives' | 'keyResults' | 'scoreLevels';

const SettingsModal: React.FC<SettingsModalProps> = ({ departments, onClose, onUpdate }) => {
  const [activeTab, setActiveTab] = useState<Tab>('departments');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Department form
  const [newDeptName, setNewDeptName] = useState('');

  // Objective form
  const [selectedDeptId, setSelectedDeptId] = useState('');
  const [newObjName, setNewObjName] = useState('');
  const [newObjWeight, setNewObjWeight] = useState('100');

  // Key Result form
  const [selectedObjId, setSelectedObjId] = useState('');
  const [newKrName, setNewKrName] = useState('');
  const [newKrDescription, setNewKrDescription] = useState('');
  const [newKrMetricType, setNewKrMetricType] = useState<MetricType>('HIGHER_BETTER');
  const [newKrUnit, setNewKrUnit] = useState('');
  const [newKrWeight, setNewKrWeight] = useState('100');
  const [scoreLevels, setScoreLevels] = useState<ScoreLevel[]>([]);
  const [dynamicThresholds, setDynamicThresholds] = useState<Record<string, string>>({});

  // Fetch score levels on component mount
  useEffect(() => {
    const fetchScoreLevels = async () => {
      try {
        const response = await scoreLevelApi.getAll();
        const levels = response.data.sort((a, b) => a.scoreValue - b.scoreValue);
        setScoreLevels(levels);
        // Initialize thresholds based on levels
        const initialThresholds: Record<string, string> = {};
        levels.forEach((level, index) => {
          const increment = 100 / (levels.length - 1 || 1);
          initialThresholds[level.name] = (index * increment).toFixed(0);
        });
        setDynamicThresholds(initialThresholds);
      } catch (err) {
        console.error('Failed to fetch score levels:', err);
        // Fallback to defaults - but this shouldn't happen if API is working
        setScoreLevels([
          { name: 'Below', scoreValue: 3.0, color: '#dc3545', displayOrder: 0 },
          { name: 'Meets', scoreValue: 4.25, color: '#ffc107', displayOrder: 1 },
          { name: 'Good', scoreValue: 4.5, color: '#5cb85c', displayOrder: 2 },
          { name: 'Very Good', scoreValue: 4.75, color: '#28a745', displayOrder: 3 },
          { name: 'Exceptional', scoreValue: 5.0, color: '#1e7b34', displayOrder: 4 },
        ]);
        setDynamicThresholds({ Below: '0', Meets: '25', Good: '50', 'Very Good': '75', Exceptional: '100' });
      }
    };
    fetchScoreLevels();
  }, []);

  const handleCreateDepartment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newDeptName.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await departmentApi.create({ name: newDeptName });
      setNewDeptName('');
      onUpdate();
    } catch (err) {
      setError('Failed to create department');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this department?')) return;

    setLoading(true);
    try {
      await departmentApi.delete(id);
      onUpdate();
    } catch (err) {
      setError('Failed to delete department');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateObjective = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDeptId || !newObjName.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await objectiveApi.create(selectedDeptId, {
        name: newObjName,
        weight: parseFloat(newObjWeight)
      });
      setNewObjName('');
      setNewObjWeight('100');
      onUpdate();
    } catch (err) {
      setError('Failed to create objective');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteObjective = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this objective?')) return;

    setLoading(true);
    try {
      await objectiveApi.delete(id);
      onUpdate();
    } catch (err) {
      setError('Failed to delete objective');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Map dynamic thresholds to the backend's 5-column structure
  const mapThresholdsToBackend = () => {
    const sortedLevels = [...scoreLevels].sort((a, b) => a.scoreValue - b.scoreValue);
    const thresholdValues = sortedLevels.map(level => parseFloat(dynamicThresholds[level.name] || '0'));

    // Backend expects exactly 5 thresholds: below, meets, good, veryGood, exceptional
    // Map dynamic thresholds to these columns based on count
    if (sortedLevels.length === 5) {
      return {
        below: thresholdValues[0],
        meets: thresholdValues[1],
        good: thresholdValues[2],
        veryGood: thresholdValues[3],
        exceptional: thresholdValues[4]
      };
    } else if (sortedLevels.length === 4) {
      return {
        below: thresholdValues[0],
        meets: thresholdValues[1],
        good: thresholdValues[2],
        veryGood: thresholdValues[2], // duplicate
        exceptional: thresholdValues[3]
      };
    } else if (sortedLevels.length === 3) {
      return {
        below: thresholdValues[0],
        meets: thresholdValues[0], // duplicate
        good: thresholdValues[1],
        veryGood: thresholdValues[1], // duplicate
        exceptional: thresholdValues[2]
      };
    } else if (sortedLevels.length === 2) {
      return {
        below: thresholdValues[0],
        meets: thresholdValues[0],
        good: thresholdValues[0],
        veryGood: thresholdValues[0],
        exceptional: thresholdValues[1]
      };
    } else {
      // Default fallback
      return {
        below: 0,
        meets: 25,
        good: 50,
        veryGood: 75,
        exceptional: 100
      };
    }
  };

  const handleCreateKeyResult = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedObjId || !newKrName.trim()) return;

    setLoading(true);
    setError(null);
    try {
      await keyResultApi.create(selectedObjId, {
        name: newKrName,
        description: newKrDescription,
        metricType: newKrMetricType,
        unit: newKrUnit || undefined,
        weight: parseFloat(newKrWeight),
        thresholds: mapThresholdsToBackend(),
        actualValue: newKrMetricType === 'QUALITATIVE' ? 'E' : '0'
      });
      setNewKrName('');
      setNewKrDescription('');
      setNewKrUnit('');
      setNewKrWeight('100');
      // Reset thresholds to initial values
      const initialThresholds: Record<string, string> = {};
      scoreLevels.forEach((level, index) => {
        const increment = 100 / (scoreLevels.length - 1 || 1);
        initialThresholds[level.name] = (index * increment).toFixed(0);
      });
      setDynamicThresholds(initialThresholds);
      onUpdate();
    } catch (err) {
      setError('Failed to create key result');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKeyResult = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this key result?')) return;

    setLoading(true);
    try {
      await keyResultApi.delete(id);
      onUpdate();
    } catch (err) {
      setError('Failed to delete key result');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const allObjectives: (Objective & { departmentName: string })[] = departments.flatMap(d =>
    d.objectives.map(obj => ({ ...obj, departmentName: d.name }))
  );

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-amber-600 to-amber-700 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">Settings</h2>
            <p className="text-amber-100 text-sm mt-1">Manage departments, objectives, and key results</p>
          </div>
          <button
            onClick={onClose}
            className="text-white hover:bg-white/20 rounded-lg p-2 transition-colors"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-slate-200 px-6">
          <div className="flex gap-2">
            <button
              onClick={() => setActiveTab('departments')}
              className={`px-4 py-3 font-semibold transition-all ${
                activeTab === 'departments'
                  ? 'text-amber-600 border-b-2 border-amber-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Departments
            </button>
            <button
              onClick={() => setActiveTab('objectives')}
              className={`px-4 py-3 font-semibold transition-all ${
                activeTab === 'objectives'
                  ? 'text-amber-600 border-b-2 border-amber-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Objectives
            </button>
            <button
              onClick={() => setActiveTab('keyResults')}
              className={`px-4 py-3 font-semibold transition-all ${
                activeTab === 'keyResults'
                  ? 'text-amber-600 border-b-2 border-amber-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Key Results
            </button>
            <button
              onClick={() => setActiveTab('scoreLevels')}
              className={`px-4 py-3 font-semibold transition-all ${
                activeTab === 'scoreLevels'
                  ? 'text-amber-600 border-b-2 border-amber-600'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              Score Levels
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          {error && (
            <div className="bg-red-50 border-l-4 border-red-500 text-red-700 p-4 rounded mb-4">
              {error}
            </div>
          )}

          {/* Departments Tab */}
          {activeTab === 'departments' && (
            <div className="space-y-6">
              <form onSubmit={handleCreateDepartment} className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Create New Department</h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    placeholder="Department name"
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 disabled:bg-slate-400 transition-colors"
                  >
                    Create
                  </button>
                </div>
              </form>

              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Existing Departments</h3>
                <div className="space-y-2">
                  {departments.map((dept) => (
                    <div
                      key={dept.id}
                      className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div>
                        <h4 className="font-semibold text-slate-800">{dept.name}</h4>
                        <p className="text-sm text-slate-500">
                          {dept.objectives.length} objective{dept.objectives.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteDepartment(dept.id)}
                        disabled={loading}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 disabled:bg-slate-400 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                  {departments.length === 0 && (
                    <p className="text-center text-slate-400 py-8">No departments yet</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Objectives Tab */}
          {activeTab === 'objectives' && (
            <div className="space-y-6">
              <form onSubmit={handleCreateObjective} className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Create New Objective</h3>
                <div className="space-y-3">
                  <select
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    required
                  >
                    <option value="">Select department</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newObjName}
                    onChange={(e) => setNewObjName(e.target.value)}
                    placeholder="Objective name"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    required
                  />
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={newObjWeight}
                      onChange={(e) => setNewObjWeight(e.target.value)}
                      placeholder="Weight (%)"
                      min="0"
                      max="100"
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      required
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 disabled:bg-slate-400 transition-colors"
                    >
                      Create
                    </button>
                  </div>
                </div>
              </form>

              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Existing Objectives</h3>
                <div className="space-y-2">
                  {allObjectives.map((obj) => (
                    <div
                      key={obj.id}
                      className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div>
                        <h4 className="font-semibold text-slate-800">{obj.name}</h4>
                        <p className="text-sm text-slate-500">
                          {obj.departmentName} • Weight: {obj.weight}% • {obj.keyResults.length} key result{obj.keyResults.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteObjective(obj.id)}
                        disabled={loading}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 disabled:bg-slate-400 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  ))}
                  {allObjectives.length === 0 && (
                    <p className="text-center text-slate-400 py-8">No objectives yet</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Key Results Tab */}
          {activeTab === 'keyResults' && (
            <div className="space-y-6">
              <form onSubmit={handleCreateKeyResult} className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4">Create New Key Result</h3>
                <div className="space-y-3">
                  <select
                    value={selectedObjId}
                    onChange={(e) => setSelectedObjId(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    required
                  >
                    <option value="">Select objective</option>
                    {allObjectives.map((obj) => (
                      <option key={obj.id} value={obj.id}>{obj.name} ({obj.departmentName})</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newKrName}
                    onChange={(e) => setNewKrName(e.target.value)}
                    placeholder="Key result name"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    required
                  />
                  <textarea
                    value={newKrDescription}
                    onChange={(e) => setNewKrDescription(e.target.value)}
                    placeholder="Description (optional)"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    rows={2}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={newKrMetricType}
                      onChange={(e) => setNewKrMetricType(e.target.value as MetricType)}
                      className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    >
                      <option value="HIGHER_BETTER">Higher is Better</option>
                      <option value="LOWER_BETTER">Lower is Better</option>
                      <option value="QUALITATIVE">Qualitative (A-E)</option>
                    </select>
                    {newKrMetricType !== 'QUALITATIVE' && (
                      <input
                        type="text"
                        value={newKrUnit}
                        onChange={(e) => setNewKrUnit(e.target.value)}
                        placeholder="Unit (e.g., %, $, users)"
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                      />
                    )}
                  </div>
                  <input
                    type="number"
                    value={newKrWeight}
                    onChange={(e) => setNewKrWeight(e.target.value)}
                    placeholder="Weight (%)"
                    min="0"
                    max="100"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-amber-500 focus:border-amber-500"
                    required
                  />

                  {newKrMetricType !== 'QUALITATIVE' && (
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <h4 className="font-semibold text-slate-700 mb-3">
                        Threshold Values ({scoreLevels.length} levels)
                      </h4>
                      <div className={`grid gap-2`} style={{ gridTemplateColumns: `repeat(${scoreLevels.length}, minmax(0, 1fr))` }}>
                        {[...scoreLevels]
                          .sort((a, b) => a.scoreValue - b.scoreValue)
                          .map((level) => (
                            <div key={level.name} className="flex flex-col">
                              <label
                                className="text-xs font-semibold mb-1 truncate"
                                style={{ color: level.color }}
                                title={`${level.name} (${level.scoreValue})`}
                              >
                                {level.name}
                              </label>
                              <input
                                type="number"
                                value={dynamicThresholds[level.name] || ''}
                                onChange={(e) => setDynamicThresholds({
                                  ...dynamicThresholds,
                                  [level.name]: e.target.value
                                })}
                                placeholder={level.name}
                                className="px-3 py-2 border-2 rounded-lg text-sm focus:ring-2"
                                style={{
                                  borderColor: level.color,
                                  outlineColor: level.color
                                }}
                              />
                            </div>
                          ))}
                      </div>
                      <p className="text-xs text-slate-500 mt-2">
                        Enter the actual metric values that correspond to each score level
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-2 bg-amber-600 text-white rounded-lg font-semibold hover:bg-amber-700 disabled:bg-slate-400 transition-colors"
                  >
                    Create Key Result
                  </button>
                </div>
              </form>

              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">Existing Key Results</h3>
                <div className="space-y-2">
                  {allObjectives.flatMap(obj =>
                    obj.keyResults.map(kr => (
                      <div
                        key={kr.id}
                        className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-shadow"
                      >
                        <div>
                          <h4 className="font-semibold text-slate-800">{kr.name}</h4>
                          <p className="text-sm text-slate-500">
                            {obj.name} ({obj.departmentName}) • {kr.metricType} • Weight: {kr.weight}%
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteKeyResult(kr.id)}
                          disabled={loading}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 disabled:bg-slate-400 transition-colors"
                        >
                          Delete
                        </button>
                      </div>
                    ))
                  )}
                  {allObjectives.flatMap(obj => obj.keyResults).length === 0 && (
                    <p className="text-center text-slate-400 py-8">No key results yet</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Score Levels Tab */}
          {activeTab === 'scoreLevels' && (
            <ScoreLevelsManager onUpdate={onUpdate} />
          )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
