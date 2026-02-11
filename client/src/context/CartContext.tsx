import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import type { Product } from '../data/products';

interface CartItem extends Product {
    quantity: number;
    size?: string;
}

interface CartContextType {
    items: CartItem[];
    addItem: (product: Product, qty?: number, size?: string) => void;
    removeItem: (id: string, size?: string) => void;
    updateQuantity: (id: string, qty: number, size?: string) => void;
    clearCart: () => void;
    totalItems: number;
    subtotal: number;
}

const CartContext = createContext<CartContextType | null>(null);

export const useCart = () => {
    const ctx = useContext(CartContext);
    if (!ctx) throw new Error('useCart must be used within CartProvider');
    return ctx;
};

export const CartProvider = ({ children }: { children: ReactNode }) => {
    const [items, setItems] = useState<CartItem[]>(() => {
        try {
            const saved = localStorage.getItem('cart');
            return saved ? JSON.parse(saved) : [];
        } catch { return []; }
    });

    useEffect(() => {
        localStorage.setItem('cart', JSON.stringify(items));
    }, [items]);

    const addItem = (product: Product, qty = 1, size?: string) => {
        setItems(prev => {
            const key = `${product.id}-${size || ''}`;
            const existing = prev.find(i => `${i.id}-${i.size || ''}` === key);
            if (existing) {
                return prev.map(i => `${i.id}-${i.size || ''}` === key ? { ...i, quantity: i.quantity + qty } : i);
            }
            return [...prev, { ...product, quantity: qty, size }];
        });
    };

    const removeItem = (id: string, size?: string) => {
        setItems(prev => prev.filter(i => !(`${i.id}-${i.size || ''}` === `${id}-${size || ''}`)));
    };

    const updateQuantity = (id: string, qty: number, size?: string) => {
        if (qty <= 0) return removeItem(id, size);
        setItems(prev => prev.map(i =>
            `${i.id}-${i.size || ''}` === `${id}-${size || ''}` ? { ...i, quantity: qty } : i
        ));
    };

    const clearCart = () => setItems([]);
    const totalItems = items.reduce((sum, i) => sum + i.quantity, 0);
    const subtotal = items.reduce((sum, i) => sum + i.price * i.quantity, 0);

    return (
        <CartContext.Provider value={{ items, addItem, removeItem, updateQuantity, clearCart, totalItems, subtotal }}>
            {children}
        </CartContext.Provider>
    );
};
