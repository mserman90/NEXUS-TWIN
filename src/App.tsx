import React, { useState, useMemo, useCallback } from 'react';
import {
  Droplets, Activity, TrendingUp, Cpu, Waves, Globe2, Users, Settings2,
  Download, FileSpreadsheet, MapPin, AlertTriangle, BarChart3, Zap,
  Database, CloudRain, ThermometerSun, Target, Crosshair, Satellite,
  AlertCircle, CheckCircle2, Clock, ArrowUpRight, Shield, Flame,
  TreePine, Radio, Eye, Play, RotateCcw, ChevronRight, ChevronDown,
  Building2, HeartPulse, GraduationCap, Layers, Info, Heart,
  TrendingDown, Maximize2, Map as MapIcon, DollarSign, Calendar, Briefcase
} from 'lucide-react';
import {
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
  AreaChart, Area, Legend, BarChart, Bar, Cell, PieChart, Pie,
  LineChart, Line, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, ComposedChart, ReferenceLine
} from 'recharts';
import { motion, AnimatePresence } from 'framer-motion';
import { cn } from './lib/utils';
import { 
  Scenario, TabId, InfrastructureNode, TabConfig, EventLogEntry 
} from './types';
import { CITIES } from './constants/cities';
import { 
  generateFloodForecast, runMonteCarlo, calculateSectoralLosses, generateOasisORD 
} from './utils/simulations';

// ============================================================================
// CONSTANTS
// ============================================================================

const DEFAULT_SCENARIO: Scenario = { 
  id: 'SC-2025-BASELINE', 
  name: 'Baz Senaryo', 
  precipitationDelta: 15, 
  infrastructureAgeing: 3, 
  populationExposure: 1.1, 
  sarVerified: true, 
  seaLevelRise: 25, 
  temperatureIncrease: 1.5, 
  ndviDegradation: 0.15, 
  urbanizationRate: 2.5 
};

const PRESET_SCENARIOS = [
  { name: 'RCP 4.5 — Orta Emisyon', scenario: { precipitationDelta: 25, temperatureIncrease: 2.0, seaLevelRise: 35, ndviDegradation: 0.20 } },
  { name: 'RCP 8.5 — Yüksek Emisyon', scenario: { precipitationDelta: 55, temperatureIncrease: 4.0, seaLevelRise: 75, ndviDegradation: 0.45 } },
];

const TABS: TabConfig[] = [
  { id: 'overview', icon: <Layers className="w-3.5 h-3.5" />, label: 'Overview', labelTR: 'Genel Bakış' },
  { id: 'twin_sim', icon: <Cpu className="w-3.5 h-3.5" />, label: 'Digital Twin', labelTR: 'Dijital İkiz' },
  { id: 'forecast', icon: <Waves className="w-3.5 h-3.5" />, label: 'Flood AI', labelTR: 'Taşkın YZ' },
  { id: 'montecarlo', icon: <Activity className="w-3.5 h-3.5" />, label: 'Monte Carlo', labelTR: 'Monte Carlo' },
  { id: 'sectoral', icon: <Droplets className="w-3.5 h-3.5" />, label: 'Sectoral', labelTR: 'Sektörel Etki' },
  { id: 'nexus', icon: <Cpu className="w-3.5 h-3.5" />, label: 'WEF Nexus', labelTR: 'Nexus Analizi' },
];

// ============================================================================
// COMPONENTS
// ============================================================================

const StatCard: React.FC<{ 
  label: string; value: string; sub?: string; color: string; icon: React.ReactNode; trend?: string; trendDir?: 'up' | 'down'; 
}> = ({ label, value, sub, color, icon, trend, trendDir }) => (
  <motion.div 
    initial={{ opacity: 0, y: 20 }} 
    animate={{ opacity: 1, y: 0 }} 
    className="rounded-xl p-4 border backdrop-blur-sm" 
    style={{ background: `linear-gradient(135deg, ${color}15, ${color}05)`, borderColor: `${color}40` }}
  >
    <div className="flex items-start justify-between mb-2">
      <span className="text-[10px] text-slate-400 uppercase tracking-wider font-medium">{label}</span>
      <div style={{ color }}>{icon}</div>
    </div>
    <div className="text-2xl font-bold font-mono tracking-tighter" style={{ color }}>{value}</div>
    {sub && <div className="text-[10px] text-slate-500 mt-1 font-mono">{sub}</div>}
    {trend && (
      <div className={cn("flex items-center gap-1 text-[10px] mt-2", trendDir === 'up' ? 'text-red-400' : 'text-emerald-400')}>
        {trendDir === 'up' ? <TrendingUp className="w-3 h-3" /> : <TrendingDown className="w-3 h-3" />}
        <span>{trend}</span>
      </div>
    )}
  </motion.div>
);

