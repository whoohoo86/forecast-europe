import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { environment } from './../../environments/environment';

interface RawModelNames {
  ensembleModelNames: string[];
  defaultModelNames: string[];
}

@Injectable({
  providedIn: 'root'
})
export class DefaultSettingsService {

  // private url: string = 'https://raw.githubusercontent.com/epiforecasts/covid19-forecast-hub-europe/main/viz/settings_model_selection.json';
  ensembleModelNames$: Observable<string[]>;
  defaultModelNames$: Observable<string[]>;

  constructor(private http: HttpClient) {

    const modelNames$ = this.http.get<RawModelNames>(environment.urls.defaultSettings.modelNames, { responseType: 'json' }).pipe(shareReplay(1));

    this.ensembleModelNames$ = modelNames$.pipe(map(x => x.ensembleModelNames));
    this.defaultModelNames$ = modelNames$.pipe(map(x => x.defaultModelNames));
  }
}
