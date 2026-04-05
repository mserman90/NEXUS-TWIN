import { CityProfile, InfrastructureNode, CascadeLink, FloodZone, NDVIDataPoint } from '../types';

const MONTHS_TR = ['Oca', 'Şub', 'Mar', 'Nis', 'May', 'Haz', 'Tem', 'Ağu', 'Eyl', 'Eki', 'Kas', 'Ara'];

function generateNDVI(baseMultiplier: number, fireImpact: number): NDVIDataPoint[] {
  const baseCurve = [0.62, 0.58, 0.65, 0.72, 0.78, 0.82, 0.80, 0.75, 0.70, 0.68, 0.64, 0.60];
  return MONTHS_TR.map((month, i) => ({
    month,
    baseline: Math.round(baseCurve[i] * baseMultiplier * 100) / 100,
    current: Math.round(baseCurve[i] * baseMultiplier * 0.93 * 100) / 100,
    postFire: Math.round(baseCurve[i] * baseMultiplier * fireImpact * 100) / 100,
  }));
}

// ─── İSTANBUL ─────────────────────────────────────────────────
const ISTANBUL_NODES: InfrastructureNode[] = [
  { id: 'IST-DAM-01', name: 'Alibey Barajı', type: 'Dam', vulnerability: 0.15, exposure: 1250000, criticality: 'High', coordinates: [41.12, 28.95], capacity: 125, buildYear: 1983, catchmentArea: 245, elevation: 145, cascadeTargets: ['IST-WTP-04', 'IST-PIPE-31'], demographicBreakdown: { elderly: 125000, children: 250000, disabled: 37500, lowIncome: 312500 } },
  { id: 'IST-DAM-02', name: 'Ömerli Barajı', type: 'Dam', vulnerability: 0.10, exposure: 3200000, criticality: 'Critical', coordinates: [41.07, 29.35], capacity: 386, buildYear: 1973, catchmentArea: 620, elevation: 65, cascadeTargets: ['IST-WTP-04', 'IST-WTP-05'], demographicBreakdown: { elderly: 320000, children: 640000, disabled: 96000, lowIncome: 800000 } },
  { id: 'IST-WTP-04', name: 'Kağıthane Arıtma Tesisi', type: 'Water Treatment', vulnerability: 0.08, exposure: 2400000, criticality: 'Critical', coordinates: [41.08, 29.00], capacity: 850, buildYear: 2008, catchmentArea: 120, elevation: 12, cascadeTargets: ['IST-PIPE-31'], demographicBreakdown: { elderly: 240000, children: 480000, disabled: 72000, lowIncome: 600000 } },
  { id: 'IST-PP-09', name: 'Ambarlı Enerji Santrali', type: 'Power Plant', vulnerability: 0.22, exposure: 4100000, criticality: 'Critical', coordinates: [40.98, 28.69], capacity: 1200, buildYear: 1985, catchmentArea: 85, elevation: 8, cascadeTargets: ['IST-WTP-04', 'IST-HOS-17'], demographicBreakdown: { elderly: 410000, children: 820000, disabled: 123000, lowIncome: 1025000 } },
  { id: 'IST-HOS-17', name: 'Başakşehir Çam ve Sakura Hastanesi', type: 'Hospital', vulnerability: 0.06, exposure: 450000, criticality: 'Critical', coordinates: [41.10, 28.80], capacity: 2682, buildYear: 2020, catchmentArea: 35, elevation: 55, cascadeTargets: [], demographicBreakdown: { elderly: 67500, children: 90000, disabled: 22500, lowIncome: 112500 } },
  { id: 'IST-PIPE-31', name: 'Boğaz Ana Şebeke Hattı', type: 'Pipeline', vulnerability: 0.25, exposure: 1800000, criticality: 'High', coordinates: [41.06, 29.04], capacity: 450, buildYear: 1998, catchmentArea: 180, elevation: 22, cascadeTargets: ['IST-HOS-17'], demographicBreakdown: { elderly: 180000, children: 360000, disabled: 54000, lowIncome: 450000 } },
];

const ISTANBUL_CASCADE: CascadeLink[] = [
  { source: 'IST-PP-09', target: 'IST-WTP-04', type: 'power', criticality: 0.95 },
  { source: 'IST-PP-09', target: 'IST-HOS-17', type: 'power', criticality: 0.98 },
  { source: 'IST-DAM-01', target: 'IST-WTP-04', type: 'water', criticality: 0.85 },
  { source: 'IST-WTP-04', target: 'IST-PIPE-31', type: 'water', criticality: 0.80 },
  { source: 'IST-PIPE-31', target: 'IST-HOS-17', type: 'water', criticality: 0.92 },
];

