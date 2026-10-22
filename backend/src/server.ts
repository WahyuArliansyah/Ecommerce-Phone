import express from 'express';
import cors from 'cors';
import { pool } from './config/db';
import 'dotenv/config'
import authRoutes from './routes/auth.routes';
import brandRoutes from './routes/brand.routes';
import productRoutes from './routes/product.routes';
import discountRoutes from './routes/discount.routes';
import cartRoutes from './routes/cart.routes';
import orderRoutes from './routes/order.routes';

const app = express();

app.use(cors());
app.use(express.json());

app.use('/api/auth', authRoutes);
app.use('/api/brands', brandRoutes);
app.use('/api/products', productRoutes);
app.use('/api/discounts', discountRoutes);
app.use('/api/cart', cartRoutes);
app.use('/api/orders', orderRoutes);

app.get('/api/health', async (_req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', database: 'connected' });
  } catch (err) {
    console.error(err);
    res.status(500).json({ status: 'error', database: 'disconnected' });
  }
});

app.listen(5000, () => {
  console.log('Server berjalan di http://localhost:5000');
});