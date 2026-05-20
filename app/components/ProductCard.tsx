import {Link} from '@remix-run/react';
import {Image, Money} from '@shopify/hydrogen';
import clsx from 'clsx';
import {useState} from 'react';

interface ProductCardProps {
  product: {
    id: string;
    title: string;
    handle: string;
    priceRange: {
      minVariantPrice: {
        amount: string;
        currencyCode: string;
      };
    };
    featuredImage?: {
      url: string;
      altText?: string | null;
      width?: number | null;
      height?: number | null;
    } | null;
    variants: {
      nodes: Array<{
        id: string;
        availableForSale: boolean;
      }>;
    };
  };
  brandId: string;
}

export default function ProductCard({product, brandId}: ProductCardProps) {
  const [hovered, setHovered] = useState(false);
  const isAvantGarde = brandId === 'avant-garde';
  const isAvailable = product.variants.nodes[0]?.availableForSale;

  return (
    <Link
      to={`/products/${product.handle}`}
      className="group block"
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
    >
      {/* 画像 */}
      <div
        className="relative overflow-hidden mb-3 aspect-[3/4]"
        style={{borderRadius: 'var(--radius)'}}
      >
        {product.featuredImage ? (
          <Image
            data={product.featuredImage}
            className={clsx(
              'w-full h-full object-cover transition-transform duration-700',
              isAvantGarde
                ? 'grayscale hover:grayscale-0'
                : 'group-hover:scale-105',
            )}
            style={{transitionTimingFunction: 'var(--ease)'}}
            sizes="(min-width: 1200px) 25vw, (min-width: 768px) 33vw, 50vw"
          />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{backgroundColor: 'var(--color-border)'}}
          >
            <span
              className="text-xs tracking-widest"
              style={{color: 'var(--color-text-muted)'}}
            >
              NO IMAGE
            </span>
          </div>
        )}

        {/* 売り切れ */}
        {!isAvailable && (
          <div
            className="absolute inset-0 flex items-center justify-center"
            style={{backgroundColor: 'rgba(0,0,0,0.45)'}}
          >
            <span className="text-white text-xs tracking-widest uppercase">SOLD OUT</span>
          </div>
        )}

        {/* avant-garde: ボトムアクセントライン */}
        {isAvantGarde && (
          <div
            className={clsx(
              'absolute bottom-0 left-0 h-[2px] transition-all duration-500',
              hovered ? 'w-full' : 'w-0',
            )}
            style={{backgroundColor: 'var(--color-accent)'}}
          />
        )}
      </div>

      {/* 商品情報 */}
      <div className="space-y-1">
        <h3
          className={clsx(
            'transition-colors duration-200',
            isAvantGarde
              ? 'text-base tracking-wider uppercase'
              : 'text-sm',
          )}
          style={{
            fontFamily: isAvantGarde ? 'var(--font-heading)' : 'var(--font-body)',
            color: 'var(--color-text)',
          }}
        >
          {product.title}
        </h3>
        <p
          className="text-sm"
          style={{
            color: isAvantGarde ? 'var(--color-text-muted)' : 'var(--color-primary)',
            fontFamily: 'var(--font-body)',
          }}
        >
          <Money data={product.priceRange.minVariantPrice} />
        </p>
      </div>
    </Link>
  );
}
