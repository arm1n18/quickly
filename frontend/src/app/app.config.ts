import { ApplicationConfig, inject, provideAppInitializer, provideBrowserGlobalErrorListeners, provideZonelessChangeDetection } from '@angular/core';
import { provideRouter } from '@angular/router';
import { routes } from './app.routes';
import { provideCharts, withDefaultRegisterables } from 'ng2-charts';
import { BarController, Colors, Legend } from 'chart.js';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AuthService } from './features/auth/services/auth.service';
import { authInterceptor } from './core/interceptors/auth/auth.interceptor';
import { apiInterceptor } from './core/interceptors/api/api.interceptor';

export const appConfig: ApplicationConfig = {
  providers: [
    provideAppInitializer(() => {
      const auth = inject(AuthService);
      auth.init()
    }),
    provideHttpClient(
      withInterceptors([apiInterceptor, authInterceptor])
    ),
    provideBrowserGlobalErrorListeners(),
    provideZonelessChangeDetection(),
    provideRouter(routes), provideCharts(withDefaultRegisterables()),
    provideCharts({ registerables: [BarController, Legend, Colors] }),
  ],
};
