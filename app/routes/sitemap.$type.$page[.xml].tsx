import type {LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {getSitemap} from '@shopify/hydrogen';

export async function loader({request, params, context}: LoaderFunctionArgs) {
  return getSitemap({
    request,
    params,
    storefront: context.storefront,
    getLink: ({type, baseUrl, handle}) => {
      if (type === 'products') return `${baseUrl}/products/${handle}`;
      if (type === 'collections') return `${baseUrl}/collections/${handle}`;
      return baseUrl;
    },
  });
}
