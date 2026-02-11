import { useParams, Link } from 'react-router-dom';
import { products } from '../data/products';
import { useCart } from '../context/CartContext';
import { useState, useEffect } from 'react';

export const ProductDetail = () => {
    const { id } = useParams<{ id: string }>();
    const { addItem } = useCart();
    const [selectedSize, setSelectedSize] = useState<string | null>(null);
    const [added, setAdded] = useState(false);
    const [sizeError, setSizeError] = useState(false);
    const product = products.find(p => p.id === id);

    if (!product) {
        return (
            <div className="container section" style={{ textAlign: 'center' }}>
                <h1>Product Not Found</h1>
                <Link to="/products" className="btn btn-primary" style={{ marginTop: 24, display: 'inline-flex' }}>← Browse Products</Link>
            </div>
        );
    }

    const handleAdd = () => {
        if (product && product.sizes && product.sizes.length > 0 && !selectedSize) {
            setSizeError(true);
            return;
        }
        if (product) addItem(product, 1, selectedSize || undefined);
        setAdded(true);
        setSizeError(false);
        setTimeout(() => setAdded(false), 1500);
    };

    // Voice control
    useEffect(() => {
        const handleSelectSize = (e: Event) => {
            const size = (e as CustomEvent).detail.size;
            if (product?.sizes?.includes(size)) {
                setSelectedSize(size);
                setSizeError(false);
            }
        };

        const handleAddToCart = () => {
            if (product) handleAdd();
        };

        window.addEventListener('voice-select-size', handleSelectSize);
        window.addEventListener('voice-add-current', handleAddToCart);
        return () => {
            window.removeEventListener('voice-select-size', handleSelectSize);
            window.removeEventListener('voice-add-current', handleAddToCart);
        };
    }, [product, selectedSize, handleAdd]);

    return (
        <div className="container section">
            <Link to="/products" style={{ display: 'inline-flex', alignItems: 'center', gap: 6, color: 'var(--text-2)', fontSize: '0.85rem', marginBottom: 32 }}>
                ← Back to Products
            </Link>

            <div className="product-detail-grid">
                {/* Image */}
                <div className="detail-image">
                    <img src={product.image} alt={product.name} />
                </div>

                {/* Info */}
                <div className="detail-info">
                    <span className="card-category">{product.category}</span>
                    <h1 style={{ fontSize: '2.2rem', fontWeight: 800, letterSpacing: '-0.03em', margin: '12px 0 8px' }}>
                        {product.name}
                    </h1>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 20 }}>
                        <span style={{ color: '#fbbf24' }}>★</span>
                        <span style={{ fontSize: '0.9rem', color: 'var(--text-2)' }}>
                            {product.rating} ({product.reviews} reviews)
                        </span>
                    </div>
                    <p style={{ fontSize: '2rem', fontWeight: 700, marginBottom: 24 }}>
                        ${product.price}
                    </p>
                    <p style={{ fontSize: '1rem', color: 'var(--text-2)', lineHeight: 1.8, marginBottom: 32 }}>
                        {product.description}
                    </p>

                    {/* Size Selector */}
                    {product.sizes && product.sizes.length > 0 && (
                        <div style={{ marginBottom: 24 }}>
                            <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-2)' }}>
                                Select Size {sizeError && <span style={{ color: '#ef4444', textTransform: 'none', letterSpacing: 0 }}>— Please select a size</span>}
                            </h3>
                            <div className="size-grid">
                                {product.sizes.map(size => (
                                    <button
                                        key={size}
                                        className={`size-btn ${selectedSize === size ? 'active' : ''}`}
                                        onClick={() => { setSelectedSize(size); setSizeError(false); }}
                                    >
                                        {size}
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Features */}
                    <div style={{ marginBottom: 32 }}>
                        <h3 style={{ fontSize: '0.85rem', fontWeight: 600, marginBottom: 12, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-2)' }}>
                            Key Features
                        </h3>
                        <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                            {product.features.map(f => (
                                <span key={f} className="feature-tag">{f}</span>
                            ))}
                        </div>
                    </div>

                    {/* Add to Cart */}
                    <button onClick={handleAdd} className="btn btn-primary" style={{ width: '100%', justifyContent: 'center', padding: '16px 32px', fontSize: '1rem' }}>
                        {added ? '✓ Added to Cart!' : '+ Add to Cart'}
                    </button>
                </div>
            </div>
        </div>
    );
};
