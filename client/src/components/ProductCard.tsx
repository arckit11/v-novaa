import { useCart } from '../context/CartContext';
import type { Product } from '../data/products';
import { Link } from 'react-router-dom';

interface Props {
    product: Product;
    index?: number;
}

export const ProductCard = ({ product, index = 0 }: Props) => {
    const { addItem } = useCart();

    return (
        <div className="product-card fade-up" style={{ animationDelay: `${index * 0.1}s` }}>
            <Link to={`/product/${product.id}`}>
                <div className="card-image">
                    <img src={product.image} alt={product.name} />
                    <span className="card-price-badge">${product.price}</span>
                </div>
            </Link>
            <div className="card-body">
                <div className="card-category">{product.category}</div>
                <Link to={`/product/${product.id}`}>
                    <h3 className="card-title">{product.name}</h3>
                </Link>
                <p className="card-desc">{product.description}</p>
                <div className="card-footer">
                    <span className="card-rating">
                        <span className="star">★</span> {product.rating} ({product.reviews})
                    </span>
                    <button className="card-add-btn" onClick={(e) => { e.stopPropagation(); addItem(product); }}>
                        + Add
                    </button>
                </div>
            </div>
        </div>
    );
};
