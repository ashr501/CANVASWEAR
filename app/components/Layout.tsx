import type {ReactNode} from 'react';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from './CartDrawer';
import type {PublicBrand} from '~/lib/brands';

interface LayoutProps {
  brand: PublicBrand;
  cartOpen: boolean;
  onCartOpen: () => void;
  onCartClose: () => void;
  children: ReactNode;
}

export default function Layout({
  brand,
  cartOpen,
  onCartOpen,
  onCartClose,
  children,
}: LayoutProps) {
  return (
    <>
      <Header brand={brand} onCartOpen={onCartOpen} />
      <main
        style={{paddingTop: 'calc(var(--header-height) + var(--nav-height))'}}
        className="min-h-screen"
      >
        {children}
      </main>
      <Footer brand={brand} />
      <CartDrawer
       
        isOpen={cartOpen}
        onClose={onCartClose}
        brand={brand}
      />
    </>
  );
}
