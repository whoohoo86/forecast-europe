import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { map, shareReplay } from 'rxjs/operators';
import { ModelMetadata } from '../models/model-metadata';
import { environment } from './../../environments/environment';

interface RawModelMetadata {
  team_name: string;
  model_name: string;
  model_abbr: string;
  model_contributors: string;
  website_url: string;
  methods_long: string;
  methods: string;
}

interface RawModelMetadataDict {
  [key: string]: RawModelMetadata
}

@Injectable({
  providedIn: 'root'
})
export class MetadataService {

  private metadataByModel$ = this.http.get<RawModelMetadataDict>(environment.urls.metadata).pipe(shareReplay(1));

  constructor(private http: HttpClient) { }

  getModelMetadata(id: string): Observable<ModelMetadata | undefined> {
    return this.metadataByModel$.pipe(map(x => {
      if (!x.hasOwnProperty(id)) {
        return undefined;
      }

      const rawData = x[id];

      return {
        id: rawData.model_abbr,
        team: rawData.team_name,
        contributors: rawData.model_contributors,

        model: rawData.model_name,
        descriptionShort: rawData.methods,
        description: rawData.methods_long,

        website: rawData.website_url
      };
    })).pipe(shareReplay(1));
  }
}
