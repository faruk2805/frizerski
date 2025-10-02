import { PrismaClient } from '@prisma/client';
import { config } from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';

// Konfiguracija putanje i env varijabli
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
config({ path: path.resolve(__dirname, '../.env') });

const prisma = new PrismaClient();

async function main() {
  console.log('🚀 Pokrećem seeding proizvoda...');

  // Dohvaćanje postojećih kategorija
  const categories = await prisma.category.findMany();
  const categoryMap = {};
  categories.forEach(cat => {
    categoryMap[cat.name] = cat.id;
  });

  // Lista proizvoda za dodavanje (12 ukupno)
  const products = [
    // Šamponi (3 proizvoda)
    {
      name: 'Šampon za osjetljivu kožu glave',
      description: 'Bez sulfata i parabena',
      price: 25.99,
      stock: 40,
      categoryName: 'Šamponi',
      imageUrl: '/images/products/shampoo-sensitive.jpg'
    },
    {
      name: 'Hladni šampon za muškarce',
      description: 'Osvježavajući efekt mentola',
      price: 22.50,
      stock: 35,
      categoryName: 'Šamponi',
      imageUrl: '/images/products/shampoo-cooling.jpg'
    },

    // Kreme za brijanje (3 proizvoda)
    {
      name: 'Krema za brijanje s mentolom',
      description: 'Osvježava kožu tokom brijanja',
      price: 19.99,
      stock: 25,
      categoryName: 'Kreme za brijanje',
      imageUrl: '/images/products/shaving-cream-menthol.jpg'
    },
    {
      name: 'Premium brijački gel',
      description: 'Za glatko i sigurno brijanje',
      price: 24.50,
      stock: 30,
      categoryName: 'Kreme za brijanje',
      imageUrl: '/images/products/shaving-gel.jpg'
    },

    // Ulja za bradu (3 proizvoda)
    {
      name: 'Ulje za bradu s aromom drveta',
      description: 'Hidratira i njeguje bradu',
      price: 28.99,
      stock: 20,
      categoryName: 'Ulja za bradu',
      imageUrl: '/images/products/beard-oil-wood.jpg'
    },
    {
      name: 'Kondicioner za bradu',
      description: 'Omekšava i ukljaštenje bradu',
      price: 23.50,
      stock: 25,
      categoryName: 'Ulja za bradu',
      imageUrl: '/images/products/beard-conditioner.jpg'
    },

    // Stilizacija (3 proizvoda)
    {
      name: 'Mat efekt gel',
      description: 'Bez sjaja, prirodan izgled',
      price: 18.99,
      stock: 45,
      categoryName: 'Stilizacija',
      imageUrl: '/images/products/matte-gel.jpg'
    },
    {
      name: 'Srednje čvrsta glina',
      description: 'Za teksturiranje kose',
      price: 21.50,
      stock: 30,
      categoryName: 'Stilizacija',
      imageUrl: '/images/products/clay-medium.jpg'
    },

    // Pribor (3 proizvoda)
    {
      name: 'Mašinica za šišanje',
      description: 'Precizno šišanje sa 5 nastavaka',
      price: 95.99,
      stock: 15,
      categoryName: 'Pribor',
      imageUrl: '/images/products/hair-clipper.jpg'
    },
    {
      name: 'Četka za šišanje',
      description: 'Profesionalna četka za precizno šišanje',
      price: 12.99,
      stock: 50,
      categoryName: 'Pribor',
      imageUrl: '/images/products/barber-brush.jpg'
    },
    {
      name: 'Ogledalo za brijačnicu',
      description: 'Profesionalno ogledalo sa osvjetljenjem',
      price: 65.00,
      stock: 8,
      categoryName: 'Pribor',
      imageUrl: '/images/products/barber-mirror.jpg'
    },
    {
      name: 'Brijački nož',
      description: 'Ručno izrađen profesionalni nož',
      price: 120.00,
      stock: 5,
      categoryName: 'Pribor',
      imageUrl: '/images/products/straight-razor.jpg'
    }
  ];

  // Kreiranje proizvoda
  for (const product of products) {
    try {
      const categoryId = categoryMap[product.categoryName];
      
      if (!categoryId) {
        console.warn(`⚠ Kategorija "${product.categoryName}" ne postoji!`);
        continue;
      }

      // Prvo provjerimo postoji li proizvod
      const existingProduct = await prisma.product.findFirst({
        where: {
          name: product.name,
          categoryId: categoryId
        }
      });

      if (existingProduct) {
        console.log(`ℹ Proizvod već postoji: ${product.name}`);
        continue;
      }

      // Ako ne postoji, kreiramo novi
      await prisma.product.create({
        data: {
          name: product.name,
          description: product.description,
          price: product.price,
          stock: product.stock,
          imageUrl: product.imageUrl,
          categoryId: categoryId,
          isActive: true
        }
      });
      console.log(`✔ ${product.name} uspješno dodan`);
    } catch (error) {
      console.error(`❌ Greška pri dodavanju ${product.name}:`, error.message);
    }
  }

  console.log('✅ Ukupno dodano proizvoda:', products.length);
}

main()
  .catch(e => {
    console.error('💥 Greška:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });