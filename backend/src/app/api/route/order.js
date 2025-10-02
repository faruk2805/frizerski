import express from 'express';
import prisma from '../../../lib/prisma.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const orders = await prisma.order.findMany();
  res.json(orders);
});

router.get('/:id', async (req, res) => {
  const order = await prisma.order.findUnique({ where: { id: req.params.id } });
  if (!order) return res.status(404).json({ error: 'Order not found' });
  res.json(order);
});

router.post('/', async (req, res) => {
  try {
    const order = await prisma.order.create({ data: req.body });
    res.json(order);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await prisma.order.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(updated);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.order.delete({ where: { id: req.params.id } });
    res.json({ message: 'Order deleted' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