// ============================================================================
// MAIN APP
// ============================================================================

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>('overview');
  const [selectedCityId, setSelectedCityId] = useState('istanbul');
  const [scenario, setScenario] = useState<Scenario>({ ...DEFAULT_SCENARIO });
  const [isRunning, setIsRunning] = useState(false);
  const [selectedNode, setSelectedNode] = useState<InfrastructureNode | null>(null);
  const [citySelectorOpen, setCitySelectorOpen] = useState(false);

  const city = useMemo(() => CITIES.find(c => c.id === selectedCityId) || CITIES[0], [selectedCityId]);
  
  const simResults = useMemo(() => 
    runMonteCarlo(scenario, city.infrastructureNodes, city.cascadeLinks, 42, city.floodRiskMultiplier),
    [scenario, city]
  );

  const forecastData = useMemo(() => 
    generateFloodForecast(scenario, 42, city.floodRiskMultiplier, city.population / city.area * 10),
    [scenario, city]
  );

  const sectoralResults = useMemo(() => 
    calculateSectoralLosses(scenario, city.floodRiskMultiplier, city.population),
    [scenario, city]
  );

  const handleRunSim = useCallback(() => {
    setIsRunning(true);
    setTimeout(() => setIsRunning(false), 1500);
  }, []);

  const getCriticalityColor = (c: string) => {
    switch (c) { case 'Critical': return '#ef4444'; case 'High': return '#f97316'; case 'Medium': return '#eab308'; default: return '#22c55e'; }
  };

  return (
    <div className="min-h-screen bg-[#020617] text-slate-100 font-sans selection:bg-blue-500/30 overflow-x-hidden">
      {/* TOP NAV */}
      <nav className="border-b border-slate-800 bg-[#020617]/90 backdrop-blur-xl sticky top-0 z-50 px-4 py-3 flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="bg-gradient-to-br from-blue-600 to-cyan-500 p-2 rounded-xl">
            <Cpu className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-lg font-black tracking-tight bg-gradient-to-r from-blue-400 to-emerald-400 bg-clip-text text-transparent">NEXUS-TWIN</h1>
            <p className="text-[9px] text-slate-500 font-mono uppercase tracking-widest">Afet Risk İstihbarat Platformu</p>
          </div>
        </div>

        <div className="flex gap-1 bg-slate-900/80 p-1 rounded-xl border border-slate-800">
          {TABS.map(tab => (
            <button 
              key={tab.id} 
              onClick={() => setActiveTab(tab.id)}
              className={cn(
                "px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-2",
                activeTab === tab.id ? "bg-blue-600 text-white shadow-lg shadow-blue-900/20" : "text-slate-400 hover:text-slate-200"
              )}
            >
              {tab.icon}
              <span className="hidden md:inline">{tab.labelTR}</span>
            </button>
          ))}
        </div>

        <div className="flex items-center gap-4">
          <div className="flex items-center gap-2 px-3 py-1 bg-emerald-950/30 border border-emerald-500/30 rounded-full">
            <div className="w-1.5 h-1.5 bg-emerald-500 rounded-full animate-pulse" />
            <span className="text-[10px] font-bold text-emerald-400">SİSTEM AKTİF</span>
          </div>
        </div>
      </nav>

      <div className="flex">
        {/* SIDEBAR */}
        <aside className="w-80 border-r border-slate-800 p-4 space-y-6 h-[calc(100vh-64px)] overflow-y-auto">
          <section className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Senaryo Kontrolü</h3>
              <button onClick={() => setScenario(DEFAULT_SCENARIO)} className="text-[10px] text-blue-400 hover:underline">Sıfırla</button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="text-[10px] text-slate-400 block mb-2">Yağış Artışı: {scenario.precipitationDelta}%</label>
                <input 
                  type="range" min="-20" max="100" value={scenario.precipitationDelta}
                  onChange={e => setScenario({...scenario, precipitationDelta: Number(e.target.value)})}
                  className="w-full accent-blue-500"
                />
              </div>
              <div>
                <label className="text-[10px] text-slate-400 block mb-2">Altyapı Yaşlanması: Seviye {scenario.infrastructureAgeing}</label>
                <input 
                  type="range" min="1" max="10" value={scenario.infrastructureAgeing}
                  onChange={e => setScenario({...scenario, infrastructureAgeing: Number(e.target.value)})}
                  className="w-full accent-amber-500"
                />
              </div>
              <button 
                onClick={handleRunSim}
                disabled={isRunning}
                className="w-full py-3 bg-blue-600 hover:bg-blue-500 rounded-xl font-bold text-xs transition-all flex items-center justify-center gap-2"
              >
                {isRunning ? <RotateCcw className="w-4 h-4 animate-spin" /> : <Play className="w-4 h-4" />}
                {isRunning ? 'HESAPLANIYOR...' : 'SİMÜLASYONU ÇALIŞTIR'}
              </button>
            </div>
          </section>

          <section className="space-y-3">
            <h3 className="text-xs font-bold text-slate-500 uppercase tracking-widest">Kritik Düğümler</h3>
            {city.infrastructureNodes.map(node => (
              <button 
                key={node.id}
                onClick={() => setSelectedNode(node)}
                className={cn(
                  "w-full text-left p-3 rounded-xl border transition-all",
                  selectedNode?.id === node.id ? "bg-slate-800 border-slate-600" : "bg-slate-900/40 border-slate-800 hover:border-slate-700"
                )}
              >
                <div className="flex justify-between items-start mb-1">
                  <span className="text-xs font-bold">{node.name}</span>
                  <div className="w-2 h-2 rounded-full" style={{ backgroundColor: getCriticalityColor(node.criticality) }} />
                </div>
                <div className="text-[10px] text-slate-500">{node.type} • Risk: %{(node.vulnerability * 100).toFixed(0)}</div>
              </button>
            ))}
          </section>
        </aside>

        {/* MAIN CONTENT */}
        <main className="flex-1 p-6 space-y-6 overflow-y-auto h-[calc(100vh-64px)]">
          {activeTab === 'overview' && (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <StatCard label="Yıllık Ort. Kayıp" value={`$${simResults[0]?.aal}M`} color="#3b82f6" icon={<BarChart3 className="w-4 h-4" />} sub="Monte Carlo AAL" />
                <StatCard label="1:100 Yıl Risk" value={`$${simResults[0]?.p99}M`} color="#f97316" icon={<AlertTriangle className="w-4 h-4" />} sub="Oasis ORD P99" />
                <StatCard label="Etkilenen Nüfus" value={`${(forecastData[3]?.affectedPopulation / 1000).toFixed(1)}K`} color="#06b6d4" icon={<Users className="w-4 h-4" />} sub="7-Gün Tahmin" />
                <StatCard label="Sistem Güveni" value={`${simResults[0]?.confidence.toFixed(1)}%`} color="#10b981" icon={<CheckCircle2 className="w-4 h-4" />} sub="10K İterasyon" />
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-sm font-bold mb-6 flex items-center gap-2"><Activity className="w-4 h-4 text-blue-400" /> Risk Projeksiyonu (2025-2075)</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={simResults}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="year" stroke="#475569" fontSize={10} />
                        <YAxis stroke="#475569" fontSize={10} tickFormatter={v => `$${v}M`} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} />
                        <Area type="monotone" dataKey="aal" stroke="#3b82f6" fill="#3b82f6" fillOpacity={0.1} strokeWidth={2} />
                        <Area type="monotone" dataKey="p99" stroke="#f97316" fill="#f97316" fillOpacity={0.05} strokeDasharray="5 5" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                  <h3 className="text-sm font-bold mb-6 flex items-center gap-2"><Waves className="w-4 h-4 text-cyan-400" /> 7-Günlük Taşkın Tahmini</h3>
                  <div className="h-80">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={forecastData}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" vertical={false} />
                        <XAxis dataKey="date" stroke="#475569" fontSize={10} />
                        <YAxis stroke="#475569" fontSize={10} />
                        <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} />
                        <Bar dataKey="waterLevel" fill="#06b6d4" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'sectoral' && (
            <div className="space-y-6">
              <div className="bg-slate-900/40 border border-slate-800 rounded-2xl p-6">
                <h3 className="text-sm font-bold mb-6 flex items-center gap-2"><Droplets className="w-4 h-4 text-blue-400" /> Sektörel Ekonomik Kayıp Analizi</h3>
                <div className="h-96">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={sectoralResults} layout="vertical">
                      <CartesianGrid strokeDasharray="3 3" stroke="#1e293b" horizontal={false} />
                      <XAxis type="number" stroke="#475569" fontSize={10} tickFormatter={v => `$${v}M`} />
                      <YAxis dataKey="sectorName" type="category" stroke="#475569" fontSize={10} width={150} />
                      <Tooltip contentStyle={{ backgroundColor: '#0f172a', border: '1px solid #1e293b' }} />
                      <Bar dataKey="economicLoss" fill="#3b82f6" radius={[0, 4, 4, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          )}
          
          {/* Diğer sekmeler buraya eklenebilir */}
        </main>
      </div>
    </div>
  );
}
