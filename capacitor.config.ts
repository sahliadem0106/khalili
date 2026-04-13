import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.khalil.app',
  appName: 'Khalil',
  webDir: 'dist',
  plugins: {
    GoogleAuth: {
      scopes: ["profile", "email"],
      // Get this from: Firebase Console -> Authentication -> Sign-in method -> Google -> Web SDK configuration -> Web client ID
      serverClientId: "1040674649278-jcausll9po5qlstkvc31n5o5dfocefb5.apps.googleusercontent.com",
      forceCodeForRefreshToken: true,
    },
  },
};

export default config;
