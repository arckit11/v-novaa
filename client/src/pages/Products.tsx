import { useState, useMemo } from 'react';
import { useSearchParams } from 'react-router-dom';
import { products, categories } from '../data/products';
import { ProductCard } from '../components/ProductCard';

export const Products = () => {
    const [searchParams, setSearchParams] = useSearchParams();
    const activeCategory = searchParams.get('category') || 'All';
    const [sortBy, setSortBy] = useState('featured');

    const filtered = useMemo(() => {
        let result = activeCategory === 'All'
            ? [...products]
            : products.filter(p => p.category.toLowerCase() === activeCategory.toLowerCase());

        switch (sortBy) {
            case 'price-low': result.sort((a, b) => a.price - b.price); break;
            case 'price-high': result.sort((a, b) => b.price - a.price); break;
            case 'rating': result.sort((a, b) => b.rating - a.rating); break;
            default: break;
        }
        return result;
    }, [activeCategory, sortBy]);

    const setCategory = (cat: string) => {
        if (cat === 'All') { setSearchParams({}); }
        else { setSearchParams({ category: cat }); }
    };

    return (
        <div className="container section">
            <h1 style={{ fontSize: '2rem', fontWeight: 800, marginBottom: 8 }}>
                {activeCategory === 'All' ? 'All Products' : activeCategory}
            </h1>
            <p style={{ color: 'var(--text-2)', marginBottom: 32 }}>
                {filtered.length} product{filtered.length !== 1 ? 's' : ''}
            </p>

            {/* Filters Bar */}
            <div className="filters-bar">
                <div className="filter-chips">
                    {categories.map(cat => (
                        <button
                            key={cat}
                            className={`filter-chip ${activeCategory === cat ? 'active' : ''}`}
                            onClick={() => setCategory(cat)}
                        >
                            {cat}
                        </button>
                    ))}
                </div>
                <select
                    className="sort-select"
                    value={sortBy}
                    onChange={e => setSortBy(e.target.value)}
                >
                    <option value="featured">Featured</option>
                    <option value="price-low">Price: Low → High</option>
                    <option value="price-high">Price: High → Low</option>
                    <option value="rating">Top Rated</option>
                </select>
            </div>

            {/* Grid */}
            {filtered.length > 0 ? (
                <div className="product-grid">
                    {filtered.map((p, i) => (
                        <ProductCard key={p.id} product={p} index={i} />
                    ))}
                </div>
            ) : (
                <div style={{ textAlign: 'center', padding: '80px 0', color: 'var(--text-3)' }}>
                    <p style={{ fontSize: '1.2rem' }}>No products found in this category.</p>
                </div>
            )}
        </div>
    );
};
