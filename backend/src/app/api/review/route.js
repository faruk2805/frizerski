import express from 'express';
import prisma from '../../../lib/prisma.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const reviews = await prisma.review.findMany();
  res.json(reviews);
});

router.get('/:id', async (req, res) => {
  const review = await prisma.review.findUnique({ where: { id: req.params.id } });
  if (!review) return res.status(404).json({ error: 'Review not found' });
  res.json(review);
});

router.post('/', async (req, res) => {
  try {
    const review = await prisma.review.create({ data: req.body });
    res.json(review);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await prisma.review.update({
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
    await prisma.review.delete({ where: { id: req.params.id } });
    res.json({ message: 'Review deleted' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
