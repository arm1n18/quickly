import { bootstrapApplication } from '@angular/platform-browser';
import { appConfig } from './app/app.config';
import { App } from './app/app';
import { Chart, ArcElement, DoughnutController, Tooltip, Legend } from 'chart.js'

bootstrapApplication(App, appConfig)
  .catch((err) => console.error(err));

Chart.register(DoughnutController, ArcElement, Tooltip, Legend);