import express from 'express';
import prisma from '../../../lib/prisma.js';

const router = express.Router();

// Get all reviews
router.get('/', async (req, res) => {
  const reviews = await prisma.review.findMany({
    include: { user: true, appointment: true }
  });
  res.json(reviews);
});

// Get review by ID
router.get('/:id', async (req, res) => {
  const review = await prisma.review.findUnique({
    where: { id: req.params.id },
    include: { user: true, appointment: true }
  });
  if (!review) return res.status(404).json({ error: 'Review not found' });
  res.json(review);
});

// Create a new review
router.post('/', async (req, res) => {
  const { appointmentId, userId, rating, comment } = req.body;

  // Optional: add validation here (e.g. rating range 1-5)

  try {
    const review = await prisma.review.create({
      data: { appointmentId, userId, rating, comment },
    });
    res.status(201).json(review);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Update review by ID
router.put('/:id', async (req, res) => {
  const { rating, comment } = req.body;
  try {
    const review = await prisma.review.update({
      where: { id: req.params.id },
      data: { rating, comment },
    });
    res.json(review);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

// Delete review by ID
router.delete('/:id', async (req, res) => {
  try {
    await prisma.review.delete({
      where: { id: req.params.id },
    });
    res.json({ message: 'Review deleted' });
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
});

export default router;
