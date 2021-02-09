import { ForecastTarget } from './forecast-target';
import { LocationLookupItem } from './location-lookup';

export enum QuantileType {
  Q95,
  Q50
}

export enum QuantilePointType {
  Lower,
  Upper
}

export enum ForecastType {
  Observed = 'observed',
  Point = 'point',
  Quantile = 'quantile'
}

export interface ForecastData {
  forecast_date: Date;
  target: ForecastTargetDescription;
  location: string;
  type: ForecastType;
  quantile?: { type: QuantileType, point: QuantilePointType };
  value: number;
  timezero: Date;
  model: string;
}

export interface ForecastTargetDescription {
  time_ahead: number;
  target_type: ForecastTarget;
  end_date: Date;
}

export interface ForecastModelData {
  model: string;
  color: string;
  data: ForecastData[];
}

export interface ForecastDataFilter {
  location?: LocationLookupItem;
  target: ForecastTarget;
}

export interface ForecastDisplaySettings {
  confidenceInterval: QuantileType;
  displayMode: ForecastDisplayMode;
}

export interface ForecastByDateDisplayMode {
  $type: 'ForecastByDateDisplayMode';

  forecastDate: Date;
  weeksShown: 1 | 2 | 3 | 4;
}

export interface ForecastByHorizonDisplayMode {
  $type: 'ForecastByHorizonDisplayMode';

  weeksAhead: 1 | 2 | 3 | 4;
}

export type ForecastDisplayMode = ForecastByDateDisplayMode | ForecastByHorizonDisplayMode;

