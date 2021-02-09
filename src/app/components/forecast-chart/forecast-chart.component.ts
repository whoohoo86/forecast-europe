import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { ECharts, EChartsOption, SeriesOption, TooltipComponentOption } from 'echarts';
import { ForecastByDateDisplayMode, ForecastByHorizonDisplayMode, ForecastData, ForecastDataFilter, ForecastDisplaySettings, ForecastModelData, ForecastType, QuantilePointType, QuantileType } from 'src/app/models/forecast-data';
import { TruthData } from 'src/app/models/truth-data';
import * as _ from 'lodash-es';
import { addDays } from 'date-fns';
import { DateHelper } from 'src/app/util/date-helper';
import { TitleCasePipe } from '@angular/common';
import { NumberHelper } from 'src/app/util/number-helper';
import { stringify } from '@angular/compiler/src/util';

@Component({
  selector: 'app-forecast-chart',
  templateUrl: './forecast-chart.component.html',
  styleUrls: ['./forecast-chart.component.scss']
})
export class ForecastChartComponent implements OnInit, OnChanges {

  @Input() dataFilter?: ForecastDataFilter;
  @Input() displaySettings?: ForecastDisplaySettings;
  @Input() forecastModelData: ForecastModelData[] = [];
  @Input() truthData: TruthData[] = [];
  @Input() visibleModels?: string[];

  @Output() onForecastDateChanged = new EventEmitter<Date>();

  private titlePipe = new TitleCasePipe();
  private readonly defaultChartOption = {
    grid: {
      top: 20,
      left: 65,
      right: 30
    },
    xAxis: {
      type: 'time' as 'time',
    },
    yAxis: {
      type: 'value' as 'value',
      name: '',
      nameLocation: 'middle' as 'middle',
      nameGap: 50
    },
    tooltip: {
      trigger: 'axis' as 'axis',
      axisPointer: { show: true },
      formatter: undefined as any
    },
    dataZoom: [
      { type: 'inside', start: 80, end: 100, filterMode: 'none' as 'none' },
      { type: 'slider', start: 80, end: 100, filterMode: 'none' as 'none' },
    ],
    // animationDurationUpdate: 100,
    animationDuration: 500,
    series: []
  };

  chartOption?: EChartsOption;

  private dataZoomState?: { start: any, end: any };
  private chart?: ECharts;

  constructor() {

  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    this.updateChartOption();
  }

  onChartInit(chart: ECharts) {
    this.chart = chart;
  }

  onDataZoom(event: any) {
    if (event.batch) {
      const dataZoom = event.batch[0];
      this.dataZoomState = { start: dataZoom.start, end: dataZoom.end };
    } else {
      this.dataZoomState = { start: event.start, end: event.end };
    }
  }

  onAxisPointerClick(event: [Date, any]) {
    // console.log("AXISPOINTER CLICK :: ", event);
    this.onForecastDateChanged.emit(event[0]);
  }

  private highlightedModel?: string;

  highlight(model: string) {
    if (this.chart) {
      this.chart.dispatchAction({
        type: 'highlight',
        seriesName: model
      });
      this.highlightedModel = model;
    }
  }

  stopHighlight() {
    if (this.chart && this.highlightedModel) {
      this.chart.dispatchAction({
        type: 'downplay',
        seriesName: this.highlightedModel
      });
      this.highlightedModel = undefined;
    }
  }

