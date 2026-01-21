import React, { useState, useEffect } from 'react';
import { Department, Objective, MetricType } from '../types/okr';
import { departmentApi, objectiveApi, keyResultApi } from '../services/api';
import ScoreLevelsManager from './ScoreLevelsManager';
import { useLanguage } from '../i18n';
import { useScoreLevels } from '../contexts/ScoreLevelContext';

interface SettingsModalProps {
  departments: Department[];
  onClose: () => void;
  onUpdate: () => void;
}

type Tab = 'departments' | 'objectives' | 'keyResults' | 'scoreLevels';

const SettingsModal: React.FC<SettingsModalProps> = ({ departments, onClose, onUpdate }) => {
  const { t } = useLanguage();
  const { scoreLevels } = useScoreLevels();
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
  const [dynamicThresholds, setDynamicThresholds] = useState<Record<string, string>>({});

  // Initialize thresholds when score levels change
  useEffect(() => {
    if (scoreLevels.length > 0) {
      const initialThresholds: Record<string, string> = {};
      scoreLevels.forEach((level, index) => {
        const increment = 100 / (scoreLevels.length - 1 || 1);
        initialThresholds[level.name] = (index * increment).toFixed(0);
      });
      setDynamicThresholds(initialThresholds);
    }
  }, [scoreLevels]);

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
      setError(t.failedToCreateDepartment);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteDepartment = async (id: string) => {
    if (!window.confirm(t.confirmDeleteDepartment)) return;

    setLoading(true);
    try {
      await departmentApi.delete(id);
      onUpdate();
    } catch (err) {
      setError(t.failedToDeleteDepartment);
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
      setError(t.failedToCreateObjective);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteObjective = async (id: string) => {
    if (!window.confirm(t.confirmDeleteObjective)) return;

    setLoading(true);
    try {
      await objectiveApi.delete(id);
      onUpdate();
    } catch (err) {
      setError(t.failedToDeleteObjective);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  // Map dynamic thresholds to the backend's 5-column structure
  const mapThresholdsToBackend = () => {
    // Sort levels by scoreValue ascending (worst to best)
    const sortedLevels = [...scoreLevels].sort((a, b) => a.scoreValue - b.scoreValue);
    const numLevels = sortedLevels.length;

    // Extract threshold values in sorted order (by score level position)
    const thresholdValues = sortedLevels.map(level =>
      parseFloat(dynamicThresholds[level.name] || '0')
    );

    // Backend maps these 5 fields to score level indices:
    // below → index 0
    // meets → index min(1, numLevels-1)
    // good → index min(2, numLevels-1)
    // veryGood → index min(3, numLevels-1)
    // exceptional → index numLevels-1
    //
    // We need to send the threshold values that correspond to those indices

    let below, meets, good, veryGood, exceptional;

    if (numLevels >= 5) {
      // 5 or more levels: map directly by index
      below = thresholdValues[0];
      meets = thresholdValues[1];
      good = thresholdValues[2];
      veryGood = thresholdValues[3];
      exceptional = thresholdValues[4];
    } else if (numLevels === 4) {
      // 4 levels: indices [0, 1, 2, 3]
      // Backend expects: below=0, meets=1, good=2, veryGood=3, exceptional=3
      below = thresholdValues[0];
      meets = thresholdValues[1];
      good = thresholdValues[2];
      veryGood = thresholdValues[3];  // Backend maps this to index 3
      exceptional = thresholdValues[3]; // Backend also maps this to index 3
    } else if (numLevels === 3) {
      // 3 levels: indices [0, 1, 2]
      // Backend expects: below=0, meets=1, good=2, veryGood=2, exceptional=2
      below = thresholdValues[0];
      meets = thresholdValues[1];
      good = thresholdValues[2];     // Backend maps this to index 2
      veryGood = thresholdValues[2];  // Backend maps this to index 2
      exceptional = thresholdValues[2]; // Backend maps this to index 2
    } else if (numLevels === 2) {
      // 2 levels: indices [0, 1]
      // Backend expects: below=0, meets=1, good=1, veryGood=1, exceptional=1
      below = thresholdValues[0];
      meets = thresholdValues[1];     // Backend maps this to index 1
      good = thresholdValues[1];      // Backend maps this to index 1
      veryGood = thresholdValues[1];  // Backend maps this to index 1
      exceptional = thresholdValues[1]; // Backend maps this to index 1
    } else {
      // Edge case: single level or no levels
      const val = thresholdValues[0] || 0;
      below = val;
      meets = val;
      good = val;
      veryGood = val;
      exceptional = val;
    }

    return {
      below,
      meets,
      good,
      veryGood,
      exceptional
    };
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
      setError(t.failedToCreateKeyResult);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteKeyResult = async (id: string) => {
    if (!window.confirm(t.confirmDeleteKeyResult)) return;

    setLoading(true);
    try {
      await keyResultApi.delete(id);
      onUpdate();
    } catch (err) {
      setError(t.failedToDeleteKeyResult);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const allObjectives: (Objective & { departmentName: string })[] = departments.flatMap(d =>
    d.objectives.map(obj => ({ ...obj, departmentName: d.name }))
  );

  const getMetricTypeLabel = (type: MetricType) => {
    switch (type) {
      case 'HIGHER_BETTER': return t.higherIsBetter;
      case 'LOWER_BETTER': return t.lowerIsBetter;
      case 'QUALITATIVE': return t.qualitative + ' (A-E)';
      default: return type;
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-[#5A9CB5] to-cyan-600 text-white p-6 rounded-t-2xl flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold">{t.settings}</h2>
            <p className="text-cyan-100 text-sm mt-1">{t.manageDepartmentsObjectivesKRs}</p>
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
                  ? 'text-[#5A9CB5] border-b-2 border-[#5A9CB5]'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.departmentsLabel}
            </button>
            <button
              onClick={() => setActiveTab('objectives')}
              className={`px-4 py-3 font-semibold transition-all ${
                activeTab === 'objectives'
                  ? 'text-[#5A9CB5] border-b-2 border-[#5A9CB5]'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.objectivesLabel}
            </button>
            <button
              onClick={() => setActiveTab('keyResults')}
              className={`px-4 py-3 font-semibold transition-all ${
                activeTab === 'keyResults'
                  ? 'text-[#5A9CB5] border-b-2 border-[#5A9CB5]'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.keyResultsLabel}
            </button>
            <button
              onClick={() => setActiveTab('scoreLevels')}
              className={`px-4 py-3 font-semibold transition-all ${
                activeTab === 'scoreLevels'
                  ? 'text-[#5A9CB5] border-b-2 border-[#5A9CB5]'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              {t.scoreLevel}
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
                <h3 className="text-lg font-bold text-slate-800 mb-4">{t.createNewDepartment}</h3>
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={newDeptName}
                    onChange={(e) => setNewDeptName(e.target.value)}
                    placeholder={t.departmentName}
                    className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5A9CB5] focus:border-[#5A9CB5]"
                    required
                  />
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-[#5A9CB5] text-white rounded-lg font-semibold hover:bg-cyan-600 disabled:bg-slate-400 transition-colors"
                  >
                    {t.create}
                  </button>
                </div>
              </form>

              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">{t.existingDepartments}</h3>
                <div className="space-y-2">
                  {departments.map((dept) => (
                    <div
                      key={dept.id}
                      className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div>
                        <h4 className="font-semibold text-slate-800">{dept.name}</h4>
                        <p className="text-sm text-slate-500">
                          {dept.objectives.length} {t.objective}{dept.objectives.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteDepartment(dept.id)}
                        disabled={loading}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 disabled:bg-slate-400 transition-colors"
                      >
                        {t.delete}
                      </button>
                    </div>
                  ))}
                  {departments.length === 0 && (
                    <p className="text-center text-slate-400 py-8">{t.noDepartments}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Objectives Tab */}
          {activeTab === 'objectives' && (
            <div className="space-y-6">
              <form onSubmit={handleCreateObjective} className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4">{t.createNewObjective}</h3>
                <div className="space-y-3">
                  <select
                    value={selectedDeptId}
                    onChange={(e) => setSelectedDeptId(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5A9CB5] focus:border-[#5A9CB5]"
                    required
                  >
                    <option value="">{t.selectDepartment}</option>
                    {departments.map((dept) => (
                      <option key={dept.id} value={dept.id}>{dept.name}</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newObjName}
                    onChange={(e) => setNewObjName(e.target.value)}
                    placeholder={t.objectiveName}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5A9CB5] focus:border-[#5A9CB5]"
                    required
                  />
                  <div className="flex gap-3">
                    <input
                      type="number"
                      value={newObjWeight}
                      onChange={(e) => setNewObjWeight(e.target.value)}
                      placeholder={t.weightPercent}
                      min="0"
                      max="100"
                      className="flex-1 px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5A9CB5] focus:border-[#5A9CB5]"
                      required
                    />
                    <button
                      type="submit"
                      disabled={loading}
                      className="px-6 py-2 bg-[#5A9CB5] text-white rounded-lg font-semibold hover:bg-cyan-600 disabled:bg-slate-400 transition-colors"
                    >
                      {t.create}
                    </button>
                  </div>
                </div>
              </form>

              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">{t.existingObjectives}</h3>
                <div className="space-y-2">
                  {allObjectives.map((obj) => (
                    <div
                      key={obj.id}
                      className="flex items-center justify-between p-4 bg-white border border-slate-200 rounded-lg hover:shadow-md transition-shadow"
                    >
                      <div>
                        <h4 className="font-semibold text-slate-800">{obj.name}</h4>
                        <p className="text-sm text-slate-500">
                          {obj.departmentName} • {t.weight}: {obj.weight}% • {obj.keyResults.length} {t.keyResult}{obj.keyResults.length !== 1 ? 's' : ''}
                        </p>
                      </div>
                      <button
                        onClick={() => handleDeleteObjective(obj.id)}
                        disabled={loading}
                        className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 disabled:bg-slate-400 transition-colors"
                      >
                        {t.delete}
                      </button>
                    </div>
                  ))}
                  {allObjectives.length === 0 && (
                    <p className="text-center text-slate-400 py-8">{t.noObjectivesYetText}</p>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Key Results Tab */}
          {activeTab === 'keyResults' && (
            <div className="space-y-6">
              <form onSubmit={handleCreateKeyResult} className="bg-slate-50 p-6 rounded-xl border border-slate-200">
                <h3 className="text-lg font-bold text-slate-800 mb-4">{t.createNewKeyResult}</h3>
                <div className="space-y-3">
                  <select
                    value={selectedObjId}
                    onChange={(e) => setSelectedObjId(e.target.value)}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5A9CB5] focus:border-[#5A9CB5]"
                    required
                  >
                    <option value="">{t.selectObjective}</option>
                    {allObjectives.map((obj) => (
                      <option key={obj.id} value={obj.id}>{obj.name} ({obj.departmentName})</option>
                    ))}
                  </select>
                  <input
                    type="text"
                    value={newKrName}
                    onChange={(e) => setNewKrName(e.target.value)}
                    placeholder={t.keyResultName}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5A9CB5] focus:border-[#5A9CB5]"
                    required
                  />
                  <textarea
                    value={newKrDescription}
                    onChange={(e) => setNewKrDescription(e.target.value)}
                    placeholder={t.descriptionOptional}
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5A9CB5] focus:border-[#5A9CB5]"
                    rows={2}
                  />
                  <div className="grid grid-cols-2 gap-3">
                    <select
                      value={newKrMetricType}
                      onChange={(e) => setNewKrMetricType(e.target.value as MetricType)}
                      className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5A9CB5] focus:border-[#5A9CB5]"
                    >
                      <option value="HIGHER_BETTER">{t.higherIsBetter}</option>
                      <option value="LOWER_BETTER">{t.lowerIsBetter}</option>
                      <option value="QUALITATIVE">{t.qualitative} (A-E)</option>
                    </select>
                    {newKrMetricType !== 'QUALITATIVE' && (
                      <input
                        type="text"
                        value={newKrUnit}
                        onChange={(e) => setNewKrUnit(e.target.value)}
                        placeholder={t.unitExample}
                        className="px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5A9CB5] focus:border-[#5A9CB5]"
                      />
                    )}
                  </div>
                  <input
                    type="number"
                    value={newKrWeight}
                    onChange={(e) => setNewKrWeight(e.target.value)}
                    placeholder={t.weightPercent}
                    min="0"
                    max="100"
                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:ring-2 focus:ring-[#5A9CB5] focus:border-[#5A9CB5]"
                    required
                  />

                  {newKrMetricType !== 'QUALITATIVE' && (
                    <div className="bg-white p-4 rounded-lg border border-slate-200">
                      <h4 className="font-semibold text-slate-700 mb-3">
                        {t.thresholdValues} ({scoreLevels.length} {t.levels})
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
                        {t.enterActualMetricValues}
                      </p>
                    </div>
                  )}

                  <button
                    type="submit"
                    disabled={loading}
                    className="w-full px-6 py-2 bg-[#5A9CB5] text-white rounded-lg font-semibold hover:bg-cyan-600 disabled:bg-slate-400 transition-colors"
                  >
                    {t.createKeyResult}
                  </button>
                </div>
              </form>

              <div>
                <h3 className="text-lg font-bold text-slate-800 mb-4">{t.existingKeyResults}</h3>
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
                            {obj.name} ({obj.departmentName}) • {getMetricTypeLabel(kr.metricType)} • {t.weight}: {kr.weight}%
                          </p>
                        </div>
                        <button
                          onClick={() => handleDeleteKeyResult(kr.id)}
                          disabled={loading}
                          className="px-4 py-2 bg-red-500 text-white rounded-lg font-semibold hover:bg-red-600 disabled:bg-slate-400 transition-colors"
                        >
                          {t.delete}
                        </button>
                      </div>
                    ))
                  )}
                  {allObjectives.flatMap(obj => obj.keyResults).length === 0 && (
                    <p className="text-center text-slate-400 py-8">{t.noKeyResultsYet}</p>
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
