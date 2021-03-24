import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges } from '@angular/core';
import { ForecastData, ForecastDataFilter, ForecastDisplaySettings, ForecastModelData } from 'src/app/models/forecast-data';
import * as _ from 'lodash-es';
import { TruthData } from 'src/app/models/truth-data';
// import { defaultModelNames, ensembleModelNames } from 'src/app/models/model-names';
import { faQuestionCircle } from '@fortawesome/free-regular-svg-icons';
import { DefaultSettingsService } from 'src/app/services/default-settings.service';
import { Subscription } from 'rxjs';

interface ModelLegendItem {
  name: string;
  hasSeries: boolean;
  color: string;
}

@Component({
  selector: 'app-forecast-chart-with-legend',
  templateUrl: './forecast-chart-with-legend.component.html',
  styleUrls: ['./forecast-chart-with-legend.component.scss']
})
export class ForecastChartWithLegendComponent implements OnInit, OnChanges, OnDestroy {

  @Input() dataFilter?: ForecastDataFilter;
  @Input() displaySettings?: ForecastDisplaySettings;
  @Input() forecastData?: ForecastData[];
  @Input() truthData: TruthData[] = [];

  @Output() onForecastDateChanged = new EventEmitter<Date>();

  ensembleModelNames?: string[] = undefined;
  visibleModels?: string[] = undefined;
  models: ForecastModelData[] = [];

  icons = {
    help: faQuestionCircle
  };
  titles = {
    selection: 'You can select or unselect models by clicking on them in the legend. By clicking on "None", "All" or "Ensemble" you  can select all of the models, none or only the median ensemble forecast.'
  };


  get modelNames() {
    return this.models.map(x => x.model);
  }

  private readonly colors: string[] = [
    'rgb(101,179,46)',
    'rgb(124,189,196)',
    'rgb(192,210,54)',
    'rgb(62,91,132)',
    'rgb(0,140,117)',
    'rgb(130,66,141)',
    'rgb(232,104,63)',
    'rgb(184,26,93)'
  ];

  private defaultModelsSub: Subscription;
  private ensembleModelsSub: Subscription;

  constructor(private defaultSettingService: DefaultSettingsService) {
    this.defaultModelsSub = this.defaultSettingService.defaultModelNames$.subscribe(x => {
      if (!this.visibleModels) {
        this.visibleModels = x;
      }
    });

    this.ensembleModelsSub = this.defaultSettingService.ensembleModelNames$.subscribe(x => {
      if (!this.ensembleModelNames) {
        this.ensembleModelNames = x;
      }
    });
  }
  ngOnDestroy(): void {
    this.defaultModelsSub.unsubscribe();
  }

  modelIdentity(index: number, model: ForecastModelData) {
    return model.model;
  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.updateModelsAndSeries();
  }

  toggleVisibility(model: string) {
    if (!this.visibleModels) {
      this.visibleModels = _.without(this.modelNames, model);
    } else {
      const index = this.visibleModels.indexOf(model);
      if (index > -1) {
        this.visibleModels = this.visibleModels.filter((x, i) => i !== index);
      } else {
        this.visibleModels = [...this.visibleModels, model];
      }
    }
  }

  changeModelVisibility(visibleModels: string[]) {
    this.visibleModels = visibleModels;
  }

  isVisible(model: string) {
    return this.visibleModels ? this.visibleModels.indexOf(model) > -1 : true;
  }

  changeForecastDate(date: Date) {
    this.onForecastDateChanged.emit(date);
  }

  private updateModelsAndSeries() {
    if (!(this.forecastData && this.displaySettings)) {
      this.models = [];
    }
    else {
      let colorIndex = 0;
      const modelMap = _.reduce(this.forecastData, (prev, curr) => {
        if (!prev.has(curr.model)) {
          prev.set(curr.model, { model: curr.model, color: this.colors[colorIndex++ % this.colors.length], data: [] });
        }

        const modelSeries = prev.get(curr.model)!;

        // if (this.displaySettings!.displayMode.$type === 'ForecastByDateDisplayMode') {
        //   if (curr.timezero.toISOString() === this.displaySettings!.displayMode.forecastDate.toISOString() && curr.target.time_ahead <= this.displaySettings!.displayMode.weeksShown) {
        //     modelSeries.data.push(curr);
        //   }
        // }
        // else if (this.displaySettings!.displayMode.$type === 'ForecastByHorizonDisplayMode') {
        //   if (curr.target.time_ahead <= this.displaySettings!.displayMode.weeksAhead) {
        //     modelSeries.data.push(curr);
        //   }
        // }

        return prev;
      }, new Map<string, ForecastModelData>());

      // if (!this.visibleModels) {
      //   this.visibleModels = [...modelMap.keys()];
      // }
      this.models = _.orderBy([...modelMap.values()], x => x.model);
    }
  }
}
