import { Link, Outlet, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export const Layout = () => {
    const { totalItems } = useCart();
    const loc = useLocation();

    return (
        <>
            <header className="header">
                <div className="header-inner">
                    <Link to="/" className="logo">V-Novaa</Link>
                    <nav className="nav">
                        <Link to="/" className={loc.pathname === '/' ? 'active' : ''}>Home</Link>
                        <Link to="/products" className={loc.pathname.startsWith('/products') ? 'active' : ''}>Products</Link>
                    </nav>
                    <div className="header-actions">
                        <Link to="/cart" className="cart-btn">
                            <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                                <line x1="3" y1="6" x2="21" y2="6" />
                                <path d="M16 10a4 4 0 01-8 0" />
                            </svg>
                            {totalItems > 0 && <span className="cart-badge">{totalItems}</span>}
                        </Link>
                    </div>
                </div>
            </header>

            <main><Outlet /></main>

            <footer className="footer">
                <div className="container">
                    <div className="footer-grid">
                        <div className="footer-brand">
                            <span className="logo">V-Novaa</span>
                            <p className="footer-desc">Premium technology for modern living.</p>
                        </div>
                        <div className="footer-col">
                            <h4>Shop</h4>
                            <Link to="/">All Products</Link>
                            <Link to="/">New Arrivals</Link>
                        </div>
                        <div className="footer-col">
                            <h4>Support</h4>
                            <Link to="/">Help Center</Link>
                            <Link to="/">Contact</Link>
                        </div>
                        <div className="footer-col">
                            <h4>Company</h4>
                            <Link to="/">About</Link>
                            <Link to="/">Careers</Link>
                        </div>
                    </div>
                    <div className="footer-bottom">© {new Date().getFullYear()} V-Novaa. All rights reserved.</div>
                </div>
            </footer>
        </>
    );
};
