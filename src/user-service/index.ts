import express from 'express';
import { getSecret } from '../common/openbao-client';
import { v4 as uuidv4 } from 'uuid';

const app = express();
const PORT = process.env.USER_SERVICE_PORT || 4001;

app.use(express.json());

// In-memory user storage
const users: Record<string, { id: string; name: string; email: string }> = {};

// Fetch a secret from OpenBao at startup
(async () => {
  try {
    const secret = await getSecret('secret/data/user-service');
    console.log('Fetched secret from OpenBao:', secret);
    // You can store this in memory for later use
  } catch (err) {
    console.error('Failed to fetch secret from OpenBao:', err);
  }
})();

// Create user
app.post('/users', (req, res) => {
  const { name, email } = req.body;
  if (!name || !email) {
    return res.status(400).json({ error: 'Name and email are required' });
  }
  const id = uuidv4();
  users[id] = { id, name, email };
  res.status(201).json(users[id]);
});

// Get user by ID
app.get('/users/:id', (req, res) => {
  const user = users[req.params.id];
  if (!user) return res.status(404).json({ error: 'User not found' });
  res.json(user);
});

// Update user
app.put('/users/:id', (req, res) => {
  const user = users[req.params.id];
  if (!user) return res.status(404).json({ error: 'User not found' });
  const { name, email } = req.body;
  if (name) user.name = name;
  if (email) user.email = email;
  res.json(user);
});

// Delete user
app.delete('/users/:id', (req, res) => {
  const user = users[req.params.id];
  if (!user) return res.status(404).json({ error: 'User not found' });
  delete users[req.params.id];
  res.status(204).send();
});

// List all users
app.get('/users', (_req, res) => {
  res.json(Object.values(users));
});

app.get('/health', (_req, res) => {
  res.status(200).json({ status: 'User Service healthy' });
});

app.listen(PORT, () => {
  console.log(`User Service running on port ${PORT}`);
}); 