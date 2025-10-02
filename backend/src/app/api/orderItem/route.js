import express from 'express';
import prisma from '../../../lib/prisma.js';

const router = express.Router();

// Dohvati sve order items sa relacijama
router.get('/', async (req, res) => {
  try {
    const items = await prisma.orderItem.findMany({
      include: {
        order: {
          include: {
            user: true
          }
        },
        product: true
      },
      orderBy: {
        createdAt: 'desc'
      }
    });
    res.json(items);
  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to fetch order items',
      details: err.message 
    });
  }
});

// Dohvati pojedinačni order item sa relacijama
router.get('/:id', async (req, res) => {
  try {
    const item = await prisma.orderItem.findUnique({
      where: { id: req.params.id },
      include: {
        order: {
          include: {
            user: true
          }
        },
        product: true
      }
    });
    
    if (!item) {
      return res.status(404).json({ error: 'Order item not found' });
    }
    
    res.json(item);
  } catch (err) {
    res.status(500).json({ 
      error: 'Failed to fetch order item',
      details: err.message 
    });
  }
});

// Kreiraj novi order item
router.post('/', async (req, res) => {
  try {
    const { orderId, productId, quantity, price } = req.body;

    // Validacija
    if (!orderId || !productId || !quantity || !price) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    if (quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than 0' });
    }

    if (price <= 0) {
      return res.status(400).json({ error: 'Price must be greater than 0' });
    }

    // Provjeri da li order i product postoje
    const [order, product] = await Promise.all([
      prisma.order.findUnique({ where: { id: orderId } }),
      prisma.product.findUnique({ where: { id: productId } })
    ]);

    if (!order) {
      return res.status(404).json({ error: 'Order not found' });
    }

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    // Provjeri dostupnu količinu
    if (product.stock < quantity) {
      return res.status(400).json({ 
        error: `Not enough stock for product: ${product.name}`,
        availableStock: product.stock
      });
    }

    // Kreiraj order item
    const item = await prisma.orderItem.create({
      data: {
        quantity,
        price,
        order: { connect: { id: orderId } },
        product: { connect: { id: productId } }
      },
      include: {
        order: true,
        product: true
      }
    });

    // Ažuriraj stanje zaliha
    await prisma.product.update({
      where: { id: productId },
      data: { stock: { decrement: quantity } }
    });

    // Ažuriraj ukupnu cijenu narudžbe
    await updateOrderTotal(orderId);

    res.status(201).json(item);
  } catch (err) {
    console.error('Error creating order item:', err);
    res.status(500).json({ 
      error: 'Failed to create order item',
      details: err.message 
    });
  }
});

// Ažuriraj order item
router.put('/:id', async (req, res) => {
  try {
    const { quantity, price } = req.body;
    const itemId = req.params.id;

    // Validacija
    if (quantity && quantity <= 0) {
      return res.status(400).json({ error: 'Quantity must be greater than 0' });
    }

    if (price && price <= 0) {
      return res.status(400).json({ error: 'Price must be greater than 0' });
    }

    // Dohvati postojeći item
    const existingItem = await prisma.orderItem.findUnique({
      where: { id: itemId },
      include: { product: true }
    });

    if (!existingItem) {
      return res.status(404).json({ error: 'Order item not found' });
    }

    // Provjeri stanje zaliha ako se mijenja količina
    if (quantity && quantity !== existingItem.quantity) {
      const difference = quantity - existingItem.quantity;
      if (existingItem.product.stock < difference) {
        return res.status(400).json({ 
          error: `Not enough stock for product: ${existingItem.product.name}`,
          availableStock: existingItem.product.stock
        });
      }
    }

    // Ažuriraj item
    const updatedItem = await prisma.orderItem.update({
      where: { id: itemId },
      data: { quantity, price },
      include: {
        order: true,
        product: true
      }
    });

    // Ažuriraj stanje zaliha ako je promijenjena količina
    if (quantity && quantity !== existingItem.quantity) {
      const difference = quantity - existingItem.quantity;
      await prisma.product.update({
        where: { id: existingItem.productId },
        data: { stock: { decrement: difference } }
      });
    }

    // Ažuriraj ukupnu cijenu narudžbe
    await updateOrderTotal(updatedItem.orderId);

    res.json(updatedItem);
  } catch (err) {
    console.error('Error updating order item:', err);
    res.status(500).json({ 
      error: 'Failed to update order item',
      details: err.message 
    });
  }
});

// Obriši order item
router.delete('/:id', async (req, res) => {
  try {
    const itemId = req.params.id;

    // Dohvati item za orderId i productId
    const item = await prisma.orderItem.findUnique({
      where: { id: itemId },
      include: { product: true }
    });

    if (!item) {
      return res.status(404).json({ error: 'Order item not found' });
    }

    // Obriši item
    await prisma.orderItem.delete({ where: { id: itemId } });

    // Vrati količinu na zalihu
    await prisma.product.update({
      where: { id: item.productId },
      data: { stock: { increment: item.quantity } }
    });

    // Ažuriraj ukupnu cijenu narudžbe
    await updateOrderTotal(item.orderId);

    res.json({ message: 'Order item deleted successfully' });
  } catch (err) {
    console.error('Error deleting order item:', err);
    res.status(500).json({ 
      error: 'Failed to delete order item',
      details: err.message 
    });
  }
});

// Pomoćna funkcija za ažuriranje ukupne cijene narudžbe
async function updateOrderTotal(orderId) {
  const items = await prisma.orderItem.findMany({
    where: { orderId }
  });

  const total = items.reduce((sum, item) => {
    return sum + (item.price * item.quantity);
  }, 0);

  await prisma.order.update({
    where: { id: orderId },
    data: { total }
  });
}

export default router;