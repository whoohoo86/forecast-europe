import { AfterViewInit, Component, OnDestroy, OnInit, ViewChild } from '@angular/core';
import { BehaviorSubject, combineLatest, Observable, Subscription } from 'rxjs';
import { debounceTime, delay, first, map, shareReplay, startWith, take, tap } from 'rxjs/operators';
import { ChartDataView, ForecastByDateDisplayMode, ForecastByHorizonDisplayMode, ForecastData, ForecastDataFilter, ForecastDisplayMode, ForecastDisplaySettings, ForecastModelData, QuantileType } from 'src/app/models/forecast-data';
import { ForecastTarget } from 'src/app/models/forecast-target';
import { LocationLookupService } from 'src/app/services/location-lookup.service';
import * as _ from 'lodash-es';
import { TruthDataService } from 'src/app/services/truth-data.service';
import { TruthData } from 'src/app/models/truth-data';
import { differenceInDays, isEqual } from 'date-fns';
import { ForecastDataSerivce } from 'src/app/services/forecast-data.service';
import { LocationLookup, LocationLookupItem } from 'src/app/models/location-lookup';
import { DefaultSettingsService } from 'src/app/services/default-settings.service';
import { CdkScrollable } from '@angular/cdk/overlay';
import { ColorPicker } from 'src/app/models/color-picker';
import { TargetLabelPipe } from 'src/app/pipes/target-label.pipe';
import { BreakpointObserver } from '@angular/cdk/layout';

@Component({
  selector: 'app-forecast',
  templateUrl: './forecast.component.html',
  styleUrls: ['./forecast.component.scss']
})
export class ForecastComponent implements OnInit, OnDestroy, AfterViewInit {
  ForecastTargetEnum = ForecastTarget;
  QuantileTypeEnum = QuantileType;
  startSideNavOpened = true;
  prevStartSideNavOpened: boolean = true;
  endSideNavOpened = true;
  isDisplaySettingOpened = true;
  prevIsDisplaySettingOpened: boolean = true;

  private targetLabelPipe = new TargetLabelPipe();
  private userVisibleModels$ = new BehaviorSubject<string[] | undefined>(undefined);
  private displaySettings: ForecastDisplaySettings;
  private dataFilter: ForecastDataFilter;

  dataView$: Observable<ChartDataView>;
  locationsOrderedById$: Observable<LocationLookupItem[]>;
  locations$: Observable<LocationLookupItem[]>;
  locationValueMap$: Observable<Map<string, number>>;
  visibleModels$: Observable<string[]>;
  allModelNames$: Observable<string[]>;
  ensembleModelNames$: Observable<string[]>;
  mapLegendHeader$: Observable<string>;
  colorPicker = new ColorPicker();

  isDesktopWidth$: Observable<boolean>;
  isDisplaySettingHeight$: Observable<boolean>;

  displaySettingCloseSubscription: Subscription;
  startSideNavCloseSubscription: Subscription;

