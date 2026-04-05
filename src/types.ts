import { ReactElementType } from 'react';

export interface Scenario {
  id: string;
  name: string;
  precipitationDelta: number;
  infrastructureAgeing: number;
  populationExposure: number;
  sarVerified: boolean;
  seaLevelRise: number;
  temperatureIncrease: number;
  ndviDegradation: number;
  urbanizationRate: number;
}

export interface MonteCarloResult {
  year: number;
  aal: number;
  p90: number;
  p99: number;
  p999: number;
  totalLoss: number;
  confidence: number;
}

export interface InfrastructureNode {
  id: string;
  name: string;
  type: 'Dam' | 'Water Treatment' | 'Power Plant' | 'Pipeline' | 'Hospital' | 'School';
  vulnerability: number;
  exposure: number;
  criticality: 'Low' | 'Medium' | 'High' | 'Critical';
  coordinates: [number, number];
  capacity: number;
  buildYear: number;
  catchmentArea: number;
  elevation: number;
  cascadeTargets: string[];
  demographicBreakdown: {
    elderly: number;
    children: number;
    disabled: number;
    lowIncome: number;
  };
}

export interface FloodForecast {
  day: number;
  date: string;
  waterLevel: number;
  probability: number;
  inundationArea: number;
  affectedPopulation: number;
  confidence: number;
  alertLevel: 'Normal' | 'Watch' | 'Warning' | 'Danger';
}

export interface OasisORDResult {
  SummaryId: string;
  MeanLoss: number;
  SDLoss: number;
  MaxLoss: number;
  MinLoss: number;
  AAL: number;
  EP: { returnPeriod: number; loss: number }[];
  GeneratedAt: string;
  Scenario: string;
  Framework: string;
  Currency: string;
  Iterations: number;
  City: string;
}

export interface EventLogEntry {
  id: string;
  timestamp: string;
  type: 'info' | 'warning' | 'critical' | 'success' | 'cascade';
  source: string;
  message: string;
}

export interface FloodZone {
  id: string;
  name: string;
  color: string;
  riskLevel: number;
  coordinates: [number, number][];
}

export interface CascadeLink {
  source: string;
  target: string;
  type: 'power' | 'water' | 'transport' | 'data';
  criticality: number;
}

export interface NDVIDataPoint {
  month: string;
  baseline: number;
  current: number;
  postFire: number;
}

export interface CityProfile {
  id: string;
  name: string;
  region: string;
  population: number;
  area: number;
  coordinates: [number, number];
  defaultZoom: number;
  riverName: string;
  coastalCity: boolean;
  seismicZone: number;
  annualPrecipitation: number;
  floodRiskMultiplier: number;
  description: string;
  infrastructureNodes: InfrastructureNode[];
  floodZones: FloodZone[];
  cascadeLinks: CascadeLink[];
  ndviData: NDVIDataPoint[];
}

export type TabId = 'overview' | 'twin_sim' | 'forecast' | 'montecarlo' | 'sectoral' | 'nexus' | 'climate' | 'economy' | 'trade' | 'social' | 'aiopt' | 'cascade' | 'c4i';

export interface TabConfig {
  id: TabId;
  icon: ReactElementType;
  label: string;
  labelTR: string;
}
