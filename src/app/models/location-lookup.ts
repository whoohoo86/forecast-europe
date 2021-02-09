import * as _ from 'lodash-es';

export interface LocationLookupItem {
  id: string;
  name: string;
  population: number;
}

export class LocationLookup {
  items: LocationLookupItem[];

  constructor(items: LocationLookupItem[]) {
    this.items = [...items];
  }

  get(id: string) {
    return _.find(this.items, { id });
  }
}
