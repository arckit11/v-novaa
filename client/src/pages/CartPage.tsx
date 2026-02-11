import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export const CartPage = () => {
    const { items, removeItem, updateQuantity, subtotal, clearCart } = useCart();

    if (items.length === 0) {
        return (
            <div className="container section" style={{ textAlign: 'center', padding: '120px 24px' }}>
                <div style={{ fontSize: '4rem', marginBottom: 16 }}>🛒</div>
                <h1 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 12 }}>Your cart is empty</h1>
                <p style={{ color: 'var(--text-2)', marginBottom: 32 }}>Add some products to get started</p>
                <Link to="/" className="btn btn-primary">← Continue Shopping</Link>
            </div>
        );
    }

    return (
        <div className="container section">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 40 }}>
                <h1 style={{ fontSize: '2rem', fontWeight: 700 }}>Shopping Cart ({items.length})</h1>
                <button onClick={clearCart} style={{ fontSize: '0.85rem', color: 'var(--text-3)', cursor: 'pointer', background: 'none', border: 'none' }}>
                    Clear All
                </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 360px', gap: 40, alignItems: 'start' }}>
                {/* Items */}
                <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
                    {items.map(item => (
                        <div key={`${item.id}-${item.size}`} style={{
                            display: 'flex', gap: 20, padding: 20,
                            background: 'var(--bg-card)', border: '1px solid var(--border)',
                            borderRadius: 'var(--r-md)'
                        }}>
                            <Link to={`/product/${item.id}`} style={{ flexShrink: 0 }}>
                                <img src={item.image} alt={item.name} style={{
                                    width: 100, height: 100, objectFit: 'cover', borderRadius: 'var(--r-sm)'
                                }} />
                            </Link>
                            <div style={{ flex: 1 }}>
                                <Link to={`/product/${item.id}`}>
                                    <h3 style={{ fontSize: '1rem', fontWeight: 600, marginBottom: 4 }}>{item.name}</h3>
                                </Link>
                                <p style={{ fontSize: '0.8rem', color: 'var(--accent-lt)', marginBottom: 12 }}>{item.category}</p>
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity - 1, item.size)}
                                            style={{
                                                width: 32, height: 32, borderRadius: '50%',
                                                background: 'var(--bg-card-hover)', border: '1px solid var(--border-card)',
                                                color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                cursor: 'pointer', fontSize: '1.1rem'
                                            }}
                                        >−</button>
                                        <span style={{ fontWeight: 600, minWidth: 24, textAlign: 'center' }}>{item.quantity}</span>
                                        <button
                                            onClick={() => updateQuantity(item.id, item.quantity + 1, item.size)}
                                            style={{
                                                width: 32, height: 32, borderRadius: '50%',
                                                background: 'var(--bg-card-hover)', border: '1px solid var(--border-card)',
                                                color: 'var(--text)', display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                cursor: 'pointer', fontSize: '1.1rem'
                                            }}
                                        >+</button>
                                    </div>
                                    <div style={{ textAlign: 'right' }}>
                                        <div style={{ fontWeight: 700 }}>${(item.price * item.quantity).toFixed(2)}</div>
                                        <button
                                            onClick={() => removeItem(item.id, item.size)}
                                            style={{ fontSize: '0.75rem', color: '#ef4444', cursor: 'pointer', background: 'none', border: 'none', marginTop: 4 }}
                                        >Remove</button>
                                    </div>
                                </div>
                            </div>
                        </div>
                    ))}
                </div>

                {/* Summary */}
                <div style={{
                    padding: 24, background: 'var(--bg-card)',
                    border: '1px solid var(--border)', borderRadius: 'var(--r-lg)',
                    position: 'sticky', top: 96
                }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 700, marginBottom: 20 }}>Order Summary</h3>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '0.9rem', color: 'var(--text-2)' }}>
                        <span>Subtotal</span><span>${subtotal.toFixed(2)}</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 12, fontSize: '0.9rem', color: 'var(--text-2)' }}>
                        <span>Shipping</span><span>Free</span>
                    </div>
                    <div style={{ borderTop: '1px solid var(--border)', margin: '16px 0', paddingTop: 16, display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>Total</span>
                        <span style={{ fontWeight: 700, fontSize: '1.1rem' }}>${subtotal.toFixed(2)}</span>
                    </div>
                    <Link to="/checkout" className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', marginTop: 8, textAlign: 'center' }}>
                        Checkout →
                    </Link>
                    <Link to="/" style={{ display: 'block', textAlign: 'center', marginTop: 16, fontSize: '0.85rem', color: 'var(--text-2)' }}>
                        ← Continue Shopping
                    </Link>
                </div>
            </div>
        </div>
    );
};
