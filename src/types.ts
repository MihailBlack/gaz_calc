export type Scenario = 'taxi' | 'business';

export interface Inputs {
  gasPrice: number;
  capex: number;
  priceToClient: number;
  carsPerDay: number;
  kwhPerCar: number;
  electricityLoss: number;
  priceToBusiness: number;
  dailyKwhPerBusiness: number;
  businessesCount: number;
  gasConsumptionPerKwh: number;
  servicePercent: number;
  amortizationKwh: number;
}

export interface ScenarioResults {
  dailyKwh: number;
  dailyRevenue: number;
  monthlyRevenue: number;
  monthlyProfit: number;
  marginPerKwh: number;
  marginPercent: number;
  paybackMonths: number;
  paybackYears: number;
  fullCost: number;
}

export interface ChartPoint {
  month: number;
  accumulatedProfitMln: number;
}

export interface CapexBreakdownRub {
  total: number;
  batteries: number;
  stations: number;
  generators: number;
  logistics: number;
}

export interface InfraResult {
  stationsCount: number;
  batteriesCount: number;
  generatorsCount: number;
  capex: CapexBreakdownRub;
}
