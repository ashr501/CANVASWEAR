import {AnalyticsEvent} from '@shopify/hydrogen';
import {useCartAnalytics} from '@shopify/hydrogen/react';
import {useEffect} from 'react';
import {useLocation} from 'react-router';

/** ページを開くたびに、Shopifyの分析（ストア管理画面のレポート）へページ閲覧を送る */
export function PageViewedTracker() {
  const location = useLocation();
  const pageKey = `${location.pathname}${location.search}`;
  useEffect(() => {
    window.Shopify?.analytics?.publish(AnalyticsEvent.PAGE_VIEWED);
  }, [pageKey]);
  return null;
}

/** カートへの追加・削除をShopifyの分析へ送る */
export function CartAnalyticsTracker() {
  useCartAnalytics();
  return null;
}
