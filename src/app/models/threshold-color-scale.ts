import * as d3scale from 'd3-scale';
import * as _ from 'lodash-es';

export interface ThresholdColorScale {
  getThresholds(): number[];
  getColor(value: number): string;
}

export class MinMaxLinearThresholdColorScale implements ThresholdColorScale {
  private _innerScale?: d3scale.ScaleQuantize<string>;

  constructor(values: number[]) {
    this._innerScale = this.createInnerScale(values);
  }

  private colors = ['#eee', '#ccc', '#aaa', '#888', '#666', '#444'];


  private createInnerScale(values: number[]) {
    if (values && values.length > 0) {
      return d3scale.scaleQuantize<string>().domain([_.min(values)!, _.max(values)!]).range(this.colors);
    }
    return undefined;
  }

  getThresholds(): number[] {
    return this._innerScale ? (<any>this._innerScale).thresholds() : [];
  }

  getColor(value: number): string {
    return !this._innerScale || value <= 0 ? '#fff' : this._innerScale(value);
  }


}

export class FixedLinearThresholdColorScale implements ThresholdColorScale {
  private _innerScale?: d3scale.ScaleThreshold<number, string, never>;

  constructor(data?: { values: number[], colors: string[] }) {
    // valueColors = valueColors || this.defaultValueColors;
    data = data || this.defaultData;

    this._innerScale = this.createInnerScale(data.values, data.colors);
  }

  private defaultData = {
    values: [50, 100, 150, 200, 250, 300, 350],
    colors:
      [
        '#E2F4F1',
        '#B9E0E4',
        '#91BDD4',
        '#688DC5',
        '#3f51b5',
        '#433992',
        '#493271',
        '#422852',
      ]
    // values: [50, 100, 150, 200, 250, 300, 350, 351],
    // colors: ['green', 'lightgreen', 'yellow', 'orange', 'lightred', 'red','darkred', 'pink', 'blue']
  };
  // private colors = [ '#6779df', '#6071d1', '#3f51b5' ]; //['#eee', '#ccc', '#aaa', '#888', '#666', '#444'];


  private createInnerScale(domain: number[], range: string[]) {
    if (domain && domain.length > 0 && range && range.length > 0) {
      // const reduced = _.reduce(valueColors, (prev, curr) => {
      //   const [value, color] = curr;
      //   prev.domain.push(value);
      //   prev.range.push(color);
      //   return prev;
      // }, { domain: [] as number[], range: [] as string[] });
      return d3scale.scaleThreshold<number, string>().domain(domain).range(range);
    }
    return undefined;
  }

  getThresholds(): number[] {
    return this._innerScale ? this._innerScale.domain() : [];
  }

  getColor(value: number): string {
    return !this._innerScale || value <= 0 ? '#fff' : this._innerScale(value);
  }

}
