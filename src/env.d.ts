/// <reference types="vite/client" />
/// <reference types="vite-plugin-pwa/client" />

interface ImportMetaEnv {
  readonly VITE_LOGIN_HASH?: string;
}

declare module 'swagger-ui-dist/swagger-ui-es-bundle.js' {
  const SwaggerUI: (options: Record<string, unknown>) => unknown;
  export default SwaggerUI;
}
