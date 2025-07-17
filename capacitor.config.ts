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
      // 使用相对路径报错，但是绝对路径正常，暂时不知道原因
      // 自己打包APK时请更改此处
      keystorePath: 'M:\\08_Project\\=) vscode\\EleTs\\my-release-key.jks',
      keystorePassword: '123456',
      keystoreAlias: 'your_key_alias',
      keystoreAliasPassword: '123456'
    }
  }
};

export default config;    