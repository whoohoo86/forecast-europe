import { Directive, EventEmitter, HostListener, NgZone, Output } from '@angular/core';
import { NgxEchartsDirective } from 'ngx-echarts';
import * as _ from 'lodash-es';

@Directive({
  selector: '[onAxisPointerClick]'
})
export class EchartsZrClickDirective {

  @Output() onAxisPointerClick: EventEmitter<any> = new EventEmitter<any>();
  // id: number;

  constructor(private _chart: NgxEchartsDirective, private _zone: NgZone) {
    // this.id = _.random();
  }

  private lastEvent: any;

  @HostListener('chartInit', ["$event"])
  onEchartInit(chart: any) {
    const zr = chart.getZr();
    if (zr) {
      zr.on('click', (x: any) => {
        // console.log("ZR CLICK", x, this.lastEvent === x, this.id);
        if (x !== this.lastEvent) {
          const axisPointer = _.find(zr, (x, k) => k.indexOf("ec_inner_") > -1 && x.hasOwnProperty('axisPointerLastHighlights'));
          if (axisPointer && axisPointer.axisPointerLastHighlights) {
            const keys = _.keys(axisPointer.axisPointerLastHighlights);
            if (keys.length >= 1) {
              const indices = axisPointer.axisPointerLastHighlights[keys[0]];
              const series = chart._model.option.series[indices.seriesIndex];
              const data = series.data[indices.dataIndex];
              this._zone.run(() => this.onAxisPointerClick.emit(data));
            }
          }
        }
        this.lastEvent = x; // wenn hier nicht was auf this. gesetzt wird, dann triggeret das event 2x?!?!
      });
    }
  }

}
