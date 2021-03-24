import { Component, EventEmitter, Input, OnChanges, OnInit, Output, SimpleChanges, ViewChild } from '@angular/core';
import { MatSort } from '@angular/material/sort';
import { MatTable, MatTableDataSource } from '@angular/material/table';
import { ForecastModelData } from 'src/app/models/forecast-data';
import * as _ from 'lodash-es';

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

  @ViewChild(MatSort) sort!: MatSort;

  constructor() {
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
      // this.dataSource.data = _.flatMap(this.models, x => {
      //   let firstChar = x.model[0];
      //   firstChar = this.isUpperCase(firstChar) ? firstChar.toLowerCase() : firstChar.toUpperCase();
      //   const model = `${firstChar}${x.model.substr(1)}`;
      //   const copy = { ...x, model: model };
      //   return [x, copy]
      // }) || [];
      this.dataSource.data = this.models || [];
    }
  }

  ngOnInit(): void {
  }

  rowTrackBy(index: number, row: ForecastModelData) {
    return row.model;
  }

  isModelVisible(model: string) {
    return !!this.visibleModels && this.visibleModels.indexOf(model) > -1;
  }

  highlight(model: string | undefined) {
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
