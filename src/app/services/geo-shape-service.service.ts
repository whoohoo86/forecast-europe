import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { shareReplay } from 'rxjs/operators';
import { environment } from './../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class GeoShapeServiceService {

  private readonly euStatesUrl = '/assets/european-union-countries.geojson';
  euStates$: Observable<GeoJSON.FeatureCollection>;

  constructor(private http: HttpClient) {
    this.euStates$ = this.http.get<GeoJSON.FeatureCollection>(environment.base_href + this.euStatesUrl).pipe(shareReplay(1));
  }
}
