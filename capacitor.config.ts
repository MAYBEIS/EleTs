import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'com.example1.app',
  appName: 'DemoTest',
  webDir: 'out/renderer',
  plugins: {
    SplashScreen: {
      launchAutoHide: false
    }
  },
  android: {
    buildOptions: {
      releaseType: 'APK',
      keystorePath: 'M:\\08_Project\\=) vscode\\EleTs\\my-release-key.jks',
      keystorePassword: '123456',
      keystoreAlias: 'your_key_alias',
      keystoreAliasPassword: '123456'
    }
  }
};

export default config;    