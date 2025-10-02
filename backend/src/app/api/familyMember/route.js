import express from 'express';
import prisma from '../../../lib/prisma.js';

const router = express.Router();

router.get('/', async (req, res) => {
  const members = await prisma.familyMember.findMany();
  res.json(members);
});

router.get('/:id', async (req, res) => {
  const member = await prisma.familyMember.findUnique({ where: { id: req.params.id } });
  if (!member) return res.status(404).json({ error: 'Family member not found' });
  res.json(member);
});

router.post('/', async (req, res) => {
  try {
    const member = await prisma.familyMember.create({ data: req.body });
    res.json(member);
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

router.put('/:id', async (req, res) => {
  try {
    const updated = await prisma.familyMember.update({
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
    await prisma.familyMember.delete({ where: { id: req.params.id } });
    res.json({ message: 'Family member deleted' });
  } catch (e) {
    res.status(400).json({ error: e.message });
  }
});

export default router;
