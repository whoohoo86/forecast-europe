import { BrowserModule } from '@angular/platform-browser';
import { NgModule } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';

import { AppRoutingModule } from './app-routing.module';
import { AppComponent } from './app.component';
import { LocationMapComponent } from './components/location-map/location-map.component';
import { LeafletModule } from '@asymmetrik/ngx-leaflet';
import { FontAwesomeModule } from '@fortawesome/angular-fontawesome';
import { NgxEchartsModule } from 'ngx-echarts';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { SettingsSelectionComponent } from './components/settings-selection/settings-selection.component';
import { FormsModule } from '@angular/forms';
import { ForecastComponent } from './pages/forecast/forecast.component';
import { ForecastChartWithLegendComponent } from './components/forecast-chart-with-legend/forecast-chart-with-legend.component';
import { ForecastChartComponent } from './components/forecast-chart/forecast-chart.component';
import { LeafletExtentionDirective } from './directives/leaflet-extention.directive';
import { EchartsZrClickDirective } from './directives/echarts-zr-click.directive';
import { HoverClassDirective } from './directives/hover-class.directive';
import { LoadingSpinnerComponent } from './components/loading-spinner/loading-spinner.component';

@NgModule({
  declarations: [
    AppComponent,
    LocationMapComponent,
    SettingsSelectionComponent,
    ForecastComponent,
    ForecastChartWithLegendComponent,
    ForecastChartComponent,
    LeafletExtentionDirective,
    EchartsZrClickDirective,
    HoverClassDirective,
    LoadingSpinnerComponent
  ],
  imports: [
    BrowserModule,
    FormsModule,
    HttpClientModule,
    AppRoutingModule,
    LeafletModule,
    FontAwesomeModule,
    NgbModule,
    NgxEchartsModule.forRoot({
      /**
       * This will import all modules from echarts.
       * If you only need custom modules,
       * please refer to [Custom Build] section.
       */
      echarts: () => import('echarts'), // or import('./path-to-my-custom-echarts')
    }),
  ],
  providers: [],
  bootstrap: [AppComponent]
})
export class AppModule { }
