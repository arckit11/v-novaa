import { Link } from 'react-router-dom';
import { products, categories } from '../data/products';
import { ProductCard } from '../components/ProductCard';

const categoryImages: Record<string, string> = {
    'Gym': 'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&q=80&w=600',
    'Yoga': 'https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?auto=format&fit=crop&q=80&w=600',
    'Running': 'https://images.unsplash.com/photo-1476480862126-209bfaa8edc8?auto=format&fit=crop&q=80&w=600',
    'Wearables': 'https://images.unsplash.com/photo-1517502474097-f9b30659dadb?auto=format&fit=crop&q=80&w=600',
    'Audio': 'https://images.unsplash.com/photo-1546435770-a3e426bf472b?auto=format&fit=crop&q=80&w=600',
    'Computing': 'https://images.unsplash.com/photo-1496181133206-80ce9b88a853?auto=format&fit=crop&q=80&w=600',
};

const displayCategories = categories.filter(c => c !== 'All' && categoryImages[c]);
const featured = products.slice(0, 8);

export const Home = () => (
    <>
        {/* Hero */}
        <section className="hero">
            <div className="hero-bg" />
            <div className="container hero-content">
                <span className="hero-label">✦ New Collection 2026</span>
                <h1>
                    Your Fitness.<br />
                    <span className="gradient">Our Technology.</span>
                </h1>
                <p>From gym essentials to smart wearables — discover premium gear engineered for your active lifestyle.</p>
                <div className="hero-btns">
                    <Link to="/products" className="btn btn-primary">Shop Now →</Link>
                    <Link to="/products?category=Gym" className="btn btn-secondary">Explore Gym</Link>
                </div>
            </div>
        </section>

        {/* Featured Products */}
        <section className="section">
            <div className="container">
                <div className="section-header">
                    <h2 className="section-title">Featured Products</h2>
                    <Link to="/products" className="section-link">View All →</Link>
                </div>
                <div className="product-grid">
                    {featured.map((p, i) => (
                        <ProductCard key={p.id} product={p} index={i} />
                    ))}
                </div>
            </div>
        </section>

        {/* Categories */}
        <section className="section">
            <div className="container">
                <div className="section-header">
                    <h2 className="section-title">Shop by Category</h2>
                </div>
                <div className="categories-grid">
                    {displayCategories.map(cat => (
                        <Link key={cat} to={`/products?category=${cat}`} className="category-card">
                            <img src={categoryImages[cat]} alt={cat} />
                            <div className="category-overlay">
                                <h3 className="category-name">{cat}</h3>
                                <span className="category-explore">Explore →</span>
                            </div>
                        </Link>
                    ))}
                </div>
            </div>
        </section>
    </>
);
