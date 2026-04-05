import { Scenario, FloodForecast, MonteCarloResult, InfrastructureNode, CascadeLink, OasisORDResult, SectoralLossResult } from '../types';

// ============================================================================
// SIMULATION ENGINES
// ============================================================================

const ITERATIONS = 10000;

function getDateString(daysFromNow: number): string {
  const d = new Date();
  d.setDate(d.getDate() + daysFromNow);
  return d.toLocaleDateString('tr-TR', { day: '2-digit', month: 'short' });
}

function getAlertLevel(waterLevel: number): 'Normal' | 'Watch' | 'Warning' | 'Danger' {
  if (waterLevel >= 3.0) return 'Danger';
  if (waterLevel >= 2.0) return 'Warning';
  if (waterLevel >= 1.2) return 'Watch';
  return 'Normal';
}

function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return s / 2147483647;
  };
}

function normalRandom(rng: () => number, mean: number, std: number): number {
  const u1 = rng();
  const u2 = rng();
  const z = Math.sqrt(-2 * Math.log(u1 + 1e-10)) * Math.cos(2 * Math.PI * u2);
  return mean + std * z;
}

function paretoRandom(rng: () => number, alpha: number, xm: number): number {
  const u = rng();
  return xm / Math.pow(u + 1e-10, 1 / alpha);
}

export function generateFloodForecast(
  scenario: Scenario,
  seed: number = 12345,
  floodRiskMultiplier: number = 1.0,
  popDensityBase: number = 12000
): FloodForecast[] {
  const data: FloodForecast[] = [];
  const baseLevel = (0.4 + (scenario.precipitationDelta / 100) * 0.8 + (scenario.seaLevelRise / 200) * 0.3) * floodRiskMultiplier;
  const peakDay = 4;
  const stormIntensity = (1 + scenario.precipitationDelta / 50) * floodRiskMultiplier;
  let s = seed;
  const rng = () => { s = (s * 16807 + 0) % 2147483647; return s / 2147483647; };

  for (let day = 1; day <= 7; day++) {
    const stormProfile = Math.exp(-Math.pow(day - peakDay, 2) / 3) * stormIntensity;
    const waterLevel = Math.min(4.5, baseLevel + stormProfile * 1.5 + (rng() - 0.5) * 0.2);
    const confidence = Math.max(55, 98 - (day - 1) * 6 - rng() * 3);
    const probability = Math.min(99, Math.max(5, (waterLevel / 3.5) * 80 + (rng() - 0.5) * 10));
    const inundationArea = Math.max(0, Math.pow(waterLevel, 2.2) * 35 * floodRiskMultiplier + rng() * 20);
    const popDensity = popDensityBase * scenario.populationExposure;
    const affectedPopulation = Math.floor(inundationArea * popDensity * (waterLevel > 2 ? 1.5 : 1));

    data.push({
      day,
      date: getDateString(day),
      waterLevel: Math.round(waterLevel * 100) / 100,
      probability: Math.round(probability * 10) / 10,
      inundationArea: Math.round(inundationArea * 10) / 10,
      affectedPopulation,
      confidence: Math.round(confidence * 10) / 10,
      alertLevel: getAlertLevel(waterLevel),
    });
  }
  return data;
}

export function runMonteCarlo(
  scenario: Scenario,
  nodes: InfrastructureNode[],
  cascades: CascadeLink[],
  seed: number = 42,
  floodRiskMultiplier: number = 1.0
): MonteCarloResult[] {
  const results: MonteCarloResult[] = [];
  const rng = seededRandom(seed);
  for (let year = 2025; year <= 2075; year += 5) {
    const annualLosses: number[] = [];
    const yearOffset = (year - 2025) / 50;
    const climateTrend = 1 + yearOffset * (scenario.temperatureIncrease / 5);
    const precipFactor = 1 + scenario.precipitationDelta / 100;
    const seaFactor = 1 + scenario.seaLevelRise / 200;
    const ndviFactor = 1 + scenario.ndviDegradation * 2;
    const agingFactor = 1 + (scenario.infrastructureAgeing - 1) / 9;

    for (let i = 0; i < ITERATIONS; i++) {
      const baseRate = 0.08 * precipFactor * climateTrend * seaFactor * ndviFactor * floodRiskMultiplier;
      const eventOccurs = rng() < baseRate;
      if (!eventOccurs) { annualLosses.push(0); continue; }
      const magnitude = paretoRandom(rng, 2.5, 1.0) * climateTrend;
      let totalLoss = 0;
      const failedNodes = new Set<string>();

      for (const node of nodes) {
        const nodeVulnerability = node.vulnerability * agingFactor;
        const elevationModifier = Math.max(0, 1 - node.elevation / 200);
        const exposureWeight = (node.exposure * scenario.populationExposure) / 1000000;
        const directDamage = magnitude * nodeVulnerability * elevationModifier * exposureWeight;
        const damage = Math.max(0, normalRandom(rng, directDamage, directDamage * 0.3));
        totalLoss += damage;
        if (damage > nodeVulnerability * exposureWeight * 0.5) { failedNodes.add(node.id); }
      }

      let cascadeRounds = 0; let newFailures = true;
      while (newFailures && cascadeRounds < 5) {
        newFailures = false;
        for (const link of cascades) {
          if (failedNodes.has(link.source) && !failedNodes.has(link.target)) {
            const cascadeProb = link.criticality * agingFactor;
            if (rng() < cascadeProb) {
              failedNodes.add(link.target);
              const targetNode = nodes.find(n => n.id === link.target);
              if (targetNode) {
                const cascadeLoss = magnitude * 0.3 * (targetNode.exposure * scenario.populationExposure / 1000000);
                totalLoss += cascadeLoss;
              }
              newFailures = true;
            }
          }
        }
        cascadeRounds++;
      }
      annualLosses.push(totalLoss);
    }
    annualLosses.sort((a, b) => b - a);
    const aal = annualLosses.reduce((a, b) => a + b, 0) / ITERATIONS;
    const variance = annualLosses.reduce((sum, l) => sum + Math.pow(l - aal, 2), 0) / ITERATIONS;
    const p90 = annualLosses[Math.floor(ITERATIONS * 0.1)];
    const p99 = annualLosses[Math.floor(ITERATIONS * 0.01)];
    const p999 = annualLosses[Math.floor(ITERATIONS * 0.001)];
    results.push({
      year,
      aal: Math.round(aal * 100) / 100,
      p90: Math.round(p90 * 100) / 100,
      p99: Math.round(p99 * 100) / 100,
      p999: Math.round(p999 * 100) / 100,
      totalLoss: Math.round(aal * 1.5 * 100) / 100,
      confidence: 90 + (ITERATIONS / 10000) * 7 + Math.sqrt(variance) * 0.1
    });
  }
  return results;
}

