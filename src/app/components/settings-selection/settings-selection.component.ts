import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { faQuestionCircle } from '@fortawesome/free-regular-svg-icons';
import { LocationLookupItem } from 'src/app/models/location-lookup';
import { ForecastTarget } from 'src/app/models/forecast-target';
import { LocationLookupService } from 'src/app/services/location-lookup.service';
import { map } from 'rxjs/operators';
import { interval, Observable, Subscription } from 'rxjs';
import { ForecastDisplayMode, QuantileType } from 'src/app/models/forecast-data';
import * as _ from 'lodash-es';
import { isEqual } from 'date-fns';
import { faAngleLeft, faAngleRight, faArrowLeft, faArrowRight, faPause, faPlay, faStop } from '@fortawesome/free-solid-svg-icons';

@Component({
  selector: 'app-settings-selection',
  templateUrl: './settings-selection.component.html',
  styleUrls: ['./settings-selection.component.scss']
})
export class SettingsSelectionComponent implements OnInit, OnDestroy {

  @Input() location?: LocationLookupItem;
  @Output() onLocationChanged: EventEmitter<LocationLookupItem> = new EventEmitter<LocationLookupItem>();
  locationItems$: Observable<LocationLookupItem[]>;

  @Input() forecastTarget: ForecastTarget = ForecastTarget.Cases;
  @Output() onForecastTargetChanged: EventEmitter<ForecastTarget> = new EventEmitter<ForecastTarget>();
  ForecastTargetEnum = ForecastTarget;

  @Input() confidenceInterval: QuantileType = QuantileType.Q95;
  @Output() onConfidenceIntervalChanged: EventEmitter<QuantileType> = new EventEmitter<QuantileType>();
  QuantileTypeEnum = QuantileType;

  @Input() displayMode: ForecastDisplayMode = { $type: 'ForecastByDateDisplayMode', forecastDate: new Date(), weeksShown: 2 };
  @Output() onDisplayModeChanged: EventEmitter<ForecastDisplayMode> = new EventEmitter<ForecastDisplayMode>();

  @Input() availableForecastDates: Date[] = [];

  icons = {
    help: faQuestionCircle,
    prev: faAngleLeft,
    next: faAngleRight,
    play: faPlay,
    stop: faStop,
    pause: faPause,
  };
  titles = {
    target: "Forecasts are available for confirmed cases and deaths from COVID-19. For both targets forecasts can be shown on an incident (new cases or deaths) or cumulative (total cases or deaths) scale.",
    ci: "Forecasts always come with some uncertainty. Forecasters can therefore specify intervals which shall cover the true value with 50% or 95% probability. Note that not all forecasters make such intervals available.",
    displayMode: "You can either look at one through four-week-ahead forecasts made at a specific time point or show all forecasts for a specific forecast horizon.",
    displayModeByDateShowUpTo: "Teams provide predictions up to four weeks into the future but these become less informative and less reliable for large forecast horizons. For cases, forecats beyond two weeks may be thrown off by new intervention measures. We therefore only show one and two week ahead forecasts by default.",
  };


  constructor(private locationService: LocationLookupService) {
    this.locationItems$ = this.locationService.locations$.pipe(map(x => x.items));
  }
  ngOnDestroy(): void {
    this.stopAnimateForecastDate();
  }

  ngOnInit(): void {
  }

  changeForecastTarget(plotValue: ForecastTarget) {
    this.forecastTarget = plotValue;
    this.onForecastTargetChanged.emit(plotValue);
  }

  changeLocation(location: LocationLookupItem) {
    this.location = location;
    this.onLocationChanged.emit(location);
  }

  changeConfidenceInterval(ci: QuantileType) {
    this.confidenceInterval = ci;
    this.onConfidenceIntervalChanged.emit(ci);
  }

  changeDisplayMode(type: 'ForecastByDateDisplayMode' | 'ForecastByHorizonDisplayMode') {
    if (type === 'ForecastByHorizonDisplayMode') {
      this.stopAnimateForecastDate();
      this.displayMode = { $type: 'ForecastByHorizonDisplayMode', weeksAhead: 2 };
    }
    else {
      this.displayMode = { $type: 'ForecastByDateDisplayMode', forecastDate: this.availableForecastDates && this.availableForecastDates.length > 0 ? _.first(this.availableForecastDates)! : new Date(), weeksShown: 2 }
    }
    this.onDisplayModeChanged.emit(this.displayMode);
  }