  constructor(private forecastService: ForecastDataSerivce, public locationService: LocationLookupService, private truthDataService: TruthDataService, private defaultSettingService: DefaultSettingsService, private breakpointObserver: BreakpointObserver) {
    this.isDesktopWidth$ = this.breakpointObserver.observe('(min-width: 1400px)').pipe(map(x => x.matches)).pipe(shareReplay(1));
    this.startSideNavCloseSubscription = this.isDesktopWidth$.subscribe(isDesktopWidth => {
      if (!isDesktopWidth) {
        this.prevStartSideNavOpened = this.startSideNavOpened;
        this.startSideNavOpened = false;
      }
      else {
        this.startSideNavOpened = this.prevStartSideNavOpened;
      }
    });

    this.isDisplaySettingHeight$ = this.breakpointObserver.observe('(min-height: 700px)').pipe(map(x => x.matches)).pipe(shareReplay(1));
    this.displaySettingCloseSubscription = this.isDisplaySettingHeight$.subscribe(isHeighEnoughForDisplaySettings => {
      if (!isHeighEnoughForDisplaySettings) {
        this.prevIsDisplaySettingOpened = this.isDisplaySettingOpened;
        this.isDisplaySettingOpened = false;
      } else {
        this.isDisplaySettingOpened = this.prevIsDisplaySettingOpened;
      }
    });

    this.ensembleModelNames$ = this.defaultSettingService.ensembleModelNames$;

    this.dataFilter = new ForecastDataFilter(this.locationService);
    this.locationsOrderedById$ = this.locationService.locations$.pipe(map(x => _.orderBy(x.items, 'id')));
    this.locations$ = this.locationService.locations$.pipe(map(x => x.items));

    const truthDataView$ = combineLatest([this.truthDataService.truthData$, this.dataFilter.filter$])
      .pipe(map(([truthData, filter]) => {
        const data = truthData[filter.location.id][filter.target];
        return {
          filter: filter,
          truthData: data
        };
      }))
      .pipe(shareReplay(1));

    const forecastDataView$ = this.forecastService.createForecastDataObservable(this.dataFilter).pipe(shareReplay(1));

    this.locationValueMap$ = combineLatest([this.truthDataService.truthData$, this.dataFilter.target$])
      .pipe(map(([data, target]) => {
        return new Map<string, number>(_.map(data, (d, locationKey) => {
          const maxDateItem = _.maxBy(d[target], x => x.date);
          return [locationKey, maxDateItem ? maxDateItem.value : 0];
        }));
      }))
      .pipe(shareReplay(1));

    this.displaySettings = new ForecastDisplaySettings(forecastDataView$.pipe(map(x => x.availableForecastDates)).pipe(shareReplay(1)));

    const forecastModelsDataView$ = combineLatest([forecastDataView$, this.displaySettings.settings$])
      .pipe(map(([dataView, displaySettings]) => {
        const modelMap = _.reduce(dataView.data, (prev, curr) => {
          if (!prev.has(curr.model)) {
            prev.set(curr.model, { model: curr.model, color: this.colorPicker.pick(curr.model), data: [] });
          }

          const modelSeries = prev.get(curr.model)!;

          if (displaySettings.displayMode.$type === 'ForecastByDateDisplayMode') {
            if (curr.timezero.toISOString() === displaySettings.displayMode.forecastDate.toISOString() && curr.target.time_ahead <= displaySettings.displayMode.weeksShown) {
              modelSeries.data.push(curr);
            }
          }
          else if (displaySettings.displayMode.$type === 'ForecastByHorizonDisplayMode') {
            if (curr.target.time_ahead <= displaySettings.displayMode.weeksAhead) {
              modelSeries.data.push(curr);
            }
          }

          return prev;
        }, new Map<string, ForecastModelData>());
        return {
          displaySettings,
          availableDates: dataView.availableForecastDates,
          data: _.orderBy([...modelMap.values()], x => x.model)
        }
      }))
      .pipe(shareReplay(1));

    this.allModelNames$ = forecastModelsDataView$.pipe(map(x => x.data.map(d => d.model)));

    this.visibleModels$ = combineLatest([this.userVisibleModels$.asObservable(), this.defaultSettingService.defaultModelNames$, this.allModelNames$]).pipe(map(([u, d, a]) => {
      return u || d || a;
    }));

    this.dataView$ = combineLatest([forecastModelsDataView$, truthDataView$])
      .pipe(debounceTime(50))
      .pipe(map(([forecastModelsDataView, truthData]) => {
        return {
          displaySettings: forecastModelsDataView.displaySettings,
          forecasts: forecastModelsDataView.data,
          truthData: truthData.truthData,
          filter: truthData.filter,
          availableDates: forecastModelsDataView.availableDates
        } as ChartDataView;
      }))
      .pipe(shareReplay(1));

    this.mapLegendHeader$ = this.dataFilter.target$
      .pipe(map(x => {
        return `<b>${this.targetLabelPipe.transform(x)}</b><i> / 100,000 inhabitants</i>`;
      }));
  }

  closeStartSideNav() {
    this.startSideNavOpened = false;
  }

  openStartSideNav() {
    this.startSideNavOpened = true;
  }

  changeVisibleModels(models: string[]) {
    this.userVisibleModels$.next(models);
  }

  changeTarget(target: ForecastTarget) {
    this.dataFilter.changeTarget(target);
  }

  changeLocation(location: LocationLookupItem | undefined) {
    this.dataFilter.changeLocation(location);
  }

  changeForecastDate(date: Date, dates: Date[], currentDisplayMode: ForecastDisplayMode) {
    if (currentDisplayMode && currentDisplayMode.$type === 'ForecastByDateDisplayMode' && dates) {
      const closestDate = _.minBy(dates, x => Math.abs(differenceInDays(x, date)));
      if (closestDate && Math.abs(differenceInDays(closestDate, date)) <= 7) {
        const newMode = { ...currentDisplayMode, forecastDate: closestDate };
        this.displaySettings.changeDateDisplayMode(newMode);
        // this.displaySettings.changeDisplayMode(newMode);
      }
    }
  }

