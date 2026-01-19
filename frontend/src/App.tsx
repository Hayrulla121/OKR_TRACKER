import React, { useEffect, useState } from 'react';
import { Department, ScoreResult, ScoreLevel } from './types/okr';
import { departmentApi, demoApi, scoreLevelApi } from './services/api';
import Speedometer from './components/Speedometer';
import DepartmentCard from './components/DepartmentCard';
import SettingsModal from './components/SettingsModal';
import DepartmentModal from './components/DepartmentModal';
import OrgScoreChart from './components/OrgScoreChart';

function App() {
  const [departments, setDepartments] = useState<Department[]>([]);
  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [modalDepartment, setModalDepartment] = useState<Department | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showSettings, setShowSettings] = useState(false);
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const [scoreLevels, setScoreLevels] = useState<ScoreLevel[]>([]);

  const fetchDepartments = async () => {
    try {
      const response = await departmentApi.getAll();
      setDepartments(response.data);
      // Update selectedDepartment with fresh data if one is selected
      // Use functional update to avoid stale closure issues
      setSelectedDepartment(currentSelected => {
        if (currentSelected) {
          const updatedDept = response.data.find(d => d.id === currentSelected.id);
          return updatedDept || currentSelected;
        }
        return currentSelected;
      });
      setError(null);
    } catch (err) {
      setError('Failed to load departments');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_API_URL || 'http://localhost:8080/api'}/export/excel`, {
        method: 'GET',
      });

      if (!response.ok) {
        throw new Error('Export failed');
      }

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'okr_export.xlsx';
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (err) {
      console.error('Failed to export Excel', err);
      setError('Failed to export Excel');
    }
  };

  const handleLoadDemoData = async () => {
    if (!window.confirm('This will replace all existing data with demo data. Continue?')) {
      return;
    }

    try {
      const response = await demoApi.loadDemoData();
      setDepartments(response.data);
      alert('Demo data loaded successfully!');
    } catch (err) {
      console.error('Failed to load demo data:', err);
      setError('Failed to load demo data');
    }
  };

  const fetchScoreLevels = async () => {
    try {
      const response = await scoreLevelApi.getAll();
      const sorted = response.data.sort((a, b) => a.scoreValue - b.scoreValue);
      setScoreLevels(sorted);
    } catch (err) {
      console.error('Failed to fetch score levels:', err);
    }
  };

  // Combined refresh function to update all data
  const refreshAllData = () => {
    fetchDepartments();
    fetchScoreLevels();
  };

  useEffect(() => {
    refreshAllData();
  }, []);

  // Calculate overall score using dynamic score levels
  const overallScore = React.useMemo((): ScoreResult => {
    const scores = departments
        .filter(d => d.score && d.score.score > 0)
        .map(d => d.score!.score);

    // Default values
    const defaultColor = '#d9534f';
    const defaultLevel = 'below';

    if (scores.length === 0) {
      return { score: 3, level: defaultLevel, color: defaultColor, percentage: 0 };
    }

    const avg = scores.reduce((a, b) => a + b, 0) / scores.length;

    // Find the appropriate level based on dynamic score levels
    let level = defaultLevel;
    let color = defaultColor;

    if (scoreLevels.length > 0) {
      const minScore = scoreLevels[0].scoreValue;
      const maxScore = scoreLevels[scoreLevels.length - 1].scoreValue;

      // Find which level the score falls into
      for (let i = scoreLevels.length - 1; i >= 0; i--) {
        if (avg >= scoreLevels[i].scoreValue) {
          level = scoreLevels[i].name.toLowerCase().replace(/\s+/g, '_');
          color = scoreLevels[i].color;
          break;
        }
      }

      const percentage = ((avg - minScore) / (maxScore - minScore)) * 100;
      return { score: avg, level: level as ScoreResult['level'], color, percentage: Math.max(0, Math.min(100, percentage)) };
    }

    // Fallback to hardcoded values if no score levels loaded
    const fallbackLevel: ScoreResult['level'] = avg >= 5 ? 'exceptional' :
        avg >= 4.75 ? 'very_good' :
            avg >= 4.5 ? 'good' :
                avg >= 4.25 ? 'meets' : 'below';
    const fallbackColors: Record<ScoreResult['level'], string> = {
      below: '#d9534f', meets: '#f0ad4e', good: '#5cb85c',
      very_good: '#28a745', exceptional: '#1e7b34'
    };

    return { score: avg, level: fallbackLevel, color: fallbackColors[fallbackLevel], percentage: ((avg - 3) / 2) * 100 };
  }, [departments, scoreLevels]);

  const defaultScore: ScoreResult = { score: 3, level: 'below', color: scoreLevels[0]?.color || '#d9534f', percentage: 0 };

  if (loading) {
    return (
        <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50">
          <div className="text-center">
            <div className="animate-spin rounded-full h-16 w-16 border-b-4 border-amber-600 mx-auto"></div>
            <p className="mt-4 text-slate-700 font-medium">Loading OKR Tracker...</p>
          </div>
        </div>
    );
  }

  return (
      <div className="h-screen bg-gradient-to-br from-amber-50 via-orange-50 to-yellow-50 flex overflow-hidden">
        {/* Left Sidebar - Control Panel - Compact Light Theme */}
        <aside className="w-52 bg-white border-r border-slate-200 shadow-lg flex flex-col h-screen">
          {/* Sidebar Header */}
          <div className="bg-gradient-to-br from-amber-500 to-orange-500 text-white p-3 shadow-lg flex-shrink-0">
            <h2 className="text-sm font-bold">Control Panel</h2>
            <p className="text-amber-100 text-xs opacity-80">Departments</p>
          </div>

          {/* Departments List - Scrollable */}
          <div className="flex-1 overflow-y-auto p-2 space-y-1 min-h-0">
            {departments.map((dept) => (
                <button
                    key={dept.id}
                    onClick={() => setSelectedDepartment(dept)}
                    className={`w-full text-left p-2 rounded-lg transition-all duration-200 ${
                        selectedDepartment?.id === dept.id
                            ? 'bg-gradient-to-r from-amber-500 to-orange-500 text-white shadow-md'
                            : 'bg-orange-50 hover:bg-orange-100 text-slate-700 border border-orange-200'
                    }`}
                >
                  <div className="flex items-center justify-between">
                    <h3 className="font-semibold text-xs truncate flex-1">{dept.name}</h3>
                    {dept.score && (
                        <span
                            className="text-xs font-bold ml-1"
                            style={{ color: selectedDepartment?.id === dept.id ? 'white' : dept.score.color }}
                        >
                          {dept.score.score.toFixed(1)}
                        </span>
                    )}
                  </div>
                </button>
            ))}

            {departments.length === 0 && (
                <div className="text-center py-6 text-slate-400">
                  <p className="text-2xl mb-1">📋</p>
                  <p className="text-xs">No departments</p>
                </div>
            )}
          </div>

          {/* Action Buttons - Fixed at bottom */}
          <div className="p-2 border-t border-slate-200 space-y-1.5 flex-shrink-0 bg-slate-50">
            <button
                onClick={() => setShowSettings(true)}
                className="w-full px-2 py-1.5 bg-slate-600 hover:bg-slate-700 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
            >
              <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Settings
            </button>
            <div className="flex gap-1.5">
              <button
                  onClick={handleExportExcel}
                  className="flex-1 px-2 py-1.5 bg-green-600 hover:bg-green-500 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3M3 17V7a2 2 0 012-2h6l2 2h6a2 2 0 012 2v8a2 2 0 01-2 2H5a2 2 0 01-2-2z" />
                </svg>
                Export
              </button>
              <button
                  onClick={handleLoadDemoData}
                  className="flex-1 px-2 py-1.5 bg-amber-500 hover:bg-amber-400 text-white rounded text-xs font-medium transition-colors flex items-center justify-center gap-1"
              >
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
                </svg>
                Demo
              </button>
            </div>
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto">
          {/* Header with Title - More Compact */}
          <header className="bg-white border-b border-slate-200 shadow-sm sticky top-0 z-10">
            <div className="px-4 py-2 flex items-center justify-between">
              <div>
                <h1 className="text-lg font-bold bg-gradient-to-r from-amber-600 to-orange-600 bg-clip-text text-transparent">
                  OKR Performance Tracker
                </h1>
                <p className="text-slate-500 text-xs">
                  {selectedDepartment
                      ? `${selectedDepartment.name} Details`
                      : 'Organization Overview'
                  }
                </p>
              </div>
              <div className="text-right text-xs text-slate-400">
                {new Date().toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </header>

          {error && (
              <div className="mx-6 mt-4 bg-red-50 border-l-4 border-red-500 text-red-700 p-3 rounded text-sm">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-1.5" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                  </svg>
                  {error}
                </div>
              </div>
          )}

          <div className="p-4 space-y-4">
            {/* Show Main View or Department Detail */}
            {!selectedDepartment ? (
                <>
                  {/* Hero Section - Overall Score with Glow + Charts */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                    {/* Main Gauge with Glow Effect - Light Theme */}
                    <div
                        className="lg:col-span-1 rounded-xl shadow-lg p-4 border-2 relative overflow-hidden"
                        style={{
                          background: `linear-gradient(135deg, #ffffff 0%, ${overallScore.color}08 100%)`,
                          borderColor: `${overallScore.color}40`,
                        }}
                    >
                      {/* Glow effect behind gauge */}
                      <div
                          className="absolute inset-0 opacity-30"
                          style={{
                            background: `radial-gradient(circle at 50% 70%, ${overallScore.color}60 0%, transparent 50%)`,
                          }}
                      />
                      <h2 className="text-sm font-bold text-slate-700 mb-2 text-center relative z-10">
                        Organization Score
                      </h2>
                      <div className="flex justify-center relative z-10">
                        <Speedometer score={overallScore} size="md" glow={true} compact={true} />
                      </div>
                    </div>

                    {/* Organization Score Chart */}
                    <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-4 border border-slate-200">
                      <div className="flex items-center justify-between mb-2">
                        <h2 className="text-sm font-bold text-slate-800">Organization Score Breakdown</h2>
                        <div className="flex items-center gap-2 text-xs text-slate-500">
                          <span className="w-3 h-0.5 rounded" style={{ backgroundColor: overallScore.color }}></span>
                          <span>Org Average</span>
                        </div>
                      </div>
                      <OrgScoreChart departments={departments} overallScore={overallScore} height={180} />
                    </div>
                  </div>

                  {/* Stats Cards Row */}
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                    <div className="bg-white rounded-lg shadow p-3 border border-slate-200">
                      <div className="text-xs text-slate-500">Departments</div>
                      <div className="text-2xl font-bold text-slate-800">{departments.length}</div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-3 border border-slate-200">
                      <div className="text-xs text-slate-500">Objectives</div>
                      <div className="text-2xl font-bold text-slate-800">
                        {departments.reduce((sum, d) => sum + d.objectives.length, 0)}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-3 border border-slate-200">
                      <div className="text-xs text-slate-500">Key Results</div>
                      <div className="text-2xl font-bold text-slate-800">
                        {departments.reduce((sum, d) => sum + d.objectives.reduce((s, o) => s + o.keyResults.length, 0), 0)}
                      </div>
                    </div>
                    <div className="bg-white rounded-lg shadow p-3 border border-slate-200">
                      <div className="text-xs text-slate-500">Avg Score</div>
                      <div className="text-2xl font-bold" style={{ color: overallScore.color }}>
                        {overallScore.score.toFixed(2)}
                      </div>
                    </div>
                  </div>

                  {/* Department Cards Grid with Gauges */}
                  {departments.length > 0 && (
                      <div className="bg-white rounded-xl shadow-lg p-4 border border-slate-200">
                        <h2 className="text-sm font-bold text-slate-800 mb-3">All Departments</h2>
                        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                          {departments.map((dept) => (
                              <div
                                  key={dept.id}
                                  onClick={() => setModalDepartment(dept)}
                                  className="bg-gradient-to-br from-orange-50 to-amber-50 p-3 rounded-lg border border-orange-200 hover:border-amber-400 hover:shadow-md transition-all duration-200 cursor-pointer group"
                              >
                                <div className="text-center mb-1">
                                  <h3 className="font-bold text-slate-800 text-xs truncate group-hover:text-amber-600 transition-colors">
                                    {dept.name}
                                  </h3>
                                  <p className="text-xs text-slate-500">{dept.objectives.length} objectives</p>
                                </div>
                                <Speedometer
                                    score={dept.score || defaultScore}
                                    size="sm"
                                    compact={true}
                                    showLabel={true}
                                />
                              </div>
                          ))}
                        </div>
                      </div>
                  )}

                  {departments.length === 0 && (
                      <div className="bg-white rounded-xl shadow-lg p-8 border border-slate-200 text-center">
                        <div className="text-4xl mb-2">📊</div>
                        <h3 className="text-base font-semibold text-slate-600 mb-1">No Departments Yet</h3>
                        <p className="text-slate-400 text-xs">Create your first department from settings!</p>
                      </div>
                  )}
                </>
            ) : (
                <>
                  {/* Department Detail View */}
                  {/* Back Button */}
                  <div className="mb-4">
                    <button
                        onClick={() => setSelectedDepartment(null)}
                        className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-slate-600 to-slate-700 text-white rounded-lg text-sm font-semibold hover:from-slate-700 hover:to-slate-800 transition-all duration-200 shadow-md hover:shadow-lg"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                      </svg>
                      Back to Dashboard
                    </button>
                  </div>

                  {/* View Mode Toggle */}
                  <div className="mb-4 flex justify-end">
                    <div className="inline-flex rounded-lg border border-slate-300 bg-white shadow-sm">
                      <button
                          onClick={() => setViewMode('list')}
                          className={`px-4 py-2 text-sm font-semibold rounded-l-lg transition-all ${
                              viewMode === 'list'
                                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white'
                                  : 'bg-white text-slate-700 hover:bg-orange-50'
                          }`}
                      >
                        <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
                        </svg>
                        List View
                      </button>
                      <button
                          onClick={() => setViewMode('grid')}
                          className={`px-4 py-2 text-sm font-semibold rounded-r-lg transition-all ${
                              viewMode === 'grid'
                                  ? 'bg-gradient-to-r from-amber-600 to-orange-600 text-white'
                                  : 'bg-white text-slate-700 hover:bg-orange-50'
                          }`}
                      >
                        <svg className="w-4 h-4 inline mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1V5zM14 5a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1V5zM4 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1H5a1 1 0 01-1-1v-4zM14 15a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z" />
                        </svg>
                        Grid View
                      </button>
                    </div>
                  </div>

                  {/* Speedometer and Summary */}
                  <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-6">
                    <div className="lg:col-span-1 bg-white rounded-xl shadow-lg p-5 border border-slate-200">
                      <h2 className="text-base font-bold text-slate-800 mb-4 text-center">Department Score</h2>
                      <Speedometer score={selectedDepartment.score || defaultScore} size="md" />
                    </div>

                    <div className="lg:col-span-2 bg-white rounded-xl shadow-lg p-5 border border-slate-200">
                      <h2 className="text-base font-bold text-slate-800 mb-4">Score Summary</h2>
                      <div className="grid grid-cols-3 gap-3">
                        <div className="text-center p-3 bg-gradient-to-br from-amber-50 to-amber-100 rounded-lg border border-amber-200">
                          <div className="text-2xl font-bold text-amber-700">{selectedDepartment.objectives.length}</div>
                          <div className="text-xs text-slate-600 mt-0.5">Objectives</div>
                        </div>
                        <div className="text-center p-3 bg-gradient-to-br from-orange-50 to-orange-100 rounded-lg border border-orange-200">
                          <div className="text-2xl font-bold text-orange-700">
                            {selectedDepartment.objectives.reduce((sum, obj) => sum + obj.keyResults.length, 0)}
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5">Key Results</div>
                        </div>
                        <div className="text-center p-3 bg-gradient-to-br from-yellow-50 to-yellow-100 rounded-lg border border-yellow-200">
                          <div className="text-2xl font-bold" style={{ color: selectedDepartment.score?.color || '#666' }}>
                            {selectedDepartment.score?.score.toFixed(2) || '0.00'}
                          </div>
                          <div className="text-xs text-slate-600 mt-0.5">Avg Score</div>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Objectives and Key Results Breakdown */}
                  {selectedDepartment.objectives.length === 0 ? (
                      <div className="bg-white rounded-xl shadow-lg p-12 border border-slate-200 text-center">
                        <div className="text-5xl mb-3">🎯</div>
                        <h3 className="text-lg font-semibold text-slate-600 mb-1.5">No Objectives Yet</h3>
                        <p className="text-slate-400 text-sm">Add objectives to this department from settings!</p>
                      </div>
                  ) : viewMode === 'list' ? (
                      <div className="space-y-4">
                        {selectedDepartment.objectives.map((objective) => (
                            <DepartmentCard
                                key={objective.id}
                                department={selectedDepartment}
                                objective={objective}
                                onUpdate={refreshAllData}
                            />
                        ))}
                      </div>
                  ) : (
                      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                        {selectedDepartment.objectives.map((objective) => (
                            <div key={objective.id} className="bg-white rounded-xl shadow-lg border-2 border-slate-200 overflow-hidden">
                              {/* Objective Header */}
                              <div className="bg-gradient-to-r from-amber-400 to-amber-500 p-4">
                                <div className="flex items-center justify-between">
                                  <div className="flex-1">
                                    <h3 className="text-base font-bold text-white">{objective.name}</h3>
                                    <p className="text-amber-100 text-xs mt-0.5">
                                      {objective.keyResults.length} Key Result{objective.keyResults.length !== 1 ? 's' : ''}
                                    </p>
                                  </div>
                                  <span className="bg-white/30 backdrop-blur-sm text-white text-xs px-2 py-0.5 rounded-full font-semibold">
                                    Weight: {objective.weight}%
                                  </span>
                                </div>
                              </div>

                              {/* Speedometer */}
                              <div className="p-6 flex justify-center">
                                <Speedometer
                                    score={objective.score || { score: 3, level: 'below', color: '#d9534f', percentage: 0 }}
                                    size="md"
                                />
                              </div>
                            </div>
                        ))}
                      </div>
                  )}
                </>
            )}
          </div>
        </main>

        {/* Settings Modal */}
        {showSettings && (
            <SettingsModal
                departments={departments}
                onClose={() => setShowSettings(false)}
                onUpdate={refreshAllData}
            />
        )}

        {/* Department Modal */}
        {modalDepartment && (
            <DepartmentModal
                department={modalDepartment}
                onClose={() => setModalDepartment(null)}
                onUpdate={async () => {
                  await fetchDepartments();
                  // Update the modal with fresh data
                  const response = await departmentApi.getAll();
                  const updatedDept = response.data.find(d => d.id === modalDepartment.id);
                  if (updatedDept) {
                    setModalDepartment(updatedDept);
                  }
                }}
            />
        )}
      </div>
  );
}

export default App;