import type {LoaderFunctionArgs} from '@shopify/remix-oxygen';
import {getSitemapIndex} from '@shopify/hydrogen';

export async function loader({request, context}: LoaderFunctionArgs) {
  return getSitemapIndex({
    storefront: context.storefront,
    request,
    types: ['products', 'collections'],
  });
}
