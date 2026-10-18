import type {Config} from '@react-router/dev/config';

export default {
  appDirectory: 'app',
  // デプロイの --assets-dir dist/client --worker-dir dist/server と合わせる
  buildDirectory: 'dist',
  ssr: true,
  future: {
    v8_middleware: true,
    v8_splitRouteModules: true,
    v8_viteEnvironmentApi: false,
    unstable_optimizeDeps: true,
  },
} satisfies Config;
