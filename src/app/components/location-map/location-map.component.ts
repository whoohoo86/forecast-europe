import { Component, EventEmitter, Input, NgZone, OnChanges, OnInit, Output, SimpleChanges } from '@angular/core';
import * as L from 'leaflet';
import { MapOptions } from 'leaflet';
import { Observable, combineLatest, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { LocationLookupItem } from 'src/app/models/location-lookup';
import { ThresholdColorScale } from 'src/app/models/threshold-color-scale';
import { GeoShapeServiceService } from 'src/app/services/geo-shape-service.service';
import { LocationLookupService } from 'src/app/services/location-lookup.service';
import * as _ from 'lodash-es';
import { NumberHelper } from 'src/app/util/number-helper';

@Component({
  selector: 'app-location-map',
  templateUrl: './location-map.component.html',
  styleUrls: ['./location-map.component.scss']
})
export class LocationMapComponent implements OnInit, OnChanges {

  @Input() location?: LocationLookupItem;
  @Output() onLocationChanged: EventEmitter<LocationLookupItem> = new EventEmitter<LocationLookupItem>();

  @Input() locationValues: Map<string, number> | null = null;
  @Input() mapTitle?: string;

  options: MapOptions = {
    zoomControl: false,
    doubleClickZoom: false,
    scrollWheelZoom: false,
    dragging: false,
    zoom: 3,
    center: { lng: 9, lat: 53 },
    layers: [
      L.tileLayer('https://tiles.stadiamaps.com/tiles/alidade_smooth/{z}/{x}/{y}{r}.png', {
        maxZoom: 20,
        attribution: '&copy; <a href="https://stadiamaps.com/">Stadia Maps</a>, &copy; <a href="https://openmaptiles.org/">OpenMapTiles</a> &copy; <a href="http://openstreetmap.org">OpenStreetMap</a> contributors'
      })
    ],
  }

  private selectedLocation$ = new BehaviorSubject<LocationLookupItem | undefined>(undefined);
  private locationValues$ = new BehaviorSubject<Map<string, number> | null>(null);
  mapContext$: Observable<any>;
  // fitBounds: L.LatLngBounds = new L.LatLngBounds({ lat: -15, lng: -35 }, { lat: 45, lng: 75 });

  constructor(private geoService: GeoShapeServiceService, private locationLookupService: LocationLookupService, private zone: NgZone) {
    this.mapContext$ = combineLatest([this.geoService.euStates$, this.locationLookupService.locations$, this.selectedLocation$, this.locationValues$])
      .pipe(map(([euGeoJson, locationLu, currentLocation, locationValues]) => {
        const colorScaleIncidenceValues = locationValues ? _.map([...locationValues.entries()], ([k, x]) => {
          return (x / locationLu.get(k)!.population) * 100000;
        }) : [];
        const colorScale = new ThresholdColorScale(colorScaleIncidenceValues);

        const euLayer = L.geoJSON(euGeoJson, {
          style: (feature) => {
            const locationLookupId = this.getLookupIdByFeature(feature!)
            const featureValue = locationValues?.get(locationLookupId) || 0;
            const locationLookup = locationLu.get(locationLookupId);
            const featureIncidence = (featureValue / (locationLookup?.population || Infinity)) * 100000;
            const isSelected = locationLookupId == currentLocation?.id;
            return this.getStateStyle(isSelected, false, { fillColor: colorScale.getColor(featureIncidence) });
          },
          onEachFeature: (feature, layer: L.GeoJSON) => {
            const locationLookupId = this.getLookupIdByFeature(feature!)
            const locationLookup = locationLu.get(locationLookupId);
            const featureValue = locationValues?.get(locationLookupId) || 0;
            const featureIncidence = (featureValue / (locationLookup?.population || Infinity)) * 100000;
            const isSelected = locationLookupId == currentLocation?.id;

            layer.on('click', (x) => {
              const selected = locationLu.get(this.getLookupIdByFeature(x.target.feature));
              this.zone.run(() => { this.onLocationChanged.emit(selected); });
            });

            layer.on('mouseover', x => {
              layer.setStyle(this.getStateStyle(isSelected, true, { fillColor: colorScale.getColor(featureIncidence) }));
              setTimeout(() => layer.bringToFront());
            });

            layer.on('mouseout', x => {
              layer.setStyle(this.getStateStyle(isSelected, false, { fillColor: colorScale.getColor(featureIncidence) }))
              if (!isSelected) {
                setTimeout(() => layer.bringToBack());
              }
            });

            if (isSelected) {
              setTimeout(() => layer.bringToFront());
            }

            layer.bindTooltip(x => `${locationLookup?.name || ''}: ${NumberHelper.formatInt(featureValue)} (Incidence: ${NumberHelper.formatDecimal(featureIncidence)})`);
          }
        });
        ;
        return {
          euLayer: euLayer,
          fitBounds: euLayer.getBounds().pad(-0.2),
          center: euLayer.getBounds().getCenter(),
          colorScale: colorScale
        };
      }));
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes.location) {
      this.selectedLocation$.next(this.location);
    }
    if (changes.locationValues) {
      this.locationValues$.next(this.locationValues);
    }
  }

  ngOnInit(): void {
  }

  onMapReady(map: L.Map) {
    // setTimeout(() => map.invalidateSize(), 250);
  }

  onMapResized(layer: L.GeoJSON) {
    // this.correctedFitBounds = layer ? layer.getBounds() : undefined;
  }

  private getStateStyle(isSelected: boolean, isHovered: boolean, style: Partial<L.PathOptions> = {}): L.PathOptions {
    return {
      color: isSelected ? 'rgb(101,179,46)' : (isHovered ? '#333' : '#4e555b'),
      weight: isSelected || isHovered ? 2 : 1,

      fillColor: 'transparent',
      fillOpacity: 0.9,

      ...style
    };
  }

  private getLookupIdByFeature(feature: GeoJSON.Feature): string {
    if (feature.properties!.iso_a2 === "-99") return "FR";
    return feature.properties!.iso_a2;
  }
}
