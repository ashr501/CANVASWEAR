import type {DetailedHTMLProps, HTMLAttributes} from 'react';

// Shopifyのウェブコンポーネント（Inboxのチャット）をJSXで書けるようにする
declare module 'react' {
  namespace JSX {
    interface IntrinsicElements {
      'shopify-chat': DetailedHTMLProps<HTMLAttributes<HTMLElement>, HTMLElement>;
    }
  }
}
