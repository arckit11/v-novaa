import { lazy, Suspense, Component, ReactNode } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import { VapiAssistant } from "./components/VapiAssistant";
import { CartProvider } from "./context/CartContext";
import { VoiceListener } from "./components/VoiceListener";
import { FilterProvider } from "./context/FilterContext";
import { ProductProvider } from "./context/ProductContext";
import { LanguageProvider } from "./context/LanguageContext";

// Lazy load page components for better initial load performance
const CategorySelectionPage = lazy(() => import("./pages/CategorySelectionPage"));
const ProductListingPage = lazy(() => import("./pages/ProductListingPage"));
const ProductDetailPage = lazy(() => import("./pages/ProductDetailPage"));
const CartPage = lazy(() => import("./pages/CartPage"));
const PaymentPage = lazy(() => import("./pages/PaymentPage"));
const ConfirmationPage = lazy(() => import("./pages/ConfirmationPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

// Simple Error Boundary for crash prevention
interface ErrorBoundaryState {
  hasError: boolean;
  error?: Error;
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props);
    this.state = { hasError: false };
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error("App Error Boundary caught:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center p-8">
            <h1 className="text-2xl font-bold text-red-600 mb-4">Something went wrong</h1>
            <p className="text-gray-600 mb-4">We encountered an error loading this page.</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-indigo-600 text-white rounded hover:bg-indigo-700"
            >
              Reload Page
            </button>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

// Loading fallback component
const PageLoader = () => (
  <div className="min-h-screen flex items-center justify-center bg-gray-50">
    <div className="text-center">
      <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto mb-4"></div>
      <p className="text-gray-600">Loading...</p>
    </div>
  </div>
);

const queryClient = new QueryClient();

const App = () => (
  <QueryClientProvider client={queryClient}>
    <CartProvider>
      <LanguageProvider>
        <FilterProvider>
          <ProductProvider>
            <TooltipProvider>
              <Toaster />
              <Sonner />
              <BrowserRouter>
                <ErrorBoundary>
                  <Suspense fallback={<PageLoader />}>
                    <Routes>
                      <Route path="/" element={<CategorySelectionPage />} />
                      <Route path="/categories" element={<CategorySelectionPage />} />
                      <Route
                        path="/products/:category"
                        element={<ProductListingPage />}
                      />
                      <Route path="/product/:id" element={<ProductDetailPage />} />
                      <Route path="/cart" element={<CartPage />} />
                      <Route path="/payment" element={<PaymentPage />} />
                      <Route path="/confirmation" element={<ConfirmationPage />} />
                      <Route path="*" element={<NotFound />} />
                    </Routes>
                  </Suspense>
                </ErrorBoundary>
                <VoiceListener />
                <VapiAssistant />
              </BrowserRouter>
            </TooltipProvider>
          </ProductProvider>
        </FilterProvider>
      </LanguageProvider>
    </CartProvider>
  </QueryClientProvider>
);

export default App;
