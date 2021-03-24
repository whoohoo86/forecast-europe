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
import { ForecastDataSerivce } from './services/forecast-data.service';
import { ForecastCsvDataService } from './services/forecast-csv-data.service';
import { ForecastJsonDataService } from './services/forecast-json-data.service';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';
import { ScaffoldComponent } from './scaffold/scaffold.component';
import { LayoutModule } from '@angular/cdk/layout';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatButtonModule } from '@angular/material/button';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatIconModule } from '@angular/material/icon';
import { MatListModule } from '@angular/material/list';
import { MatCardModule } from '@angular/material/card';
import { MatGridListModule } from '@angular/material/grid-list';
import { MatMenuModule } from '@angular/material/menu';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatSelectModule } from '@angular/material/select';
import { CdkScrollableModule } from '@angular/cdk/scrolling'
import { MatTabsModule } from '@angular/material/tabs';
import { MatTableModule } from '@angular/material/table';
import { MatSortModule } from '@angular/material/sort';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatExpansionModule } from '@angular/material/expansion';
import { ForecastSettingComponent } from './components/forecast-setting/forecast-setting.component';
import { LegendComponent } from './components/legend/legend.component';
import { DateToPrevSaturdayPipe } from './pipes/date-to-prev-saturday.pipe';
import { CdkScrollableExtDirective } from './directives/cdk-scrollable-ext.directive';
import { TargetLabelPipe } from './pipes/target-label.pipe';

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
    LoadingSpinnerComponent,
    ScaffoldComponent,
    ForecastSettingComponent,
    LegendComponent,
    DateToPrevSaturdayPipe,
    CdkScrollableExtDirective,
    TargetLabelPipe
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
    BrowserAnimationsModule,
    LayoutModule,
    MatToolbarModule,
    MatButtonModule,
    MatSidenavModule,
    MatIconModule,
    MatListModule,
    MatCardModule,
    MatGridListModule,
    MatMenuModule,
    MatButtonToggleModule,
    MatSelectModule,
    CdkScrollableModule,
    MatTabsModule,
    MatExpansionModule,
    MatTableModule,
    MatSortModule,
    MatCheckboxModule
  ],
  providers: [
    // { provide: ForecastDataSerivce, useClass: ForecastCsvDataService },
    { provide: ForecastDataSerivce, useClass: ForecastJsonDataService },
  ],
  bootstrap: [AppComponent]
})
export class AppModule { }
