import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { productsRouter } from './routes/products.js';
import { ordersRouter } from './routes/orders.js';
import { voiceRouter } from './routes/voice.js';

const app = express();
const PORT = process.env.PORT || 3001;

app.use(cors({ origin: ['http://localhost:5173', 'http://localhost:4173'] }));
app.use(express.json());

// Routes
app.use('/api/products', productsRouter);
app.use('/api/orders', ordersRouter);
app.use('/api/voice-command', voiceRouter);

// Health check
app.get('/api/health', (_req, res) => {
    res.json({
        status: 'ok',
        gemini: !!process.env.GEMINI_API_KEY,
        timestamp: new Date().toISOString(),
    });
});

app.listen(PORT, () => {
    console.log(`\n  🚀 V-Novaa API running at http://localhost:${PORT}`);
    console.log(`  📦 Products:  GET  /api/products`);
    console.log(`  🛒 Orders:    POST /api/orders`);
    console.log(`  🎤 Voice:     POST /api/voice-command`);
    console.log(`  🧠 Gemini:    ${process.env.GEMINI_API_KEY ? '✅ configured' : '❌ missing GEMINI_API_KEY'}\n`);
});
