import express from 'express';
import prisma from '../../../lib/prisma.js';

const router = express.Router();

// GET all products with filters and pagination
router.get('/', async (req, res) => {
  try {
    const { 
      page = 1, 
      limit = 10,
      category,
      minPrice,
      maxPrice,
      search
    } = req.query;

    const skip = (page - 1) * limit;
    const where = {
      isActive: true,
      ...(category && { category: { name: category } }),
      ...(minPrice && { price: { gte: parseFloat(minPrice) } }),
      ...(maxPrice && { price: { lte: parseFloat(maxPrice) } }),
      ...(search && {
        OR: [
          { name: { contains: search, mode: 'insensitive' } },
          { description: { contains: search, mode: 'insensitive' } }
        ]
      })
    };

    const [products, total] = await Promise.all([
      prisma.product.findMany({
        where,
        include: { category: true },
        skip,
        take: parseInt(limit),
        orderBy: { createdAt: 'desc' }
      }),
      prisma.product.count({ where })
    ]);

    res.json({
      data: products,
      meta: {
        total,
        page: parseInt(page),
        limit: parseInt(limit),
        totalPages: Math.ceil(total / limit)
      }
    });
  } catch (err) {
    console.error('GET /products error:', err);
    res.status(500).json({ 
      error: 'Failed to fetch products',
      details: err.message 
    });
  }
});

// GET product by ID
router.get('/:id', async (req, res) => {
  try {
    const product = await prisma.product.findUnique({
      where: { id: req.params.id },
      include: { category: true }
    });

    if (!product) {
      return res.status(404).json({ error: 'Product not found' });
    }

    res.json(product);
  } catch (err) {
    console.error('GET /products/:id error:', err);
    res.status(500).json({ 
      error: 'Failed to fetch product',
      details: err.message 
    });
  }
});

// POST create new product (admin only)
router.post('/', async (req, res) => {
  try {
    const { name, description, price, stock, categoryId, imageUrl } = req.body;

    if (!name || !price || !stock) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const product = await prisma.product.create({
      data: {
        name,
        description,
        price: parseFloat(price),
        stock: parseInt(stock),
        categoryId,
        imageUrl
      },
      include: { category: true }
    });

    res.status(201).json(product);
  } catch (err) {
    console.error('POST /products error:', err);
    res.status(500).json({ 
      error: 'Failed to create product',
      details: err.message 
    });
  }
});

// PUT update product (admin only)
router.put('/:id', async (req, res) => {
  try {
    const { name, description, price, stock, categoryId, imageUrl, isActive } = req.body;

    const updated = await prisma.product.update({
      where: { id: req.params.id },
      data: {
        ...(name && { name }),
        ...(description && { description }),
        ...(price && { price: parseFloat(price) }),
        ...(stock && { stock: parseInt(stock) }),
        ...(categoryId && { categoryId }),
        ...(imageUrl && { imageUrl }),
        ...(isActive !== undefined && { isActive })
      },
      include: { category: true }
    });

    res.json(updated);
  } catch (err) {
    console.error('PUT /products/:id error:', err);
    res.status(500).json({ 
      error: 'Failed to update product',
      details: err.message 
    });
  }
});

// DELETE product (admin only)
router.delete('/:id', async (req, res) => {
  try {
    // Soft delete by setting isActive to false
    await prisma.product.update({
      where: { id: req.params.id },
      data: { isActive: false }
    });

    res.json({ message: 'Product deactivated successfully' });
  } catch (err) {
    console.error('DELETE /products/:id error:', err);
    res.status(500).json({ 
      error: 'Failed to deactivate product',
      details: err.message 
    });
  }
});

// POST verify products and get current prices
router.post('/verify', async (req, res) => {
  try {
    const { productIds } = req.body;

    const products = await prisma.product.findMany({
      where: {
        id: { in: productIds },
        isActive: true
      },
      select: {
        id: true,
        price: true,
        stock: true,
        name: true
      }
    });

    // Check if all products were found
    if (products.length !== productIds.length) {
      const missingIds = productIds.filter(id => 
        !products.some(p => p.id === id)
      );
      return res.status(404).json({
        error: 'Some products not found',
        missingIds
      });
    }

    res.json(products);
  } catch (err) {
    console.error('POST /products/verify error:', err);
    res.status(500).json({ 
      error: 'Failed to verify products',
      details: err.message 
    });
  }
});

export default router;