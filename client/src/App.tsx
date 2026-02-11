import { BrowserRouter, Routes, Route } from 'react-router-dom';
import { CartProvider } from './context/CartContext';
import { Layout } from './layout/Layout';
import { Home } from './pages/Home';
import { Products } from './pages/Products';
import { ProductDetail } from './pages/ProductDetail';
import { CartPage } from './pages/CartPage';
import { Checkout } from './pages/Checkout';
import { OrderSuccess } from './pages/OrderSuccess';
import { VoiceAssistant } from './components/VoiceAssistant';

const NotFound = () => (
  <div className="container section" style={{ textAlign: 'center' }}>
    <h1 style={{ fontSize: '4rem', fontWeight: 900 }}>404</h1>
    <p style={{ color: 'var(--text-2)' }}>Page not found</p>
  </div>
);

function App() {
  return (
    <BrowserRouter>
      <CartProvider>
        <Routes>
          <Route path="/" element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="products" element={<Products />} />
            <Route path="product/:id" element={<ProductDetail />} />
            <Route path="cart" element={<CartPage />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="order-success" element={<OrderSuccess />} />
            <Route path="*" element={<NotFound />} />
          </Route>
        </Routes>
        <VoiceAssistant />
      </CartProvider>
    </BrowserRouter>
  );
}

export default App;
