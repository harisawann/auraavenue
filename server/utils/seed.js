// Run with: npm run seed
// Populates the database with categories, sample products, an admin user,
// a default shipping config, and a few general FAQs.
// Safe to re-run: it clears existing products/categories first (but not
// users/orders/coupons, so admin promotion and live coupons survive re-seeds).
require('dotenv').config();
const mongoose = require('mongoose');
const Product = require('../models/Product');
const Category = require('../models/Category');
const User = require('../models/User');
const ShippingConfig = require('../models/ShippingConfig');
const FAQ = require('../models/FAQ');
const HomepageSection = require('../models/HomepageSection');

const categoryDefs = [
  { name: 'Cookware', description: 'Pots, pans, and everyday cooking essentials.' },
  { name: 'Bakeware', description: 'Trays, tins, and tools for baking.' },
  { name: 'Storage', description: 'Containers and organizers for the kitchen.' },
  { name: 'Cutlery', description: 'Knives and cutting tools.' },
  { name: 'Appliances', description: 'Small kitchen appliances and gadgets.' }
];

function productDefs(categoryIdByName) {
  return [
    {
      name: 'Non-Stick Frying Pan 28cm',
      description:
        'A durable, even-heating non-stick frying pan with a comfortable heat-resistant handle. Ideal for everyday cooking — eggs, pancakes, stir-fries, and more.',
      features: ['Even heat distribution', 'Scratch-resistant non-stick coating', 'Compatible with gas and induction stoves'],
      specifications: [
        { label: 'Material', value: 'Aluminum with non-stick coating' },
        { label: 'Diameter', value: '28cm' },
        { label: 'Compatible Stoves', value: 'Gas, Induction, Electric' }
      ],
      dimensions: { length: 28, width: 28, height: 6, weight: 650, unit: 'cm', weightUnit: 'g' },
      price: 3490,
      compareAtPrice: 4200,
      discountPercentage: 17,
      category: categoryIdByName.get('Cookware'),
      tags: ['frying pan', 'non-stick', 'cookware'],
      images: [{ url: 'https://images.unsplash.com/photo-1604908554007-e0bb78a32441?w=800', alt: 'Non-stick frying pan' }],
      stock: 35,
      sku: 'AA-COOK-001',
      isFeatured: true,
      isBestSeller: true
    },
    {
      name: 'Stainless Steel Cooking Pot Set (3-Piece)',
      description:
        'A set of three stainless steel cooking pots in graduated sizes, with tempered glass lids and stay-cool handles. Built to last, easy to clean.',
      features: ['3 sizes for every meal', 'Tempered glass lids', 'Dishwasher safe'],
      specifications: [
        { label: 'Material', value: '18/10 Stainless Steel' },
        { label: 'Set Includes', value: '1.5L, 2.5L, 4L pots' }
      ],
      price: 7990,
      category: categoryIdByName.get('Cookware'),
      tags: ['pot set', 'stainless steel', 'cookware'],
      images: [{ url: 'https://images.unsplash.com/photo-1584990347449-a0fc1d8e0a7d?w=800', alt: 'Stainless steel pot set' }],
      stock: 18,
      sku: 'AA-COOK-002',
      isFeatured: true
    },
    {
      name: 'Silicone Baking Mat Set (2-Piece)',
      description:
        'Reusable silicone baking mats that fit standard half-sheet pans. Replace parchment paper for a non-stick, eco-friendly baking surface.',
      features: ['Reusable up to 3000 times', 'Heat resistant up to 230°C', 'Easy to clean'],
      price: 1690,
      category: categoryIdByName.get('Bakeware'),
      tags: ['baking mat', 'silicone', 'bakeware'],
      images: [{ url: 'https://images.unsplash.com/photo-1517433670267-08bbd4be890f?w=800', alt: 'Silicone baking mat' }],
      stock: 50,
      sku: 'AA-BAKE-001',
      isBestSeller: true
    },
    {
      name: 'Airtight Glass Storage Containers (5-Piece)',
      description:
        'A set of five airtight glass storage containers with leak-proof locking lids. Keeps pantry staples fresh and is freezer, microwave, and dishwasher safe.',
      features: ['Airtight, leak-proof seal', 'Freezer and microwave safe', 'Stackable design'],
      specifications: [{ label: 'Material', value: 'Borosilicate glass' }],
      price: 4290,
      category: categoryIdByName.get('Storage'),
      tags: ['storage', 'glass containers', 'pantry'],
      images: [{ url: 'https://images.unsplash.com/photo-1584990347449-39e1705defe5?w=800', alt: 'Glass storage containers' }],
      stock: 27,
      sku: 'AA-STOR-001',
      isFeatured: true
    },
    {
      name: 'Professional Chef Knife 8-inch',
      description:
        'A precision-forged stainless steel chef knife with a full tang and ergonomic handle, balanced for comfortable everyday use.',
      features: ['Full tang construction', 'Razor-sharp precision edge', 'Ergonomic non-slip handle'],
      specifications: [
        { label: 'Blade Material', value: 'High-carbon stainless steel' },
        { label: 'Blade Length', value: '8 inches' }
      ],
      price: 2990,
      compareAtPrice: 3500,
      discountPercentage: 15,
      category: categoryIdByName.get('Cutlery'),
      tags: ['knife', 'chef knife', 'cutlery'],
      images: [{ url: 'https://images.unsplash.com/photo-1593618998160-e34014e67546?w=800', alt: 'Chef knife' }],
      stock: 40,
      sku: 'AA-CUT-001',
      isBestSeller: true
    },
    {
      name: 'Electric Hand Mixer 5-Speed',
      description:
        'A compact electric hand mixer with 5 speed settings and stainless steel beaters. Lightweight and easy to store.',
      features: ['5 speed settings', 'Stainless steel beaters included', 'Compact and lightweight'],
      price: 3290,
      category: categoryIdByName.get('Appliances'),
      tags: ['mixer', 'appliance', 'baking'],
      images: [{ url: 'https://images.unsplash.com/photo-1574269909862-7e1d70bb8078?w=800', alt: 'Electric hand mixer' }],
      stock: 22,
      sku: 'AA-APPL-001',
      isFeatured: true
    }
  ];
}

