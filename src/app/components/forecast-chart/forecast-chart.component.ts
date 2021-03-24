import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import { ECharts, EChartsOption, SeriesOption, TooltipComponentOption } from 'echarts';
import { ChartDataView, ForecastByDateDisplayMode, ForecastByHorizonDisplayMode, ForecastData, ForecastDataFilter, ForecastDisplayMode, ForecastDisplaySettings, ForecastModelData, ForecastType, QuantilePointType, QuantileType } from 'src/app/models/forecast-data';
import { TruthData } from 'src/app/models/truth-data';
import * as _ from 'lodash-es';
import { addDays, addMinutes } from 'date-fns';
import { DateHelper } from 'src/app/util/date-helper';
import { TitleCasePipe } from '@angular/common';
import { NumberHelper } from 'src/app/util/number-helper';
import { stringify } from '@angular/compiler/src/util';
import { ForecastTarget } from 'src/app/models/forecast-target';
import { LocationLookupItem } from 'src/app/models/location-lookup';
import { DateToPrevSaturdayPipe } from 'src/app/pipes/date-to-prev-saturday.pipe';
import { TargetLabelPipe } from 'src/app/pipes/target-label.pipe';

@Component({
  selector: 'app-forecast-chart',
  templateUrl: './forecast-chart.component.html',
  styleUrls: ['./forecast-chart.component.scss']
})
export class ForecastChartComponent implements OnInit, OnChanges {

  @Input() visibleModels: string[] | null = null;
  @Input() dataView: ChartDataView | null = null;

  @Output() onForecastDateChanged = new EventEmitter<Date>();