  compareDates(l: Date, r: Date) {
    return l.toISOString() === r.toISOString();
  }

  changeConfidenceInterval(ci: QuantileType | undefined) {
    this.displaySettings.changeConfidenceInterval(ci);
  }

  changeDisplayMode(type: 'ForecastByDateDisplayMode' | 'ForecastByHorizonDisplayMode') {
    const newMode = type === 'ForecastByHorizonDisplayMode' ? 'horizon' : 'date';
    this.displaySettings.changeDisplayMode(newMode);
  }

  changeHorizonWeeksAhead(update: 1 | 2 | 3 | 4, currentDisplayMode: ForecastByHorizonDisplayMode) {
    this.displaySettings.changeHorizonDisplayMode({ ...currentDisplayMode, weeksAhead: update });
  }

  changeDateWeeksShown(update: 1 | 2 | 3 | 4, currentDisplayMode: ForecastByDateDisplayMode) {
    this.displaySettings.changeDateDisplayMode({ ...currentDisplayMode, weeksShown: update });
  }

  changeVisbileModels(visibleModels: string[]) {
    this.userVisibleModels$.next(visibleModels);
  }

  canExecPrev(currentDisplaMode: ForecastDisplayMode, availableDates: Date[]) {
    return currentDisplaMode.$type === 'ForecastByDateDisplayMode' && this.getAvailableDateByDir('prev', currentDisplaMode, availableDates) !== undefined;
  }

  canExecNext(currentDisplaMode: ForecastDisplayMode, availableDates: Date[]) {
    return currentDisplaMode.$type === 'ForecastByDateDisplayMode' && this.getAvailableDateByDir('next', currentDisplaMode, availableDates) !== undefined;
  }

  forceResize() {
    window.dispatchEvent(new Event('resize'));
  }

  private getAvailableDateByDir(dir: 'prev' | 'next', currentDisplaMode: ForecastDisplayMode, availableDates: Date[]): Date | undefined {
    if (currentDisplaMode.$type === 'ForecastByDateDisplayMode') {
      const searchDate = currentDisplaMode.forecastDate;
      const foundIndex = _.findIndex(availableDates, d => isEqual(d, searchDate));
      if (foundIndex !== -1) {
        const newDateIndex = dir === 'next' ? foundIndex - 1 : foundIndex + 1;
        if (newDateIndex >= 0 && newDateIndex < availableDates.length) {
          return availableDates[newDateIndex];
        }
      }
    }

    return undefined;
  }

  changeForecastDateByDir(dir: 'prev' | 'next', currentDisplaMode: ForecastDisplayMode, availableDates: Date[]) {
    const newDate = this.getAvailableDateByDir(dir, currentDisplaMode, availableDates);
    if (newDate) {
      this.changeForecastDate(newDate, availableDates, currentDisplaMode);
    }
  }


  @ViewChild(CdkScrollable) scroller?: CdkScrollable;

  canScrollDown: boolean = true;
  canScrollUp: boolean = false;

  scrollDown() {
    if (this.scroller) {
      const currentTop = this.scroller.measureScrollOffset('top');
      const newTop = currentTop + 42;
      this.scroller.scrollTo({ behavior: 'smooth', top: newTop });
      this.canScrollDown = true;
      this.canScrollUp = newTop > 0;
    }
  }

  scrollUp() {
    if (this.scroller) {
      const currentTop = this.scroller.measureScrollOffset('top');
      const newTop = currentTop - 42;
      this.scroller.scrollTo({ behavior: 'smooth', top: newTop });
      this.canScrollUp = newTop > 0;
      this.canScrollDown = true;
    }
  }

  noop() { }

  // logScroll(event: any) {
  //   console.log("SCROLL", event);
  // }

  log(event: any, text?: string) {
    if (text) {
      console.log(text, event);
    } else {
      console.log(event);
    }
  }

  ngOnInit(): void {
  }

  ngOnDestroy(): void {
    this.startSideNavCloseSubscription.unsubscribe();
    this.displaySettingCloseSubscription.unsubscribe();
  }

  ngAfterViewInit(): void {
  }


}
