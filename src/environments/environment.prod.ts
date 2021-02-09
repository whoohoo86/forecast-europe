export const environment = {
  production: true,
  base_href: '/forecast-europe',
  urls: {
    defaultSettings: {
      modelNames: 'https://raw.githubusercontent.com/epiforecasts/covid19-forecast-hub-europe/main/viz/settings_model_selection.json'
    },
    lookups: {
      location: 'https://raw.githubusercontent.com/epiforecasts/covid19-forecast-hub-europe/main/viz/location_codes.csv'
    },
    forecastData: 'https://raw.githubusercontent.com/epiforecasts/covid19-forecast-hub-europe/main/viz/forecasts_to_plot.csv',
    truthData: 'https://raw.githubusercontent.com/epiforecasts/covid19-forecast-hub-europe/main/viz/truth_to_plot.csv'
  }
};
