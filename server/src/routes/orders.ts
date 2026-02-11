import { Router } from 'express';

interface OrderItem {
    productId: string;
    name: string;
    price: number;
    quantity: number;
    size?: string;
}

interface Order {
    id: string;
    items: OrderItem[];
    customer: {
        firstName: string;
        lastName: string;
        email: string;
        phone?: string;
        address: string;
        city: string;
        zip: string;
    };
    payment: {
        last4: string;
        brand: string;
    };
    subtotal: number;
    status: 'confirmed' | 'processing' | 'shipped';
    createdAt: string;
}

// In-memory order store
const orders: Order[] = [];

export const ordersRouter = Router();

// POST /api/orders — place a new order
ordersRouter.post('/', (req, res) => {
    const { items, customer, payment } = req.body;

    // Validate required fields
    if (!items?.length) {
        res.status(400).json({ error: 'Cart is empty' });
        return;
    }
    if (!customer?.firstName || !customer?.email || !customer?.address) {
        res.status(400).json({ error: 'Missing customer info' });
        return;
    }
    if (!payment?.last4) {
        res.status(400).json({ error: 'Missing payment info' });
        return;
    }

    const subtotal = items.reduce((sum: number, i: OrderItem) => sum + i.price * i.quantity, 0);
    const orderId = `VN-${Date.now().toString(36).toUpperCase()}`;

    const order: Order = {
        id: orderId,
        items,
        customer,
        payment: {
            last4: payment.last4,
            brand: payment.brand || 'Visa',
        },
        subtotal,
        status: 'confirmed',
        createdAt: new Date().toISOString(),
    };

    orders.push(order);
    console.log(`✅ Order ${orderId}: $${subtotal.toFixed(2)} - ${items.length} items`);

    res.status(201).json({
        orderId: order.id,
        status: order.status,
        subtotal: order.subtotal,
        message: 'Order placed successfully!',
    });
});

// GET /api/orders/:id — get order status
ordersRouter.get('/:id', (req, res) => {
    const order = orders.find(o => o.id === req.params.id);
    if (!order) {
        res.status(404).json({ error: 'Order not found' });
        return;
    }
    res.json(order);
});