async function seed() {
  await mongoose.connect(process.env.MONGO_URI);
  console.log('Connected to MongoDB for seeding...');

  // --- Categories ---
  await Category.deleteMany({});
  const createdCategories = [];
  for (const def of categoryDefs) {
    const category = new Category(def);
    await category.save();
    createdCategories.push(category);
  }
  const categoryIdByName = new Map(createdCategories.map((c) => [c.name, c._id]));
  console.log(`Inserted ${createdCategories.length} categories.`);

  // --- Products ---
  await Product.deleteMany({});
  const products = productDefs(categoryIdByName);
  for (const data of products) {
    const product = new Product(data);
    await product.save();
  }
  console.log(`Inserted ${products.length} sample products.`);

  // --- Shipping config (only seed defaults if it doesn't already exist) ---
  const existingShippingConfig = await ShippingConfig.findById(ShippingConfig.SINGLETON_ID);
  if (!existingShippingConfig) {
    await ShippingConfig.create({
      defaultFee: 200,
      freeShippingThreshold: 5000,
      zoneRates: [
        { zoneName: 'Karachi', fee: 150, estimatedDays: { min: 1, max: 3 } },
        { zoneName: 'Lahore', fee: 150, estimatedDays: { min: 2, max: 4 } },
        { zoneName: 'Islamabad', fee: 150, estimatedDays: { min: 2, max: 4 } }
      ],
      defaultEstimatedDays: { min: 3, max: 7 },
      shippingPolicyText:
        'We deliver across Pakistan. Orders are typically processed within 1-2 business days and delivered within the estimated window shown at checkout, depending on your city.'
    });
    console.log('Created default shipping config.');
  } else {
    console.log('Shipping config already exists, left unchanged.');
  }

  // --- General FAQs (only seed if none exist yet) ---
  const existingFaqCount = await FAQ.countDocuments({ product: null });
  if (existingFaqCount === 0) {
    await FAQ.insertMany([
      {
        question: 'What payment methods do you accept?',
        answer: 'We accept Cash on Delivery (COD), JazzCash, Easypaisa, and direct Bank Transfer.',
        category: 'Payments',
        displayOrder: 1
      },
      {
        question: 'How long does delivery take?',
        answer: 'Delivery typically takes 2-7 business days depending on your city. Estimated delivery dates are shown on each product page and at checkout.',
        category: 'Shipping',
        displayOrder: 2
      },
      {
        question: 'Can I return a product?',
        answer: 'Yes, please see our Return Policy page for full details on eligibility and the return process.',
        category: 'Returns',
        displayOrder: 3
      }
    ]);
    console.log('Inserted 3 general FAQs.');
  } else {
    console.log('General FAQs already exist, left unchanged.');
  }

  // --- Hero homepage section (only seed if it doesn't already exist) ---
  const existingHero = await HomepageSection.findOne({ key: 'hero' });
  if (!existingHero) {
    await HomepageSection.create({
      key: 'hero',
      title: 'Premium Kitchen Essentials, Delivered.',
      subtitle: 'Thoughtfully designed kitchen accessories, made to last — shipped across Pakistan.',
      ctaText: 'Shop Now',
      ctaUrl: '/shop'
    });
    console.log('Created hero homepage section.');
  } else {
    console.log('Hero homepage section already exists, left unchanged.');
  }

  // --- Admin user (only if it doesn't already exist) ---
  const adminEmail = process.env.ADMIN_EMAIL || 'admin@example.com';
  const existingAdmin = await User.findOne({ email: adminEmail });

  if (!existingAdmin) {
    await User.create({
      name: 'Store Admin',
      email: adminEmail,
      password: process.env.ADMIN_PASSWORD || 'ChangeMe123!',
      role: 'admin'
    });
    console.log(`Created admin user: ${adminEmail}`);
  } else if (existingAdmin.role !== 'admin') {
    existingAdmin.role = 'admin';
    await existingAdmin.save();
    console.log(`Promoted existing user ${adminEmail} to admin.`);
  } else {
    console.log(`Admin user ${adminEmail} already exists.`);
  }

  console.log('Seeding complete.');
  await mongoose.disconnect();
  process.exit(0);
}

seed().catch((err) => {
  console.error('Seeding failed:', err);
  process.exit(1);
});
