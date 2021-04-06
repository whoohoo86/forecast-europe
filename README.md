# CovidForecastEcdc

This project was generated with [Angular CLI](https://github.com/angular/angular-cli) version 11.0.2.

## Offene Fragen

- ~~hat das ecdc einen TileService (hintergrundbilder für karte)?~~
- ~~Wie sollen Modellfarben bestimmt werden?~~
- ~~Location by ip -> externer call. ist das ok oder lieber nicht?~~

- ~~Könnt ihr mir ein Shape, Geojson, etc. für die Länder bereitstellen? Seb guckt~~

- ~~Karte wieder nach Inzidenz (pro 100.000 Einwohner) einfärben, Tooltip mit Inzidenz und absolutem Wert? Beides~~
- ~~Gibt es Stylevorgaben? Farben, Logo, Corporate Design? ja farben: <https://github.com/EU-ECDC/EcdcColors>. kein drum herum wie header, logo, etc... weil via iframe eingebunden wird~~
- ~~Wie werden DefaultModels (Sichtbare Modelle zum Start) und EnsembleModels ermittelt? Neue Datei (json) im git repo mit `{
  ensembleModelNames: ['LANL-GrowthRate'],
  defaultModelNames: ['team_abc-model_def']
}`~~
- ~~Was macht das Scenario genau? Ein DropDown mit nur einem Item ohne dahinterliegender Logik fühlt sich komisch an zu implementieren und verwirrt in der Bedienung. erstmal weglassen und wenn konkret überlegen wie und wo. -> erstmal nicht einbauen~~

## TODOs

- ~~Map~~
  - ~~Hover nicht total sonder letzte Woche (cases/deaths last week)~~
  - ~~Bug in Firefox map hover popup~~
- ~~Legend~~
  - ~~Hover highlight punkte größer machen => anderes highlighting gewählt~~
  - ~~Sortierung in Tabelle nicht casesensitiv (Großbuchstaben zuerst)~~
- ~~Chart~~
  - ~~y-axis mit scale=true, datazoom filter~~
- ~~Demoseite mit eingebettetem IFrame (height 100%)~~
- ~~Tooltips für Modelle~~
  - ~~Hi @fabian , es gab ja noch die offene Frage bzgl Tooltips mit Modell-Infos für die Legende. Daniel hat hier: <https://github.com/epiforecasts/covid19-forecast-hub-europe/blob/main/viz/metadata.json> ein JSON angelegt, in dem alle Metadaten verfügbar sind. Damit könntest du (sobald du mal wieder ein kleines Zeitfenster hast) ein Tooltip aufsetzen. Das Feld "methods" sollte auf jeden Fall rein. Je nach dem, wie aufwändig du das gestalten magst könnten noch "team_name" und "model_name" rein sowie evtl "data_inputs" und "website_url". Die Beispiele, die du gezeigt hast sahen gut aus, wenn du in die Richtung was machen könntest wäre das super. Danke & erst einmal ein schönes Wochenende!~~
- ~~Small Display Layout~~
- ~~andere geo codes nutzen~~
  - ~~<https://raw.githubusercontent.com/epiforecasts/covid19-forecast-hub-europe/main/viz/location_codes.csv> in dieses ändern: <https://raw.githubusercontent.com/epiforecasts/covid19-forecast-hub-europe/main/data-locations/locations_eu.csv>~~
- ~~App in Edge und Firefox ausprobieren~~
- Zweites Repo für TestUmgebung, damit Seb und Johannes gucken können
- HTML von Hauptseite (<https://covid19forecasthub.eu/>) checken und ggf. Verbesserungsvorschläge machen
- Einbettung des IFrames mit flexHeight 1 1 100%

### Done

- ~~Deployment in signale repo~~
- ~~TargetLabelPipe~~
- ~~DropDown für Location über Karte um kleine Länder wie Lichtenstein zu selektieren~~
- ~~Farben der Modelle über gesamte Programmdauer konsistent halten -> ColorPicker~~
- ~~Farbscala in 50er schritten 0 - 350 und blau~~
- ~~Legende Horizontal und unten positionieren~~
- ~~header in legend mit target + 100.000 einwohner~~
- ~~Standard Location = random~~
- ~~Shapes von Johannes nutzen~~
- ~~Countries, die nicht im Lookup sind unklickbar machen~~
- ~~different threshold for colorscale if target === death~~
- ~~Default choice for prediction interval to 95%~~
- ~~Tooltip items in chart ordered by value desc~~
- ~~If defaultModelNames === undefined => use all Modelnames as default~~
- ~~xAxis.max auf maxDate(truthDate) + 5 wochen~~
- ~~ThemeColor primary auf '#003a80' ändern~~
- ~~Text anpassen (googledoc checken)~~
- ~~Überschrift Forecasts TARGET, LOCATION: `"<target>, <country>, forecasts issued on <entsprechender Montag>" bzw. "... <horizon> week ahead forecasts`~~
- Darstellung für kleine Displays
  - ~~breite observen und linkes menü einklappen~~
  - ~~höhe observen und display settings einklappen~~
  - eigenes layout für sehr schmale displays
- BUG: leaflet popup in firefox
- App in Edge und Firefox ausprobieren

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
- ~~Service um appFormat zu lesen~~
- ~~GitHub CI on forecast_to_plot_csv commit -> call convertToAppFormat.py -> forecast_to_plot.json commit + push~~

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
