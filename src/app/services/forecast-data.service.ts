import { Observable } from 'rxjs';
import { ForecastDataFilter, ForecastData } from '../models/forecast-data';

export abstract class ForecastDataSerivce {
  abstract createForecastDataObservable(filter$: Observable<ForecastDataFilter>): Observable<{ availableForecastDates: Date[], data: ForecastData[] }>;
}