  private updateChartOption() {
    const newSeries: SeriesOption[] = [];
    const newChartOption = { ...this.defaultChartOption, series: newSeries };

    if (this.dataZoomState) {
      newChartOption.dataZoom[0].start = newChartOption.dataZoom[1].start = this.dataZoomState.start;
      newChartOption.dataZoom[0].end = newChartOption.dataZoom[1].end = this.dataZoomState.end;
    }

    if (this.dataFilter) {
      newChartOption.yAxis.name = this.titlePipe.transform(this.dataFilter.target);
    }

    if (this.truthData) {
      let data = this.truthData.map(d => ([d.date, d.value]));

      // filters truthdata by forecastDate if displayMode === 'ForecastByDateDisplayMode'
      // if(this.displaySettings && this.displaySettings.displayMode.$type === 'ForecastByDateDisplayMode'){
      //   const forecastDate = this.displaySettings.displayMode.forecastDate;
      //   data = data.filter(d => d[0] <= forecastDate);
      // }

      newSeries.push({
        type: 'line',
        name: 'truth-data',
        id: `${this.getDataFilterId()}-truth-data`,
        data: data,
        color: '#333',
      })
    }

    if (this.displaySettings) {
      let seriesByDisplayMode: any[] = [];
      if (this.displaySettings.displayMode.$type === 'ForecastByDateDisplayMode') {
        seriesByDisplayMode = this.createSeriesByForecastDate(this.displaySettings.confidenceInterval, this.displaySettings.displayMode);
        (<any>newChartOption).tooltip.formatter = this.createForecastDateTooltipFormatter();
      }
      else if (this.displaySettings.displayMode.$type === 'ForecastByHorizonDisplayMode') {
        seriesByDisplayMode = this.createSeriesByForecastHorizon(this.displaySettings.confidenceInterval, this.displaySettings.displayMode);
        (<any>newChartOption).tooltip.formatter = this.createForecastHorizonTooltipFormatter();
        newChartOption.grid = { ...newChartOption.grid, top: 10 };
      }
      seriesByDisplayMode.forEach(x => newSeries.push(x));
    }

    this.chartOption = newChartOption;
  }

  private createSeriesByForecastHorizon(ci: QuantileType, displayMode: ForecastByHorizonDisplayMode): any[] {
    const forecasts = this.getVisibleForecastModels();
    if (!forecasts || forecasts.length === 0) {
      return [];
    }

    return _.flatMap(forecasts, modelData => {
      const seriesData = _.reduce(modelData.data, (prev, curr) => {
        const timezeroStr = curr.timezero.toISOString();
        if (curr.type === ForecastType.Point && curr.target.time_ahead === displayMode.weeksAhead || curr.type === ForecastType.Observed) {
          if (!prev.has(timezeroStr)) {
            prev.set(timezeroStr, { line: [], area: new Map() })
          }
          prev.get(timezeroStr)!.line.push({ value: [curr.target.end_date, curr.value] });
        } else if (curr.type === ForecastType.Quantile && curr.target.time_ahead === displayMode.weeksAhead && curr.quantile && curr.quantile.type === ci) {
          if (!prev.has(timezeroStr)) {
            prev.set(timezeroStr, { line: [], area: new Map() })
          }

          if (!prev.get(timezeroStr)!.area.has(curr.target.end_date.toISOString())) {
            prev.get(timezeroStr)!.area.set(curr.target.end_date.toISOString(), [{ xAxis: undefined, yAxis: undefined }, { xAxis: undefined, yAxis: undefined }]);
          }

          const mapEntry = prev.get(timezeroStr)!.area.get(curr.target.end_date.toISOString())!;
          if (curr.quantile.point === QuantilePointType.Lower) {
            mapEntry[0].xAxis = addDays(curr.target.end_date, -3);
            mapEntry[0].yAxis = curr.value;
          } else if (curr.quantile.point === QuantilePointType.Upper) {
            mapEntry[1].xAxis = addDays(curr.target.end_date, 3);
            mapEntry[1].yAxis = curr.value;
          }
        }
        return prev;
      }, new Map<string, { line: any[], area: Map<string, [any, any]> }>());

      const result = _.flatMap([...seriesData.values()], (x, i) => {
        const id = `${this.getDataFilterId()}-${modelData.model}-${i}`
        return [{
          type: 'line',
          name: modelData.model,
          id: id,
          data: x.line.map(l => {
            const area = x.area.get(l.value[0].toISOString());
            return { value: [l.value[0], l.value[1], area?.map(a => a.yAxis) || undefined] };
          }),
          color: modelData.color,
        },
        {
          type: 'line',
          name: modelData.model,
          id: `${id}-ci`,
          data: _.flatMap([...x.area.values()], ([d0, d1]) => [{ value: [d0.xAxis, d0.yAxis] }, { value: [d1.xAxis, d1.yAxis] }]),
          silent: true,
          symbol: 'none',
          color: modelData.color,
          itemStyle: {
            opacity: 0
          },
          lineStyle: {
            opacity: 0
          },
          markArea: {
            itemStyle: {
              color: modelData.color,
              opacity: 0.4
            },
            data: [...x.area.values()]
          },
        }]
      });

      return result;
    });
  }