const ISTANBUL_FLOOD_ZONES: FloodZone[] = [
  { id: 'IST-RZ-1', name: 'Boğaz Kıyı Riski', color: '#ef4444', riskLevel: 0.92, coordinates: [[41.02, 29.00], [41.10, 29.08], [41.05, 29.12], [40.98, 29.05]] },
  { id: 'IST-RZ-2', name: 'Haliç Taşkın Alanı', color: '#f97316', riskLevel: 0.78, coordinates: [[41.04, 28.95], [41.08, 29.00], [41.05, 29.05], [41.00, 28.98]] },
];

// ─── ANKARA ───────────────────────────────────────────────────
const ANKARA_NODES: InfrastructureNode[] = [
  { id: 'ANK-DAM-01', name: 'Çamlıdere Barajı', type: 'Dam', vulnerability: 0.12, exposure: 2800000, criticality: 'Critical', coordinates: [40.52, 32.47], capacity: 1220, buildYear: 2007, catchmentArea: 850, elevation: 920, cascadeTargets: ['ANK-WTP-01'], demographicBreakdown: { elderly: 280000, children: 560000, disabled: 84000, lowIncome: 700000 } },
  { id: 'ANK-WTP-01', name: 'İvedik Arıtma Tesisi', type: 'Water Treatment', vulnerability: 0.09, exposure: 3200000, criticality: 'Critical', coordinates: [39.97, 32.78], capacity: 1400, buildYear: 2005, catchmentArea: 140, elevation: 870, cascadeTargets: ['ANK-PIPE-01'], demographicBreakdown: { elderly: 320000, children: 640000, disabled: 96000, lowIncome: 800000 } },
  { id: 'ANK-PP-01', name: 'Ankara Doğalgaz Santrali', type: 'Power Plant', vulnerability: 0.16, exposure: 3500000, criticality: 'Critical', coordinates: [39.88, 32.75], capacity: 770, buildYear: 2003, catchmentArea: 75, elevation: 845, cascadeTargets: ['ANK-WTP-01', 'ANK-HOS-01'], demographicBreakdown: { elderly: 350000, children: 700000, disabled: 105000, lowIncome: 875000 } },
  { id: 'ANK-HOS-01', name: 'Bilkent Şehir Hastanesi', type: 'Hospital', vulnerability: 0.05, exposure: 900000, criticality: 'Critical', coordinates: [39.87, 32.72], capacity: 3810, buildYear: 2019, catchmentArea: 45, elevation: 900, cascadeTargets: [], demographicBreakdown: { elderly: 135000, children: 180000, disabled: 45000, lowIncome: 225000 } },
];

const ANKARA_CASCADE: CascadeLink[] = [
  { source: 'ANK-PP-01', target: 'ANK-WTP-01', type: 'power', criticality: 0.93 },
  { source: 'ANK-PP-01', target: 'ANK-HOS-01', type: 'power', criticality: 0.97 },
  { source: 'ANK-DAM-01', target: 'ANK-WTP-01', type: 'water', criticality: 0.90 },
  { source: 'ANK-WTP-01', target: 'ANK-PIPE-01', type: 'water', criticality: 0.86 },
];

const ANKARA_FLOOD_ZONES: FloodZone[] = [
  { id: 'ANK-RZ-1', name: 'Ankara Çayı Taşkın Alanı', color: '#ef4444', riskLevel: 0.75, coordinates: [[39.92, 32.82], [39.96, 32.88], [39.93, 32.92], [39.89, 32.86]] },
];

export const CITIES: CityProfile[] = [
  { id: 'istanbul', name: 'İstanbul', region: 'Marmara', population: 16_000_000, area: 5461, coordinates: [41.04, 29.00], defaultZoom: 11, riverName: 'İstanbul Dereleri / Boğaz', coastalCity: true, seismicZone: 1, annualPrecipitation: 677, floodRiskMultiplier: 1.2, description: 'Türkiye\'nin en kalabalık şehri. İki kıtayı birleştiren konumuyla deniz seviyesi yükselişi ve taşkın riskine son derece hassas.', infrastructureNodes: ISTANBUL_NODES, floodZones: ISTANBUL_FLOOD_ZONES, cascadeLinks: ISTANBUL_CASCADE, ndviData: generateNDVI(1.0, 0.75) },
  { id: 'ankara', name: 'Ankara', region: 'İç Anadolu', population: 5_750_000, area: 25632, coordinates: [39.93, 32.85], defaultZoom: 11, riverName: 'Ankara Çayı / Hatip Çayı', coastalCity: false, seismicZone: 2, annualPrecipitation: 391, floodRiskMultiplier: 0.7, description: 'Başkent ve ikinci büyük şehir. Karasal iklim, ani sel riski ve su kıtlığı ana tehditler.', infrastructureNodes: ANKARA_NODES, floodZones: ANKARA_FLOOD_ZONES, cascadeLinks: ANKARA_CASCADE, ndviData: generateNDVI(0.85, 0.65) },
];
