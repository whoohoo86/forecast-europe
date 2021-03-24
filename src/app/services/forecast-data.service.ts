import { Observable } from 'rxjs';
import { ForecastDataFilter, ForecastData } from '../models/forecast-data';
import { ForecastTarget } from '../models/forecast-target';
import { LocationLookupItem } from '../models/location-lookup';

export abstract class ForecastDataSerivce {
  abstract createForecastDataObservable(filter: ForecastDataFilter): Observable<{ filter: { target: ForecastTarget, location: LocationLookupItem }, availableForecastDates: Date[], data: ForecastData[] }>;
}
