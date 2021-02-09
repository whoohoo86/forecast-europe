import { Component, OnDestroy, OnInit } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import { delay, first, map, shareReplay } from 'rxjs/operators';
import { ForecastData, ForecastDataFilter, ForecastDisplayMode, ForecastDisplaySettings, ForecastModelData, QuantileType } from 'src/app/models/forecast-data';
import { ForecastTarget } from 'src/app/models/forecast-target';
import { LocationLookupService } from 'src/app/services/location-lookup.service';
import * as _ from 'lodash-es';
import { TruthDataService } from 'src/app/services/truth-data.service';
import { TruthData } from 'src/app/models/truth-data';
import { differenceInDays, isEqual } from 'date-fns';
import { ForecastDataSerivce } from 'src/app/services/forecast-data.service';

@Component({
  selector: 'app-forecast',
  templateUrl: './forecast.component.html',
  styleUrls: ['./forecast.component.scss']
})
export class ForecastComponent implements OnInit, OnDestroy {

  displaySettings: ForecastDisplaySettings = { confidenceInterval: QuantileType.Q95, displayMode: { $type: 'ForecastByDateDisplayMode', weeksShown: 2, forecastDate: new Date() } };
  dataFilter: ForecastDataFilter = { location: undefined, target: ForecastTarget.Cases };

  availableForecastDates: Date[] = [];
  forecastData?: ForecastData[];
  truthData: TruthData[] = [];
  locationValueMap$: Observable<Map<string, number>>;
  isLoadingForecast = true;
  isLoadingTruth = true;

  private dataFilter$: BehaviorSubject<ForecastDataFilter> = new BehaviorSubject<ForecastDataFilter>(this.dataFilter);
  private defaultLocationSub: Subscription;
  private filteredForecastDataSub: Subscription;
  private filteredTruthDataSub: Subscription;

  constructor(private forecastService: ForecastDataSerivce, private locationService: LocationLookupService, private truthDataService: TruthDataService) {
    this.defaultLocationSub = this.locationService.locations$.pipe(first()).subscribe(x => this.changeDataFilter({ location: x.items[0] }));

    this.filteredForecastDataSub = this.forecastService.createForecastDataObservable(this.dataFilter$)
      .subscribe(data => {
        if (!data) {
          this.availableForecastDates = [];
          this.forecastData = undefined;
        }
        else {
          this.availableForecastDates = data.availableForecastDates;
          if (this.displaySettings.displayMode.$type === 'ForecastByDateDisplayMode' && this.availableForecastDates.length > 0 && this.availableForecastDates.indexOf(this.displaySettings.displayMode.forecastDate) === -1) {
            this.changeDisplaySettings({ displayMode: { ...this.displaySettings.displayMode, forecastDate: _.first(this.availableForecastDates)! } });
          }
          this.forecastData = data.data;
        }

        this.isLoadingForecast = false;
      });

    this.filteredTruthDataSub = combineLatest([this.truthDataService.truthData$, this.dataFilter$])
      .pipe(map(([data, filter]) => {
        if (!filter.location) return;
        return data[filter.location.id][filter.target];
      })).subscribe(data => {
        this.truthData = data ? data : [];

        this.isLoadingTruth = false;
      });

    this.locationValueMap$ = combineLatest([this.truthDataService.truthData$, this.dataFilter$.pipe(map(x => x.target))])
      .pipe(map(([data, target]) => {
        return new Map<string, number>(_.map(data, (d, locationKey) => {
          const maxDateItem = _.maxBy(d[target], x => x.date);
          return [locationKey, maxDateItem ? maxDateItem.value : 0];
        }));
      }));
  }

  changeDisplaySettings(change: Partial<ForecastDisplaySettings>) {
    this.displaySettings = { ...this.displaySettings, ...change };
  }

  changeDataFilter(change: Partial<ForecastDataFilter>) {
    this.dataFilter = { ...this.dataFilter, ...change };
    this.dataFilter$.next(this.dataFilter);
  }

  changeForecastDate(date: Date) {
    if (this.displaySettings.displayMode.$type === 'ForecastByDateDisplayMode' && this.availableForecastDates) {
      const closestDate = _.minBy(this.availableForecastDates, x => Math.abs(differenceInDays(x, date)));
      if (closestDate && Math.abs(differenceInDays(closestDate, date)) <= 7) {
        const newMode = { ...this.displaySettings.displayMode, forecastDate: closestDate };
        this.changeDisplaySettings({ displayMode: newMode });
      }
    }
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.defaultLocationSub.unsubscribe();
    this.filteredForecastDataSub.unsubscribe();
    this.filteredTruthDataSub.unsubscribe();
  }

}