  private targetLabelPipe = new TargetLabelPipe();
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
      nameGap: 50,
      min: 0,
      scale: true,
    },
    tooltip: {
      trigger: 'axis' as 'axis',
      axisPointer: { show: true },
      formatter: undefined as any
    },
    dataZoom: [
      { type: 'inside', start: 80, end: 100, filterMode: 'weakFilter' as 'weakFilter' },
      { type: 'slider', start: 80, end: 100, filterMode: 'weakFilter' as 'weakFilter' },
    ],
    animationDuration: 500,
    series: []
  };

  chartOption?: EChartsOption;

  private updateChartOptionDebounced = _.debounce(() => { this.updateChartOption() }, 100);
  private dataZoomState?: { start: any, end: any };
  private chart?: ECharts;

  constructor() {

  }

  ngOnInit(): void {
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (!this.chartOption) {
      this.updateChartOptionDebounced();
    } else {
      this.updateChartOption();
    }
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
    this.onForecastDateChanged.emit(event[0]);
  }

  private highlightedModel?: string;

  highlight(model: string) {
    if (this.chart && this.highlightedModel !== model) {
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

    if (this.dataView) {
      newChartOption.yAxis.name = this.targetLabelPipe.transform(this.dataView.filter.target);

      if (this.dataView.truthData) {
        const reducedTruth = _.reduce(this.dataView.truthData, (prev, curr) => {
          prev.maxDate = !prev.maxDate ? curr.date : (curr.date > prev.maxDate ? curr.date : prev.maxDate);
          prev.data.push([curr.date, curr.value]);
          return prev;
        }, { maxDate: undefined as undefined | Date, data: [] as any[] })

        newSeries.push({
          type: 'line',
          name: 'truth-data',
          id: `${this.getDataFilterId()}-truth-data`,
          data: reducedTruth.data,
          color: '#333',
          symbolSize: 6
        });

        if (reducedTruth.maxDate) {
          (<any>newChartOption.xAxis).max = addDays(reducedTruth.maxDate, 35);
        }

      }

      let seriesByDisplayMode: any[] = [];
      if (this.dataView.displaySettings.displayMode.$type === 'ForecastByDateDisplayMode') {
        seriesByDisplayMode = this.createSeriesByForecastDate(this.dataView.displaySettings.confidenceInterval, this.dataView.displaySettings.displayMode);
        (<any>newChartOption).tooltip.formatter = this.createForecastDateTooltipFormatter();
      }
      else if (this.dataView.displaySettings.displayMode.$type === 'ForecastByHorizonDisplayMode') {
        seriesByDisplayMode = this.createSeriesByForecastHorizon(this.dataView.displaySettings.confidenceInterval, this.dataView.displaySettings.displayMode);
        (<any>newChartOption).tooltip.formatter = this.createForecastHorizonTooltipFormatter();
      }
      seriesByDisplayMode.forEach(x => newSeries.push(x));

    }

    console.log("CHARTOPTIONS", newChartOption);
    this.chartOption = newChartOption;
  }

  // TODO: refactor seriesData erzeugung um neuen serien zu entsprechen + area wieder mit in tooltip
  private createSeriesByForecastHorizon(ci: QuantileType | undefined, displayMode: ForecastByHorizonDisplayMode): any[] {
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

      const a = _.flatMap([...seriesData.values()], (x, i, array) => {
        console.log("line", x.line);
        if (i === 0) {
          const p1 = [x.line[1].value[0], x.line[1].value[1]];
          const oldDate = p1[0];
          p1[0] = addMinutes(p1[0], -1);
          return [x.line[0], { value: p1 }, { value: [oldDate, null] }, { area: [...x.area.values()] }];
        }
        if (i === array.length - 1) {
          const p0 = [x.line[0].value[0], x.line[0].value[1]];
          p0[0] = addMinutes(p0[0], 1);
          return [{ value: p0 }, x.line[1], { area: [...x.area.values()] }];
        }

        const p0 = [x.line[0].value[0], x.line[0].value[1]];
        p0[0] = addMinutes(p0[0], 1);

        const p1 = [x.line[1].value[0], x.line[1].value[1]];
        const oldDate = p1[0];
        p1[0] = addMinutes(p1[0], -1);

        return [{ value: p0 }, { value: p1 }, { value: [oldDate, null] }, { area: [...x.area.values()] }];
      });

      console.log("A", a);
      const id = `${this.getDataFilterId()}-${modelData.model}`

      const result = [
        {
          type: 'line',
          name: modelData.model,
          id: id,
          data: a.filter(x => x.hasOwnProperty('value')).map(l => {
            // const area = x.area.get(l.value[0].toISOString());
            // return { value: [l.value[0], l.value[1], area?.map(a => a.yAxis) || undefined] };
            return { value: l.value }
          }),
          color: modelData.color,
          emphasis: {
            focus: 'series',
            // blurScope: 'global'
          },
          markArea: {
            itemStyle: {
              color: modelData.color,
              opacity: 0.4
            },
            data: _.flatMap(a.filter(x => x.hasOwnProperty('area')), x => {
              return x.area;
            })
          },
          symbolSize: 6
        },
        {
          type: 'line',
          name: modelData.model,
          id: `${id}-ci`,
          data: _.flatMap(a.filter(x => x.hasOwnProperty('area')), x => {
            return _.flatMap(x.area, ([d0, d1]: [any, any]) => [{ value: [d0.xAxis, d0.yAxis] }, { value: [d1.xAxis, d1.yAxis] }]);
          }),
          // data: _.flatMap(a.filter(x => x.hasOwnProperty('area')), ([d0, d1]) => [{ value: [d0.xAxis, d0.yAxis] }, { value: [d1.xAxis, d1.yAxis] }]),
          // silent: true,
          // symbol: 'none',
          color: modelData.color,
          // emphasis: {
          //   focus: 'self'
          // },
          itemStyle: {
            opacity: 0
          },
          lineStyle: {
            opacity: 0
          },
          // markArea: {
          //   itemStyle: {
          //     color: modelData.color,
          //     opacity: 0.4
          //   },
          //   data: [...x.area.values()]
          // },
        }
      ];

      // const result = _.flatMap([...seriesData.values()], (x, i) => {
      //   const id = `${this.getDataFilterId()}-${modelData.model}-${i}`
      //   return [{
      //     type: 'line',
      //     name: modelData.model,
      //     id: id,
      //     data: x.line.map(l => {
      //       const area = x.area.get(l.value[0].toISOString());
      //       return { value: [l.value[0], l.value[1], area?.map(a => a.yAxis) || undefined] };
      //     }),
      //     color: modelData.color,
      //     emphasis: {
      //       // focus: 'series',
      //       // blurScope: 'global'
      //     },
      //     symbolSize: 6
      //   },
      //   {
      //     type: 'line',
      //     name: modelData.model,
      //     id: `${id}-ci`,
      //     data: _.flatMap([...x.area.values()], ([d0, d1]) => [{ value: [d0.xAxis, d0.yAxis] }, { value: [d1.xAxis, d1.yAxis] }]),
      //     silent: true,
      //     symbol: 'none',
      //     color: modelData.color,
      //     // emphasis: {
      //     //   focus: 'self'
      //     // },
      //     itemStyle: {
      //       opacity: 0
      //     },
      //     lineStyle: {
      //       opacity: 0
      //     },
      //     markArea: {
      //       itemStyle: {
      //         color: modelData.color,
      //         opacity: 0.4
      //       },
      //       data: [...x.area.values()]
      //     },
      //   }]
      // });

      console.log("series", result);
      return result;
    });
  }

  // private createSeriesByForecastHorizon(ci: QuantileType | undefined, displayMode: ForecastByHorizonDisplayMode): any[] {
  //   const forecasts = this.getVisibleForecastModels();
  //   if (!forecasts || forecasts.length === 0) {
  //     return [];
  //   }

  //   return _.flatMap(forecasts, modelData => {
  //     const seriesData = _.reduce(modelData.data, (prev, curr) => {
  //       const timezeroStr = curr.timezero.toISOString();
  //       if (curr.type === ForecastType.Point && curr.target.time_ahead === displayMode.weeksAhead || curr.type === ForecastType.Observed) {
  //         if (!prev.has(timezeroStr)) {
  //           prev.set(timezeroStr, { line: [], area: new Map() })
  //         }
  //         prev.get(timezeroStr)!.line.push({ value: [curr.target.end_date, curr.value] });
  //       } else if (curr.type === ForecastType.Quantile && curr.target.time_ahead === displayMode.weeksAhead && curr.quantile && curr.quantile.type === ci) {
  //         if (!prev.has(timezeroStr)) {
  //           prev.set(timezeroStr, { line: [], area: new Map() })
  //         }

  //         if (!prev.get(timezeroStr)!.area.has(curr.target.end_date.toISOString())) {
  //           prev.get(timezeroStr)!.area.set(curr.target.end_date.toISOString(), [{ xAxis: undefined, yAxis: undefined }, { xAxis: undefined, yAxis: undefined }]);
  //         }

  //         const mapEntry = prev.get(timezeroStr)!.area.get(curr.target.end_date.toISOString())!;
  //         if (curr.quantile.point === QuantilePointType.Lower) {
  //           mapEntry[0].xAxis = addDays(curr.target.end_date, -3);
  //           mapEntry[0].yAxis = curr.value;
  //         } else if (curr.quantile.point === QuantilePointType.Upper) {
  //           mapEntry[1].xAxis = addDays(curr.target.end_date, 3);
  //           mapEntry[1].yAxis = curr.value;
  //         }
  //       }
  //       return prev;
  //     }, new Map<string, { line: any[], area: Map<string, [any, any]> }>());

  //     const result = _.flatMap([...seriesData.values()], (x, i) => {
  //       const id = `${this.getDataFilterId()}-${modelData.model}-${i}`
  //       return [{
  //         type: 'line',
  //         name: modelData.model,
  //         id: id,
  //         data: x.line.map(l => {
  //           const area = x.area.get(l.value[0].toISOString());
  //           return { value: [l.value[0], l.value[1], area?.map(a => a.yAxis) || undefined] };
  //         }),
  //         color: modelData.color,
  //         emphasis: {
  //           // focus: 'series',
  //           // blurScope: 'global'
  //         },
  //         symbolSize: 6
  //       },
  //       {
  //         type: 'line',
  //         name: modelData.model,
  //         id: `${id}-ci`,
  //         data: _.flatMap([...x.area.values()], ([d0, d1]) => [{ value: [d0.xAxis, d0.yAxis] }, { value: [d1.xAxis, d1.yAxis] }]),
  //         silent: true,
  //         symbol: 'none',
  //         color: modelData.color,
  //         // emphasis: {
  //         //   focus: 'self'
  //         // },
  //         itemStyle: {
  //           opacity: 0
  //         },
  //         lineStyle: {
  //           opacity: 0
  //         },
  //         markArea: {
  //           itemStyle: {
  //             color: modelData.color,
  //             opacity: 0.4
  //           },
  //           data: [...x.area.values()]
  //         },
  //       }]
  //     });

  //     console.log("series", result);
  //     return result;
  //   });
  // }

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
            prev.truthLine = `${curr.marker}&nbsp;${this.targetLabelPipe.transform(this.dataView!.filter.target)}:&nbsp;${NumberHelper.formatInt(curr.value[1])}`;
            break;
          default:
            const value = curr.value[1];
            const ci = curr.value[2];

            let line = `${curr.marker}&nbsp;${curr.seriesName}:&nbsp;${NumberHelper.formatInt(value)}`;
            if (ci) {
              line += `&nbsp;(${NumberHelper.formatInt(ci[0])}&nbsp;-&nbsp;${NumberHelper.formatInt(ci[1])})`
            }
            prev.fc_lines.push({ line, value });

            break;
        }

        return prev;
      }, { header: undefined as undefined | string, truthLine: undefined as undefined | string, fc_lines: [] as { line: string; value: number }[] })

      const lines = [content.header];
      if (content.truthLine) {
        lines.push(content.truthLine);
      }

      return lines.concat(_.orderBy(content.fc_lines, 'value', 'desc').map(x => x.line)).join('<br/>');
    }
  }

  private forecastDateCorrector = new DateToPrevSaturdayPipe();

  private createSeriesByForecastDate(ci: QuantileType | undefined, displayMode: ForecastByDateDisplayMode): any[] {
    const result: any[] = [];
    const correctedForecastDate = this.forecastDateCorrector.transform(displayMode.forecastDate);

    const forecastDateVericalLineSeries: any = {
      type: 'line',
      id: 'forecast-date-line',
      markLine: {
        animation: false,
        silent: true,
        symbol: 'none',
        label: {
          formatter: DateHelper.format(correctedForecastDate)
        },
        itemStyle: { color: '#555' },
        data: [
          { xAxis: correctedForecastDate }
        ]
      },
      markArea: {
        silent: true,
        itemStyle: {
          color: '#ccc',
          opacity: 0.5
        },
        data: [[{ xAxis: 'min', }, { xAxis: correctedForecastDate, }]]
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
          data: seriesData.line,
          emphasis: {
            focus: 'series'
          },
          symbolSize: 6
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
            prev.truth = `${curr.marker}&nbsp;${this.targetLabelPipe.transform(this.dataView!.filter.target)}:&nbsp;${NumberHelper.formatInt(curr.value[1])}`;
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

      const modelLines = _.orderBy([...content.models.entries()], ([key, x]) => x.value, 'desc').map(([key, x]) => {
        const upper = x.lower + x.upper;
        const ci = x.lower !== upper ? `&nbsp;(${NumberHelper.formatInt(x.lower)}&nbsp;-&nbsp;${NumberHelper.formatInt(upper)})` : '';
        return `${x.marker}&nbsp;${key}:&nbsp;${NumberHelper.formatInt(x.value)}${ci}`
      });

      return [content.header, content.truth].filter(x => !!x).concat(modelLines).join('<br/>');
    }
  }

  private getDataFilterId() {
    return this.dataView ? `${this.dataView.filter.target}-${this.dataView.filter.location.id || ''}` : '';
  }

  private getVisibleForecastModels(): ForecastModelData[] {
    const data = this.dataView ? this.dataView.forecasts : [];
    if (this.visibleModels) {
      const visibles = this.visibleModels;
      return data.filter(x => visibles.indexOf(x.model) > -1);
    }

    return data;
  }
}
