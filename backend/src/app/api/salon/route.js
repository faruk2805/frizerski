import express from 'express';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();
const router = express.Router();

// GET all salons (s uključenim frizerima)
router.get('/', async (req, res) => {
  try {
    const salons = await prisma.salon.findMany({
      include: {
        stylists: true,  // učitavamo povezane radnike/frizere
      },
    });
    res.json(salons);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Greška prilikom dohvaćanja salona' });
  }
});

// GET single salon by ID
router.get('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    const salon = await prisma.salon.findUnique({
      where: { id },
      include: {
        stylists: true,
      },
    });
    if (!salon) return res.status(404).json({ error: 'Salon nije pronađen' });
    res.json(salon);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Greška prilikom dohvaćanja salona' });
  }
});

// POST create new salon
router.post('/', async (req, res) => {
  const { name, address, phone, imageUrl } = req.body;
  try {
    const newSalon = await prisma.salon.create({
      data: {
        name,
        address,
        phone,
        imageUrl,
      },
    });
    res.status(201).json(newSalon);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Greška prilikom kreiranja salona' });
  }
});

// PUT update salon by ID
router.put('/:id', async (req, res) => {
  const { id } = req.params;
  const { name, address, phone, imageUrl } = req.body;
  try {
    const updatedSalon = await prisma.salon.update({
      where: { id },
      data: {
        name,
        address,
        phone,
        imageUrl,
      },
    });
    res.json(updatedSalon);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Greška prilikom ažuriranja salona' });
  }
});

// DELETE salon by ID
router.delete('/:id', async (req, res) => {
  const { id } = req.params;
  try {
    await prisma.salon.delete({
      where: { id },
    });
    res.json({ message: 'Salon je obrisan' });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: 'Greška prilikom brisanja salona' });
  }
});

export default router;