  private createForecastHorizonTooltipFormatter(): any {
    return (params: any | Array<any>) => {
      // console.log(params);
      const paramsArray = Array.isArray(params) ? params : [params];
      if (paramsArray.every(x => x.seriesId.endsWith('-ci'))) return '';

      const content = _.reduce(paramsArray, (prev, curr) => {
        if (!prev.header) {
          prev.header = DateHelper.format(new Date(curr.axisValue))
        }

        switch (curr.seriesName) {
          case 'truth-data':
            prev.lines.push(`${curr.marker}&nbsp;${this.titlePipe.transform(this.dataFilter?.target)}:&nbsp;${NumberHelper.formatInt(curr.value[1])}`);
            break;
          default:
            // const seriesId: string = curr.seriesId;
            const value = curr.value[1];
            const ci = curr.value[2];

            let line = `${curr.marker}&nbsp;${curr.seriesName}:&nbsp;${NumberHelper.formatInt(value)}`;
            if (ci) {
              line += `&nbsp;(${NumberHelper.formatInt(ci[0])}&nbsp;-&nbsp;${NumberHelper.formatInt(ci[1])})`
            }
            prev.lines.push(line);

            break;
        }

        return prev;
      }, { header: undefined as undefined | string, lines: [] as string[] })

      // const modelLines = [...content.models.entries()].map(([key, x]) => `${x.marker}&nbsp;${key}:${NumberHelper.formatInt(x.value)}&nbsp;(${NumberHelper.formatInt(x.lower)}&nbsp;-&nbsp;${NumberHelper.formatInt(x.lower + x.upper)})`);

      return [content.header].concat(content.lines).join('<br/>');
    }
  }