  changeForecastByHorizonWeeksAhead(weeksAhead: 1 | 2 | 3 | 4) {
    if (this.displayMode.$type !== 'ForecastByHorizonDisplayMode') throw new Error("Current display mode isn't 'ForecastByHorizonDisplayMode', thus can't set 'weeksAhead'.");
    this.displayMode = { ...this.displayMode, weeksAhead: weeksAhead };
    this.onDisplayModeChanged.emit(this.displayMode);
  }

  changeForecastDate(date: Date) {
    if (this.displayMode.$type !== 'ForecastByDateDisplayMode') throw new Error("Current display mode isn't 'ForecastByDateDisplayMode', thus can't set 'forecastDate'.");
    this.displayMode = { ...this.displayMode, forecastDate: date };
    this.onDisplayModeChanged.emit(this.displayMode);
  }

  changeForecastByDateWeeksShown(weeksShown: 1 | 2 | 3 | 4) {
    if (this.displayMode.$type !== 'ForecastByDateDisplayMode') throw new Error("Current display mode isn't 'ForecastByDateDisplayMode', thus can't set 'weeksShown'.");
    this.displayMode = { ...this.displayMode, weeksShown: weeksShown };
    this.onDisplayModeChanged.emit(this.displayMode);
  }

  equalsCurrentForecastDate(date: Date) {
    return this.displayMode.$type === 'ForecastByDateDisplayMode' && isEqual(this.displayMode.forecastDate, date);
  }

  get canExecPrev() {
    return this.displayMode.$type === 'ForecastByDateDisplayMode' && this.getAvailableDateByDir('prev') !== undefined && !this.forecastDateBeforePlay && !this.forecastDatePlayer;
  }

  get canExecNext() {
    return this.displayMode.$type === 'ForecastByDateDisplayMode' && this.getAvailableDateByDir('next') !== undefined && !this.forecastDateBeforePlay && !this.forecastDatePlayer;
  }

  get canExecPlayPause() {
    return this.forecastDateBeforePlay ? true : this.getAvailableDateByDir('next') !== undefined;
  }

  forecastDatePlayer?: Subscription;
  forecastDateBeforePlay?: Date;

  toogleAnimateForecastDate() {
    if (this.displayMode.$type === 'ForecastByDateDisplayMode') {
      if (!this.forecastDatePlayer) {
        this.forecastDateBeforePlay = this.displayMode.forecastDate;

        this.forecastDatePlayer = interval(1000).pipe(map(x => {
          return this.getAvailableDateByDir('next');
        })).subscribe(newDate => {
          if (newDate) {
            this.changeForecastDate(newDate);
          } else {
            this.stopAnimateForecastDate();
          }
        })
      } else {
        this.forecastDatePlayer.unsubscribe();
        this.forecastDatePlayer = undefined;
      }
    }
  }

  stopAnimateForecastDate() {
    if (this.forecastDatePlayer && this.forecastDateBeforePlay) {
      this.forecastDatePlayer.unsubscribe();
      this.forecastDatePlayer = undefined;

      this.changeForecastDate(this.forecastDateBeforePlay);
      this.forecastDateBeforePlay = undefined;
    }
  }

  private getAvailableDateByDir(dir: 'prev' | 'next'): Date | undefined {
    if (this.displayMode.$type === 'ForecastByDateDisplayMode') {
      const searchDate = this.displayMode.forecastDate;
      const foundIndex = _.findIndex(this.availableForecastDates, d => isEqual(d, searchDate));
      if (foundIndex !== -1) {
        const newDateIndex = dir === 'next' ? foundIndex - 1 : foundIndex + 1;
        if (newDateIndex >= 0 && newDateIndex < this.availableForecastDates.length) {
          return this.availableForecastDates[newDateIndex];
        }
      }
    }

    return undefined;
  }

  changeForecastDateByDir(dir: 'prev' | 'next') {
    const newDate = this.getAvailableDateByDir(dir);
    if (newDate) {
      this.changeForecastDate(newDate);
    }
  }

}
