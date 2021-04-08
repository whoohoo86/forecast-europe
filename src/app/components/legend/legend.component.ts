import { ChangeDetectorRef, Component, ComponentRef, ElementRef, EventEmitter, Input, OnChanges, OnInit, Output, QueryList, SimpleChanges, TemplateRef, ViewChild, ViewChildren, ViewContainerRef } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatRow, MatTable, MatTableDataSource } from '@angular/material/table';
import { ForecastModelData } from 'src/app/models/forecast-data';
import * as _ from 'lodash-es';
import { Observable, of } from 'rxjs';
import { ModelMetadata } from 'src/app/models/model-metadata';
import { MetadataService } from 'src/app/services/metadata.service';
import { OverlayRef, Overlay, OverlayPositionBuilder } from '@angular/cdk/overlay';
import { TemplatePortal } from '@angular/cdk/portal';
import { map } from 'rxjs/operators';

@Component({
  selector: 'app-legend',
  templateUrl: './legend.component.html',
  styleUrls: ['./legend.component.scss']
})
export class LegendComponent implements OnInit, OnChanges {

  @Input() models?: ForecastModelData[];
  @Input() visibleModels: string[] | null = null;
  @Output() visibleModelsChanged = new EventEmitter<string[]>();
  @Output() highlightModel = new EventEmitter<string>();
  @Output() stopHighlightModel = new EventEmitter<void>();

  dataSource: MatTableDataSource<ForecastModelData>;
  displayedColumns = ['color', 'model', 'visibility'];

  private overlayRef?: OverlayRef;
  tooltipContext$: Observable<{ metadata: ModelMetadata, row: ForecastModelData } | undefined> = of(undefined);

  @ViewChild('tooltip') tooltipPortalContent!: TemplateRef<unknown>;
  @ViewChild(MatSort) sort!: MatSort;

  constructor(private elementRef: ElementRef, private viewContainerRef: ViewContainerRef, private overlay: Overlay, private overlayPositionBuilder: OverlayPositionBuilder, private metadataService: MetadataService) {
    this.dataSource = new MatTableDataSource();

    this.dataSource.sortingDataAccessor = (row, colName) => {
      if (colName === 'visibility') {
        return this.isModelVisible(row.model) ? '0' : '1';
      }
      if (colName === 'model') {
        return `${row.model.toLocaleLowerCase()}${this.isUpperCase(row.model[0]) ? '' : '_'}`;
      }

      return (<any>row)[colName];
    }
  }

  ngAfterViewInit() {
    this.dataSource.sort = this.sort;
  }

  private isUpperCase(value: string) {
    return value === value.toUpperCase();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.models) {
      this.dataSource.data = this.models || [];
    }
  }

  ngOnInit(): void {

    this.overlayRef = this.overlay.create();
  }

  rowTrackBy(index: number, row: ForecastModelData) {
    return row.model;
  }

  isModelVisible(model: string) {
    return !!this.visibleModels && this.visibleModels.indexOf(model) > -1;
  }

  onMouseEnter(row: ForecastModelData, event: MouseEvent) {
    this.highlight(row.model);

    this.canCloseTooltip = false;
    this.showTooltip(row, event.target);
  }

  onMouseOut(row: ForecastModelData, event: any) {
    this.highlight(undefined);

    this.canCloseTooltip = true;
    this.hideTooltip();
  }

  showTooltip(row: ForecastModelData | undefined, atElement: any) {
    this.tooltipContext$ = row !== undefined
      ? this.metadataService.getModelMetadata(row.model).pipe(map(x => {
        if (x === undefined) return undefined;
        return { metadata: x, row };
      }))
      : of(undefined);

    if (this.overlayRef) {
      const positionStrategy = this.overlayPositionBuilder
        .flexibleConnectedTo(atElement)
        .withPositions([
          { originX: 'center', originY: 'top', overlayX: 'center', overlayY: 'bottom' },
          { originX: 'center', originY: 'bottom', overlayX: 'center', overlayY: 'top' }
        ]);
      this.overlayRef.updatePositionStrategy(positionStrategy);

      if (!this.overlayRef.hasAttached()) {
        const tooltipPortal = new TemplatePortal(this.tooltipPortalContent, this.viewContainerRef);
        this.overlayRef.attach(tooltipPortal);
      }
    }
  }

  hideTooltip() {
    setTimeout(() => {
      const closed = this.closeTooltip();
      if (!closed) {
        this.hideTooltip();
      }
    }, 500);
  }

  canCloseTooltip = true;

  private closeTooltip() {
    if (this.canCloseTooltip && this.overlayRef && this.overlayRef.hasAttached()) {
      this.overlayRef.detach();
      return true;
    }
    return false;
  }

  private highlight(model: string | undefined) {
    if (model === undefined) {
      this.stopHighlightModel.emit();
    } else {
      this.highlightModel.emit(model);
    }
  }

  changeModelVisibility(model: string) {
    const models = this.visibleModels || [];
    const index = models.indexOf(model);
    if (index > -1) {
      this.visibleModelsChanged.emit(models.filter(x => x !== model));
    } else {
      this.visibleModelsChanged.emit([...models, model]);
    }
  }


}
