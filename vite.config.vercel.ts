// Vercel（Node.jsサーバーレス）用のビルド設定。
// oxygen() を含めないことで dist/server/index.js が
// Cloudflare Workers用ではなく通常のRemix ServerBuildとして出力される。
import {defineConfig} from 'vite';
import {hydrogen} from '@shopify/hydrogen/vite';
import {vitePlugin as remix} from '@remix-run/dev';
import tsconfigPaths from 'vite-tsconfig-paths';

export default defineConfig({
  plugins: [
    hydrogen(),
    remix({
      presets: [hydrogen.preset()],
      future: {
        v3_fetcherPersist: true,
        v3_relativeSplatPath: true,
        v3_throwAbortReason: true,
      },
    }),
    tsconfigPaths(),
  ],
  resolve: {
    alias: {
      // entry.server.tsx が renderToReadableStream を使うため、
      // Node解決でも Web Streams 版のReact DOMサーバーを使う
      'react-dom/server': 'react-dom/server.browser',
    },
  },
  build: {
    assetsInlineLimit: 0,
  },
});
