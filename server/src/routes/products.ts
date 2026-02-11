import { Router } from 'express';
import { products, categories } from '../data/products.js';

export const productsRouter = Router();

// GET /api/products — all products, with optional category filter
productsRouter.get('/', (req, res) => {
    const { category } = req.query;
    let result = products;

    if (category && typeof category === 'string' && category !== 'All') {
        result = products.filter(p => p.category.toLowerCase() === category.toLowerCase());
    }

    res.json({ products: result, categories, total: result.length });
});

// GET /api/products/:id — single product
productsRouter.get('/:id', (req, res) => {
    const product = products.find(p => p.id === req.params.id);
    if (!product) {
        res.status(404).json({ error: 'Product not found' });
        return;
    }
    res.json(product);
});
