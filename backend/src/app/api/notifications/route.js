import express from 'express';
import prisma from '../../../lib/prisma.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const notifications = await prisma.notification.findMany();
  res.json(notifications);
});

router.get('/:id', async (req, res) => {
  const notification = await prisma.notification.findUnique({ where: { id: req.params.id } });
  if (!notification) return res.status(404).json({ error: 'Notification not found' });
  res.json(notification);
});

router.post('/', async (req, res) => {
  try {
    const notification = await prisma.notification.create({ data: req.body });

    const io = req.app.get('io'); 
    io.emit('new-notification', notification); 
    res.json(notification);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await prisma.notification.update({
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
    await prisma.notification.delete({ where: { id: req.params.id } });
    res.json({ message: 'Notification deleted' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
