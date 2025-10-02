import express from 'express';
import prisma from '../../../lib/prisma.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const shifts = await prisma.workShift.findMany();
  res.json(shifts);
});

router.get('/:id', async (req, res) => {
  const shift = await prisma.workShift.findUnique({ where: { id: req.params.id } });
  if (!shift) return res.status(404).json({ error: 'WorkShift not found' });
  res.json(shift);
});

router.post('/', async (req, res) => {
  try {
    const shift = await prisma.workShift.create({ data: req.body });
    res.status(201).json(shift);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await prisma.workShift.update({
      where: { id: req.params.id },
      data: req.body,
    });
    res.json(updated);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete('/:id', async (req, res) => {
  try {
    await prisma.workShift.delete({ where: { id: req.params.id } });
    res.json({ message: 'WorkShift deleted' });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

export default router;
