import type {ReactNode} from 'react';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import type {PublicBrand} from '~/lib/brands';

interface LayoutProps {
  brand: PublicBrand;
  cart: any;
  cartOpen: boolean;
  onCartOpen: () => void;
  onCartClose: () => void;
  children: ReactNode;
}

export default function Layout({
  brand,
  cart,
  cartOpen,
  onCartOpen,
  onCartClose,
  children,
}: LayoutProps) {
  return (
    <>
      <Header brand={brand} onCartOpen={onCartOpen} cart={cart} />
      <main
        style={{paddingTop: 'calc(var(--header-height) + var(--nav-height))'}}
        className="min-h-screen"
      >
        {children}
      </main>
      <Footer brand={brand} />
      <CartDrawer
        cart={cart}
        isOpen={cartOpen}
        onClose={onCartClose}
        brand={brand}
      />
    </>
  );
}