export function calculateSectoralLosses(scenario: Scenario, floodRiskMultiplier: number, cityPopulation: number): SectoralLossResult[] {
  const precipFactor = 1 + scenario.precipitationDelta / 100;
  const tempFactor = 1 + scenario.temperatureIncrease / 10;
  const agingFactor = 1 + scenario.infrastructureAgeing / 10;
  const exposureFactor = scenario.populationExposure;

  const sectors = [
    { id: 'wash', name: 'İçme Suyu & Sanitasyon (WASH)', baseDemand: 450, economicValue: 12.5, floodVuln: 0.85, droughtVuln: 0.90, recovery: 14 },
    { id: 'irrigation', name: 'Tarımsal Sulama', baseDemand: 1200, economicValue: 2.8, floodVuln: 0.60, droughtVuln: 0.95, recovery: 45 },
    { id: 'industry', name: 'Endüstriyel Su Temini', baseDemand: 350, economicValue: 45.0, floodVuln: 0.40, droughtVuln: 0.70, recovery: 7 },
    { id: 'hydro', name: 'Hidroelektrik Enerji', baseDemand: 800, economicValue: 8.4, floodVuln: 0.20, droughtVuln: 0.80, recovery: 10 },
    { id: 'ecosystem', name: 'Eko-sistem & Sulak Alanlar', baseDemand: 200, economicValue: 5.5, floodVuln: 0.30, droughtVuln: 0.85, recovery: 180 },
  ];

  return sectors.map(sector => {
    const floodImpact = (precipFactor > 1.2 ? (precipFactor - 1) * sector.floodVuln : 0) * floodRiskMultiplier;
    const droughtImpact = (precipFactor < 1.0 ? (1 - precipFactor) * sector.droughtVuln * tempFactor : 0) * floodRiskMultiplier;
    const maxImpact = Math.max(floodImpact, droughtImpact);
    const unmetDemandRatio = Math.min(100, Math.max(0, maxImpact * 100 * agingFactor));
    const demandMultiplier = sector.id === 'wash' ? (cityPopulation / 3000000) * exposureFactor : 1.0;
    const actualDemand = sector.baseDemand * demandMultiplier;
    const shortageVolume = (actualDemand * unmetDemandRatio) / 100;
    const economicLoss = shortageVolume * sector.economicValue;
    const recoveryTimeDays = Math.round(sector.recovery / 2 + (maxImpact * sector.recovery * agingFactor));
    return { sectorId: sector.id, sectorName: sector.name, shortageVolume, economicLoss, unmetDemandRatio, recoveryTimeDays };
  });
}

export function generateOasisORD(scenario: Scenario, results: MonteCarloResult[], cityName: string = 'İstanbul'): OasisORDResult {
  const current = results[0] || { aal: 0, p90: 0, p99: 0, p999: 0 };
  const losses = results.map(r => r.aal);
  const mean = losses.reduce((a, b) => a + b, 0) / losses.length;
  const sd = Math.sqrt(losses.reduce((s, l) => s + Math.pow(l - mean, 2), 0) / losses.length);
  return {
    SummaryId: `ORD-${scenario.id}-${Date.now()}`,
    MeanLoss: Math.round(mean * 100) / 100,
    SDLoss: Math.round(sd * 100) / 100,
    MaxLoss: Math.round(current.p999 * 100) / 100,
    MinLoss: Math.round(Math.min(...losses) * 100) / 100,
    AAL: Math.round(current.aal * 100) / 100,
    EP: [
      { returnPeriod: 5, loss: Math.round(current.p90 * 0.6 * 100) / 100 },
      { returnPeriod: 10, loss: Math.round(current.p90 * 100) / 100 },
      { returnPeriod: 25, loss: Math.round(current.p90 * 1.4 * 100) / 100 },
      { returnPeriod: 50, loss: Math.round(current.p99 * 0.7 * 100) / 100 },
      { returnPeriod: 100, loss: Math.round(current.p99 * 100) / 100 },
      { returnPeriod: 250, loss: Math.round(current.p99 * 1.5 * 100) / 100 },
      { returnPeriod: 500, loss: Math.round(current.p999 * 0.8 * 100) / 100 },
      { returnPeriod: 1000, loss: Math.round(current.p999 * 100) / 100 },
    ],
    GeneratedAt: new Date().toISOString(),
    Scenario: scenario.id,
    Framework: 'Oasis LMF v2.0 — Open Results Data (ORD)',
    Currency: 'USD',
    Iterations: ITERATIONS,
    City: cityName,
  };
}
