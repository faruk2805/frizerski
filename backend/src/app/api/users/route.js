import express from 'express';
import prisma from '../../../lib/prisma.js';

const router = express.Router();

router.get('/', async (req, res) => {
  try {
    const users = await prisma.user.findMany({
      include: {
        stylistServices: true, // Ovo će biti niz (prazan za ne-styliste)
      },
    });

    // Opcionalno: možeš filtrirati/transformirati odgovor da ukloniš stylistServices kod ne-stylista, ako želiš
    const result = users.map(user => {
      if (user.role !== 'STYLIST') {
        // izbaci stylistServices ako nije stylist
        const { stylistServices, ...rest } = user;
        return rest;
      }
      return user; // ostavi stylistove usluge
    });

    res.json(result);
  } catch (error) {
    console.error('Greška prilikom dohvaćanja korisnika:', error);
    res.status(500).json({ error: 'Greška na serveru' });
  }
});


router.get('/:id', async (req, res) => {
  const user = await prisma.user.findUnique({ where: { id: req.params.id } });
  res.json(user);
});

router.post('/', async (req, res) => {
  const user = await prisma.user.create({ data: req.body });
  res.json(user);
});

router.put('/:id', async (req, res) => {
  const updated = await prisma.user.update({
    where: { id: req.params.id },
    data: req.body
  });
  res.json(updated);
});

router.delete('/:id', async (req, res) => {
  await prisma.user.delete({ where: { id: req.params.id } });
  res.json({ message: 'Deleted' });
});


export default router;
