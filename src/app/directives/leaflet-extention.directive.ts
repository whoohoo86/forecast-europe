import { EventEmitter, NgZone, OnDestroy, Output, TemplateRef } from '@angular/core';
import { Directive, Input, OnChanges, OnInit, SimpleChanges } from '@angular/core';
import { LeafletDirective } from '@asymmetrik/ngx-leaflet';
import { Control, DomUtil, Map, ResizeEvent } from 'leaflet';
import * as _ from 'lodash-es';
import { ThresholdColorScale } from '../models/threshold-color-scale';
import { NumberHelper } from '../util/number-helper';

@Directive({
  selector: '[appLeafletExtention]'
})
export class LeafletExtentionDirective implements OnInit, OnChanges, OnDestroy {

  @Input() colorScaleHeader?: string;
  @Input() colorScale?: ThresholdColorScale;
  @Input() mapTitle?: string;
  @Output() tooltipVisibilityChanged: EventEmitter<boolean> = new EventEmitter<boolean>();
  @Output() resized: EventEmitter<ResizeEvent> = new EventEmitter<ResizeEvent>();

  private readonly delayedResizeEmit = _.debounce((x) => this.zone.run(() => this.resized.emit(x)), 80);
  private readonly delayedTTVisibilityEmit = _.debounce((x) => this.zone.run(() => this.tooltipVisibilityChanged.emit(x)), 80);

  private readonly onTTOpen = () => { this.zone.run(() => this.delayedTTVisibilityEmit(true)); };
  private readonly onTTClose = () => { this.zone.run(() => this.delayedTTVisibilityEmit(false)); };

  constructor(private leaflet: LeafletDirective, private zone: NgZone) { }

  ngOnInit(): void {
    this.leaflet.map.whenReady(() => {
      this.registerEvents(this.leaflet.map);
      this.updateAll(this.leaflet.map);
    });
  }

  ngOnDestroy(): void {
    if (this.leaflet.map) {
      this.leaflet.map.off('resize', this.delayedResizeEmit);
      this.leaflet.map.off('tooltipopen', this.onTTOpen);
      this.leaflet.map.off('tooltipclose', this.onTTClose);
    }
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.colorScale || changes.colorScaleHeader) {
      this.updateLegend(this.leaflet.map, this.colorScale, this.colorScaleHeader);
    }
    if (changes.mapTitle) {
      this.updateTitle(this.leaflet.map, this.mapTitle);
    }
  }

  private titleControl: Control | null = null;
  private updateTitle(map: Map, title?: string) {
    if (this.titleControl) {
      this.titleControl.remove();
      this.titleControl = null;
    }

    if (map && title !== undefined) {
      const titleControl = new Control({ position: 'topleft' });
      titleControl.onAdd = (map) => {
        const div = DomUtil.create('div', 'info title');
        div.innerHTML = title;
        return div;
      };
      titleControl.addTo(map);
      this.titleControl = titleControl;
    }
  }

  private registerEvents(map: Map) {
    map.on('resize', this.delayedResizeEmit);
    map.on('tooltipopen', this.onTTOpen);
    map.on('tooltipclose', this.onTTClose);
  }

  private createIntLegendItems(scale: ThresholdColorScale) {
    const thresholds = scale?.getThresholds();
    if (!thresholds || thresholds.length === 0) return [];

    const areAllValuesInt = thresholds.every(x => Number.isInteger(x));
    //.map(x => Math.ceil(x))
    return [1, ...thresholds].map((grade, index, array) => {
      let label = '';
      if (index === array.length - 1) {
        label = NumberHelper.format(array[index]) + '+';
      } else if (array[index] === array[index + 1] - 1) {
        label = NumberHelper.format(array[index]) + '';
      } else {
        label = NumberHelper.format(array[index]) + ' - ' + NumberHelper.format(array[index + 1] - (areAllValuesInt ? 1 : 0.01));
      }
      return { grade, label };
    });
  }

  private legend: Control | null = null;
  private updateLegend(map: Map, scale?: ThresholdColorScale, header?: string) {
    if (this.legend) {
      this.legend.remove();
      this.legend = null;
    }

    if (map && scale) {
      const legend = new Control({ position: 'bottomleft' });
      const gradeLabels = this.createIntLegendItems(scale);
      legend.onAdd = (map) => {
        const div = DomUtil.create('div', 'info legend');

        let innerHtml = '';
        if (header) {
          innerHtml += `<div class="legend-header">${header}</div>`;
        }

        innerHtml += '<div class="legend-item-container">'
        innerHtml += this.createLegendItem('0', scale.getColor(0));
        gradeLabels.forEach((item) => {
          innerHtml += this.createLegendItem(item.label, scale.getColor(item.grade));
        });
        innerHtml += '</div>'

        div.innerHTML = innerHtml;
        return div;
      };
      legend.addTo(map);
      this.legend = legend;
    }
  }

  private createLegendItem(label: string, color: string) {
    return `
    <div class="legend-item">
      <div class="legend-block" style="background: ${color}"></div>
      <div class="legend-label">${label}</div>
    </div>`;
  }

  private updateAll(map: Map): void {
    this.updateLegend(map, this.colorScale, this.colorScaleHeader);
    this.updateTitle(map, this.mapTitle);
  }
}
