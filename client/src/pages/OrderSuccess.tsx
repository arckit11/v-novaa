import { Link, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';

export const OrderSuccess = () => {
    const [show, setShow] = useState(false);
    const location = useLocation();
    const orderId = (location.state as any)?.orderId || `VN-${Date.now().toString(36).toUpperCase()}`;

    useEffect(() => {
        setTimeout(() => setShow(true), 100);
    }, []);

    return (
        <div className="container section" style={{
            textAlign: 'center', padding: '80px 24px',
            opacity: show ? 1 : 0, transform: show ? 'translateY(0)' : 'translateY(20px)',
            transition: 'all 0.6s ease',
        }}>
            <div style={{
                width: 80, height: 80, borderRadius: '50%',
                background: 'rgba(34,197,94,0.15)', border: '2px solid #22c55e',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                margin: '0 auto 24px', fontSize: '2rem',
            }}>
                ✓
            </div>

            <h1 style={{ fontSize: '2.5rem', fontWeight: 900, marginBottom: 12 }}>
                Payment Successful!
            </h1>
            <p style={{ color: 'var(--text-2)', fontSize: '1.1rem', marginBottom: 8 }}>
                Thank you for shopping with V-Novaa
            </p>
            <p style={{ color: 'var(--text-3)', fontSize: '0.85rem', marginBottom: 40 }}>
                Order ID: <span style={{ color: 'var(--accent-lt)', fontWeight: 600 }}>{orderId}</span>
            </p>

            <div style={{
                maxWidth: 400, margin: '0 auto', padding: 24,
                background: 'var(--bg-card)', border: '1px solid var(--border)',
                borderRadius: 'var(--r-lg)', marginBottom: 40,
            }}>
                <p style={{ fontSize: '0.9rem', color: 'var(--text-2)', lineHeight: 1.7 }}>
                    We've sent a confirmation email with your order details.
                    Your items will be shipped within 2-3 business days.
                </p>
            </div>

            <div style={{ display: 'flex', gap: 12, justifyContent: 'center', flexWrap: 'wrap' }}>
                <Link to="/" className="btn btn-primary">Continue Shopping</Link>
                <Link to="/products" className="btn btn-secondary">Browse Products</Link>
            </div>
        </div>
    );
};
