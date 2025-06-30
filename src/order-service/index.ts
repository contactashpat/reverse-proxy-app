import express from 'express';
import { getSecret } from '../common/openbao-client';
import { v4 as uuidv4 } from 'uuid';
import fetch from 'node-fetch';

const app = express();
const PORT = process.env.ORDER_SERVICE_PORT || 4002;
const USER_SERVICE_URL = process.env.USER_SERVICE_URL || 'http://localhost:4001';

app.use(express.json());

// In-memory order storage
const orders: Record<string, { id: string; userId: string; item: string; quantity: number }> = {};

// Fetch a secret from OpenBao at startup
(async () => {
  try {
    const secret = await getSecret('secret/data/order-service');
    console.log('Fetched secret from OpenBao:', secret);
    // You can store this in memory for later use
  } catch (err) {
    console.error('Failed to fetch secret from OpenBao:', err);
  }
})();

// Create order (validate user via user-service)
app.post('/orders', async (req, res) => {
  const { userId, item, quantity } = req.body;
  if (!userId || !item || typeof quantity !== 'number') {
    return res.status(400).json({ error: 'userId, item, and quantity are required' });
  }
  // Validate user via user-service
  try {
    const userRes = await fetch(`${USER_SERVICE_URL}/users/${userId}`);
    if (!userRes.ok) {
      return res.status(400).json({ error: 'Invalid userId: user does not exist' });
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : String(err);
    return res.status(500).json({ error: 'Failed to validate user', details: message });
  }
  const id = uuidv4();
  orders[id] = { id, userId, item, quantity };
  res.status(201).json(orders[id]);
});

// Get order by ID
app.get('/orders/:id', (req, res) => {
  const order = orders[req.params.id];
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

// Update order
app.put('/orders/:id', (req, res) => {
  const order = orders[req.params.id];
  if (!order) return res.status(404).json({ error: 'Order not found' });
  const { item, quantity } = req.body;
  if (item) order.item = item;
  if (typeof quantity === 'number') order.quantity = quantity;
  res.json(order);
});

// Delete order
app.delete('/orders/:id', (req, res) => {
  const order = orders[req.params.id];
  if (!order) return res.status(404).json({ error: 'Order not found' });
  delete orders[req.params.id];
  res.status(204).send();
});

// List all orders
app.get('/orders', (_req, res) => {
  res.json(Object.values(orders));
});

// List all orders for a user
app.get('/orders/user/:userId', (req, res) => {
  const userOrders = Object.values(orders).filter(order => order.userId === req.params.userId);
  res.json(userOrders);
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'Order Service healthy' });
});

app.listen(PORT, () => {
  console.log(`Order Service running on port ${PORT}`);
}); 