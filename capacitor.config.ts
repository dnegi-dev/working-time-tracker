import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'dev.dnegi.workingtime',
  appName: 'Working Time',
  webDir: 'dist',
  // Route fetch through native HTTP so custom iCal URLs work without CORS.
  plugins: { CapacitorHttp: { enabled: true } },
};

export default config;
