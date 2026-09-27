/** Swagger UI for the command API. Served as a separate page so the app bundle stays small. */
import SwaggerUI from 'swagger-ui-dist/swagger-ui-es-bundle.js';
import 'swagger-ui-dist/swagger-ui.css';
import { registerSW } from 'virtual:pwa-register';

// The service worker executes "Try it out" calls; register it even if the app was never opened.
registerSW({ immediate: true });
SwaggerUI({
  url: `${import.meta.env.BASE_URL}api/openapi.json`,
  dom_id: '#swagger',
  tryItOutEnabled: true,
});
