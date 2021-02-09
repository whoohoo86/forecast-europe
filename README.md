# CovidForecastEcdc

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 11.0.2.

## Offene Fragen

- hat das ecdc einen TileService (hintergrundbilder für karte)?
- Erklärungstexte anpassen für Target

- Könnt ihr mir ein Shape, Geojson, etc. für die Länder bereitstellen? Seb guckt

- ~~Karte wieder nach Inzidenz (pro 100.000 Einwohner) einfärben, Tooltip mit Inzidenz und absolutem Wert? Beides~~
- ~~Gibt es Stylevorgaben? Farben, Logo, Corporate Design? ja farben: <https://github.com/EU-ECDC/EcdcColors>. kein drum herum wie header, logo, etc... weil via iframe eingebunden wird~~
- ~~Wie werden DefaultModels (Sichtbare Modelle zum Start) und EnsembleModels ermittelt? Neue Datei (json) im git repo mit `{
  ensembleModelNames: ['LANL-GrowthRate'],
  defaultModelNames: ['team_abc-model_def']
}`~~
- ~~Was macht das Scenario genau? Ein DropDown mit nur einem Item ohne dahinterliegender Logik fühlt sich komisch an zu implementieren und verwirrt in der Bedienung. erstmal weglassen und wenn konkret überlegen wie und wo. -> erstmal nicht einbauen~~

## TODOs

- ~~Next Prev ForecastDate~~
- ~~Play/Pause Stop ForecastDate~~
- ~~Highlight der ChartSeries on MouseOver in Legende~~
- ~~ForecastChart DataZoom restore~~
- ~~Tooltip in Chart~~
- ~~AxisClick um ForecastDate zu ändern~~
- ~~ecdc farbe (grün) für map highlight und farben in chart~~
- ~~legend item punkte mittig eingeblendete models bold text~~
- ~~Karte~~
  - ~~Länder nach gewähltem Target einfärben~~
  - ~~Popup mit Werten (Inzidenz)~~
  - ~~Title mit Target~~
- ~~Layouting und Styling~~
  - ~~Responsiveness / Resize handling~~
  - ~~Loading spinner~~
- Service um appFormat zu lesen
- GitHub CI on forecast_to_plot_csv commit -> call convertToAppFormat.py -> forecast_to_plot.json commit + push

## Development server

Run `ng serve` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Code scaffolding

Run `ng generate component component-name` to generate a new component. You can also use `ng generate directive|pipe|service|class|guard|interface|enum|module`.

## Build

Run `ng build` to build the project. The build artifacts will be stored in the `dist/` directory. Use the `--prod` flag for a production build.

## Running unit tests

Run `ng test` to execute the unit tests via [Karma](https://karma-runner.github.io).

## Running end-to-end tests

Run `ng e2e` to execute the end-to-end tests via [Protractor](http://www.protractortest.org/).

## Further help

To get more help on the Angular CLI use `ng help` or go check out the [Angular CLI Overview and Command Reference](https://angular.io/cli) page.
