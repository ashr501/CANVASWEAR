import {reactRouter} from '@react-router/dev/vite';
import {oxygen} from '@shopify/mini-oxygen/vite';
import {defineConfig} from 'vite';

const oxygenPlugins = oxygen();
const oxygenPlugin = oxygenPlugins.find((plugin) => plugin.name === 'oxygen:main');
if (!oxygenPlugin?.api) {
  throw new Error('MiniOxygen plugin API is unavailable.');
}
// Hydrogen 2026.10 から推定される互換日付をMiniOxygenがまだ扱えないため、テンプレートと同じ日付に固定する
oxygenPlugin.api.registerPluginOptions({compatibilityDate: '2026-04-01'});

export default defineConfig({
  plugins: [...oxygenPlugins, reactRouter()],
  resolve: {
    tsconfigPaths: true,
  },
  build: {
    // 厳しいCSPのもとでbase64インライン化を避ける
    assetsInlineLimit: 0,
  },
  ssr: {
    optimizeDeps: {
      include: [
        'react',
        'react/jsx-runtime',
        'react/jsx-dev-runtime',
        'react-dom',
        'react-dom/server',
        'react-router > set-cookie-parser',
        'react-router > cookie',
        'react-router',
      ],
    },
  },
});
