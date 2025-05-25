import { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.nutritrackr.app',
  appName: 'NutriTrackr',
  webDir: 'dist/nutritrackr',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    Preferences: {
      group: 'NutriTrackrPrefs'
    },
    Camera: {
      permissions: ['camera', 'photos']
    }
  }
};

export default config;