  private createSeriesByForecastDate(ci: QuantileType, displayMode: ForecastByDateDisplayMode): any[] {
    const result: any[] = [];
    const forecastDateVericalLineSeries: any = {
      type: 'line',
      id: 'forecast-date-line',
      markLine: {
        animation: false,
        silent: true,
        symbol: 'none',
        label: {
          formatter: DateHelper.format(displayMode.forecastDate)
        },
        itemStyle: { color: '#555' },
        data: [
          { xAxis: displayMode.forecastDate }
        ]
      },
      markArea: {
        silent: true,
        itemStyle: {
          color: '#ccc',
          opacity: 0.5
        },
        data: [[{ xAxis: 'min', }, { xAxis: displayMode.forecastDate, }]]
      },

    }
    result.push(forecastDateVericalLineSeries);

    const forecasts = this.getVisibleForecastModels();

    if (forecasts && forecasts.length > 0) {
      const forecastSeries: any[] = _.flatMap(forecasts, modelData => {

        const seriesData = _.reduce(modelData.data, (prev, curr) => {
          if (curr.type === ForecastType.Point || curr.type === ForecastType.Observed) {
            prev.line.push({ value: [curr.target.end_date, curr.value] });

            if (curr.target.time_ahead === 0) {
              prev.lower.push({ value: [curr.target.end_date, curr.value] });
              prev.upper.push({ value: [curr.target.end_date, 0] });
            }
          }

          if (curr.type === ForecastType.Quantile && curr.quantile && curr.quantile.type === ci) {
            if (curr.quantile.point === QuantilePointType.Lower) {
              prev.lower.push({ value: [curr.target.end_date, curr.value] });
            }
            else if (curr.quantile.point === QuantilePointType.Upper) {
              const lowerPoint = _.find(modelData.data, x => {
                return x.type === ForecastType.Quantile && x.quantile && x.quantile.type === ci && x.quantile.point === QuantilePointType.Lower && x.target.time_ahead === curr.target.time_ahead
              }) as ForecastData;
              const lowerValue = lowerPoint && lowerPoint.value || 0;
              prev.upper.push({ value: [curr.target.end_date, curr.value - lowerValue] });
            }
          }
          return prev;
        }, { line: [] as any[], upper: [] as any[], lower: [] as any[] });

        const line = {
          type: 'line',
          color: modelData.color,
          id: `${this.getDataFilterId()}-${modelData.model}`,
          name: modelData.model,
          data: seriesData.line
        }

        const defaultConfBandOption = {
          type: 'line',
          lineStyle: {
            opacity: 0
          },
          id: line.id,
          name: modelData.model,
          stack: 'confidence-band - ' + modelData.model,
          color: modelData.color,
          symbol: 'none'
        };

        const lower = {
          ...defaultConfBandOption,
          id: defaultConfBandOption.id + '-confidence-lower',
          data: seriesData.lower
        }

        const upper = {
          ...defaultConfBandOption,
          id: defaultConfBandOption.id + '-confidence-upper',
          areaStyle: { color: modelData.color, opacity: 0.4 },
          data: seriesData.upper
        }

        return [line, lower, upper];
      });
      forecastSeries.forEach(x => result.push(x));
    }

    return result;
  }

  private createForecastDateTooltipFormatter(): any {
    return (params: any | Array<any>) => {
      // console.log(params);
      const paramsArray = Array.isArray(params) ? params : [params];
      const content = _.reduce(paramsArray, (prev, curr) => {
        if (!prev.header) {
          prev.header = DateHelper.format(new Date(curr.axisValue))
        }

        switch (curr.seriesName) {
          case 'truth-data':
            prev.truth = `${curr.marker}&nbsp;${this.titlePipe.transform(this.dataFilter?.target)}:&nbsp;${NumberHelper.formatInt(curr.value[1])}`;
            break;
          default:
            if (!prev.models.has(curr.seriesName)) {
              prev.models.set(curr.seriesName, { value: 0, lower: 0, upper: 0, marker: curr.marker });
            }

            const seriesId: string = curr.seriesId;
            const value = curr.value[1];
            const modelValues = prev.models.get(curr.seriesName);

            if (seriesId.endsWith('confidence-lower')) {
              modelValues!.lower = value;
            }
            else if (seriesId.endsWith('confidence-upper')) {
              modelValues!.upper = value;
            }
            else {
              modelValues!.value = value;
            }
            break;
        }

        return prev;
      }, { header: undefined as undefined | string, truth: undefined as undefined | string, models: new Map<string, { value: number; lower: number; upper: number; marker: string; }>() })

      const modelLines = [...content.models.entries()].map(([key, x]) => {
        const upper = x.lower + x.upper;
        const ci = x.lower !== upper ? `&nbsp;(${NumberHelper.formatInt(x.lower)}&nbsp;-&nbsp;${NumberHelper.formatInt(upper)})` : '';
        return `${x.marker}&nbsp;${key}:${NumberHelper.formatInt(x.value)}${ci}`
      });

      return [content.header, content.truth].filter(x => !!x).concat(modelLines).join('<br/>');
    }
  }

  private getDataFilterId() {
    return this.dataFilter ? `${this.dataFilter.target}-${this.dataFilter.location?.id || ''}` : '';
  }

  private getVisibleForecastModels(): ForecastModelData[] {
    if (this.visibleModels) {
      const visibles = this.visibleModels;
      return this.forecastModelData.filter(x => visibles.indexOf(x.model) > -1);
    }

    return this.forecastModelData;
  }
}
