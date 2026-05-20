import type {ReactNode} from 'react';
import Header from './Header';
import Footer from './Footer';
import CartDrawer from './CartDrawer';

interface LayoutProps {
  brand: {
    id: string;
    name: string;
    nameJa: string;
    tagline: string;
    taglineJa: string;
  };
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
      <main style={{paddingTop: 'var(--header-height)'}} className="min-h-screen">
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
