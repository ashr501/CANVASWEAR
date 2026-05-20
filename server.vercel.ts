// Vercel用サーバーエントリーポイント
// Oxygen(Cloudflare Workers)とは異なり、Node.js環境で動作する

import {createRequestHandler} from '@remix-run/express';
import {installGlobals} from '@remix-run/node';
import {
  createStorefrontClient,
  createCartHandler,
  cartGetIdDefault,
  cartSetIdDefault,
} from '@shopify/hydrogen';
import {HydrogenSession} from '~/lib/session.server';
import express from 'express';
import * as build from './build/server';

installGlobals();

const app = express();

app.use(express.static('dist/client', {maxAge: '1y'}));

app.all('*', async (req, res, next) => {
  try {
    const env = {
      SESSION_SECRET: process.env.SESSION_SECRET ?? 'dev-secret',
      PUBLIC_STOREFRONT_API_TOKEN: process.env.PUBLIC_STOREFRONT_API_TOKEN ?? '',
      PRIVATE_STOREFRONT_API_TOKEN: process.env.PRIVATE_STOREFRONT_API_TOKEN ?? '',
      PUBLIC_STORE_DOMAIN: process.env.PUBLIC_STORE_DOMAIN ?? '',
      PUBLIC_STOREFRONT_ID: process.env.PUBLIC_STOREFRONT_ID ?? '',
      BRAND_ID: (process.env.BRAND_ID ?? 'elegant-plus') as 'elegant-plus' | 'avant-garde',
      BRAND1_STORE_DOMAIN: process.env.BRAND1_STORE_DOMAIN ?? '',
      BRAND1_STOREFRONT_API_TOKEN: process.env.BRAND1_STOREFRONT_API_TOKEN ?? '',
      BRAND2_STORE_DOMAIN: process.env.BRAND2_STORE_DOMAIN ?? '',
      BRAND2_STOREFRONT_API_TOKEN: process.env.BRAND2_STOREFRONT_API_TOKEN ?? '',
    } as Env;

    const url = `${req.protocol}://${req.get('host')}${req.originalUrl}`;
    const request = new Request(url, {
      method: req.method,
      headers: Object.entries(req.headers).reduce((acc, [k, v]) => {
        if (v) acc.append(k, Array.isArray(v) ? v.join(',') : v);
        return acc;
      }, new Headers()),
      body: ['GET', 'HEAD'].includes(req.method) ? null : req,
    });

    const session = await HydrogenSession.init(request, [env.SESSION_SECRET]);

    // ブランドIDに応じてストアドメインを切り替え
    const storeDomain =
      env.BRAND_ID === 'avant-garde'
        ? env.BRAND2_STORE_DOMAIN || env.PUBLIC_STORE_DOMAIN
        : env.BRAND1_STORE_DOMAIN || env.PUBLIC_STORE_DOMAIN;

    const storefrontToken =
      env.BRAND_ID === 'avant-garde'
        ? env.BRAND2_STOREFRONT_API_TOKEN || env.PUBLIC_STOREFRONT_API_TOKEN
        : env.BRAND1_STOREFRONT_API_TOKEN || env.PUBLIC_STOREFRONT_API_TOKEN;

    const {storefront} = createStorefrontClient({
      i18n: {language: 'JA', country: 'JP'},
      publicStorefrontToken: storefrontToken,
      storeDomain,
      storefrontHeaders: {
        requestGroupId: req.headers['request-id'] as string,
        buyerIp: req.ip ?? '',
        cookie: req.headers.cookie ?? '',
      },
    });

    const cart = createCartHandler({
      storefront,
      getCartId: cartGetIdDefault(request.headers),
      setCartId: cartSetIdDefault(),
    });

    const handler = createRequestHandler({
      build,
      mode: process.env.NODE_ENV,
      getLoadContext() {
        return {
          session,
          storefront,
          cart,
          env,
          waitUntil: (p: Promise<any>) => p,
        };
      },
    });

    const response = await handler(request);
    res.status(response.status);
    response.headers.forEach((value, key) => res.setHeader(key, value));
    res.send(await response.text());
  } catch (err) {
    next(err);
  }
});

const port = process.env.PORT ?? 3000;
app.listen(port, () => {
  console.log(`✅ サーバー起動: http://localhost:${port}`);
});

export default app;
