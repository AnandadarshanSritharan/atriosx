import mongoose from 'mongoose';
import dotenv from 'dotenv';
import bcrypt from 'bcryptjs';

dotenv.config();

import User from '../src/models/User';
import FacilityCategory from '../src/models/FacilityCategory';
import Facility from '../src/models/Facility';
import ExpenseCategory from '../src/models/ExpenseCategory';
import BusinessSettings from '../src/models/BusinessSettings';
import Game from '../src/models/Game';
import Partner from '../src/models/Partner';
import Offer from '../src/models/Offer';
import News from '../src/models/News';

export const seedDatabase = async () => {
  try {
    console.log('Seeding Atrios Entertainment database...');

    // BusinessSettings (singleton)
    await BusinessSettings.findOneAndUpdate(
      {},
      {
        businessName: 'Atrios Entertainment',
        phone: '+94 77 123 4567',
        email: 'info@atriosentertainment.com',
        address: 'No. 45, Galle Road, Colombo 03, Sri Lanka',
        website: 'https://atriosentertainment.com',
        socialLinks: {
          instagram: 'https://instagram.com/atriosentertainment',
          facebook: 'https://facebook.com/atriosentertainment',
          tiktok: 'https://tiktok.com/@atriosentertainment',
          whatsapp: '+94771234567',
        },
        businessHours: {
          monday: { open: '10:00', close: '23:00', closed: false },
          tuesday: { open: '10:00', close: '23:00', closed: false },
          wednesday: { open: '10:00', close: '23:00', closed: false },
          thursday: { open: '10:00', close: '23:00', closed: false },
          friday: { open: '10:00', close: '00:00', closed: false },
          saturday: { open: '09:00', close: '00:00', closed: false },
          sunday: { open: '09:00', close: '23:00', closed: false },
        },
        bookingSettings: {
          minDurationMinutes: 30,
          maxDurationMinutes: 240,
          intervalMinutes: 30,
          advanceBookingDays: 30,
          cancellationHours: 2,
          bufferTimeMinutes: 0,
        },
        financialSettings: {
          currency: 'LKR',
          currencySymbol: 'Rs.',
          currencyPosition: 'before',
          taxRate: 0,
          defaultPaymentStatus: 'unpaid',
          profitCalculationMethod: 'investment',
        },
        websiteSettings: {
          heroTitle: 'ATRIOS ENTERTAINMENT',
          heroSubtitle: 'Play. Compete. Experience.',
          metaTitle: 'Atrios Entertainment | Premium Gaming & Lounge',
          metaDescription: 'High-end entertainment lounge featuring PS5 consoles, professional racing cockpits, table tennis, and carrom.',
        },
      },
      { upsert: true, new: true }
    );
    console.log('✅ Business Settings configured');

    // Admin Users
    const adminPassword = await bcrypt.hash(process.env.SEED_ADMIN_PASSWORD || 'Admin@123', 12);
    await User.findOneAndUpdate(
      { email: 'admin@atrios.lk' },
      {
        email: 'admin@atrios.lk',
        password: adminPassword,
        name: 'Super Admin',
        role: 'superadmin',
        active: true,
      },
      { upsert: true }
    );

    const managerPassword = await bcrypt.hash('Manager@123', 12);
    await User.findOneAndUpdate(
      { email: 'manager@atrios.lk' },
      {
        email: 'manager@atrios.lk',
        password: managerPassword,
        name: 'Lounge Manager',
        role: 'manager',
        active: true,
      },
      { upsert: true }
    );
    console.log('✅ Admin users ready (admin@atrios.lk / Admin@123)');

    // Categories
    const categories = [
      { name: 'PlayStation 5', slug: 'playstation', icon: 'Gamepad2', displayOrder: 1 },
      { name: 'Racing Cockpit', slug: 'racing-cockpit', icon: 'Gauge', displayOrder: 2 },
      { name: 'Table Tennis', slug: 'table-tennis', icon: 'Activity', displayOrder: 3 },
      { name: 'Carrom', slug: 'carrom', icon: 'Target', displayOrder: 4 },
    ];

    const categoryMap: Record<string, any> = {};
    for (const cat of categories) {
      const saved = await FacilityCategory.findOneAndUpdate(
        { slug: cat.slug },
        cat,
        { upsert: true, new: true }
      );
      categoryMap[cat.slug] = saved._id;
    }
    console.log('✅ Facility Categories ready');

    // Facilities (Initial Seed Records)
    const facilities = [
      {
        name: 'PS5 1',
        category: categoryMap['playstation'],
        description: 'PlayStation 5 setup with 4K HDR 120Hz display and DualSense wireless controllers.',
        hourlyRate: 800,
        halfHourRate: 500,
        pricingTiers: [
          { persons: 1, hourlyRate: 800, halfHourRate: 500 },
          { persons: 2, hourlyRate: 1000, halfHourRate: 600 },
          { persons: 3, hourlyRate: 1200, halfHourRate: 700 },
          { persons: 4, hourlyRate: 1400, halfHourRate: 800 },
        ],
        minPersons: 1,
        maxPersons: 4,
        color: '#3d85c8',
        active: true,
        bookingEnabled: true,
        minDurationMinutes: 30,
        maxDurationMinutes: 240,
        displayOrder: 1,
        features: ['4K 120Hz OLED Display', '2x DualSense Controllers', 'Surround Sound Headphones', 'All Latest Titles'],
        rules: ['No food or open drinks near consoles', 'Handle controllers with care'],
      },
      {
        name: 'PS5 2',
        category: categoryMap['playstation'],
        description: 'PlayStation 5 competitive setup with low-latency gaming monitor and DualSense Edge controller support.',
        hourlyRate: 800,
        halfHourRate: 500,
        pricingTiers: [
          { persons: 1, hourlyRate: 800, halfHourRate: 500 },
          { persons: 2, hourlyRate: 1000, halfHourRate: 600 },
          { persons: 3, hourlyRate: 1200, halfHourRate: 700 },
          { persons: 4, hourlyRate: 1400, halfHourRate: 800 },
        ],
        minPersons: 1,
        maxPersons: 4,
        color: '#5b9bd5',
        active: true,
        bookingEnabled: true,
        minDurationMinutes: 30,
        maxDurationMinutes: 240,
        displayOrder: 2,
        features: ['Ultra-Fast Gaming Monitor', 'DualSense Edge Controllers', 'Low Latency Audio'],
        rules: ['No food or open drinks near consoles', 'Handle controllers with care'],
      },
      {
        name: 'Cockpit 1',
        category: categoryMap['racing-cockpit'],
        description: 'Professional direct-drive sim racing cockpit with force feedback wheel, load cell pedals, and triple-screen display.',
        hourlyRate: 1500,
        halfHourRate: 900,
        pricingTiers: [
          { persons: 1, hourlyRate: 1500, halfHourRate: 900 },
        ],
        minPersons: 1,
        maxPersons: 1,
        color: '#9b59b6',
        active: true,
        bookingEnabled: true,
        minDurationMinutes: 30,
        maxDurationMinutes: 180,
        displayOrder: 3,
        features: ['Direct Drive Force Feedback', 'Load Cell Hydraulic Pedals', 'Triple Monitor Immersion', 'F1 & GT Rims'],
        rules: ['Racing shoes or socks only', 'Adjust seat before starting your session'],
      },
      {
        name: 'Cockpit 2',
        category: categoryMap['racing-cockpit'],
        description: 'Pro sim rig with motion platform, tactile feedback, and VR headset option for ultimate immersion.',
        hourlyRate: 1500,
        halfHourRate: 900,
        pricingTiers: [
          { persons: 1, hourlyRate: 1500, halfHourRate: 900 },
        ],
        minPersons: 1,
        maxPersons: 1,
        color: '#8e44ad',
        active: true,
        bookingEnabled: true,
        minDurationMinutes: 30,
        maxDurationMinutes: 180,
        displayOrder: 4,
        features: ['Haptic Feedback Chassis', 'Sim Racing Pedals', 'High Refresh Rate Ultrawide Display'],
        rules: ['Racing shoes or socks only', 'Adjust seat before starting your session'],
      },
      {
        name: 'Table Tennis 1',
        category: categoryMap['table-tennis'],
        description: 'Tournament-grade indoor table tennis arena with competition lighting and professional paddles.',
        hourlyRate: 800,
        halfHourRate: 500,
        pricingTiers: [
          { persons: 2, hourlyRate: 800, halfHourRate: 500 },
          { persons: 4, hourlyRate: 1200, halfHourRate: 700 },
        ],
        minPersons: 2,
        maxPersons: 4,
        color: '#27ae60',
        active: true,
        bookingEnabled: true,
        minDurationMinutes: 30,
        maxDurationMinutes: 180,
        displayOrder: 5,
        features: ['ITTF Approved Table', 'Pro Carbon Paddles', 'Dedicated Arena Lighting', 'Spacious Playing Area'],
        rules: ['Non-marking athletic shoes required', 'Maximum 4 players at table'],
      },
      {
        name: 'Carrom Board 1',
        category: categoryMap['carrom'],
        description: 'Official championship champion-size carrom board with smooth acrylic surface, pro coins and powder.',
        hourlyRate: 500,
        halfHourRate: 300,
        pricingTiers: [
          { persons: 2, hourlyRate: 500, halfHourRate: 300 },
          { persons: 4, hourlyRate: 800, halfHourRate: 500 },
        ],
        minPersons: 2,
        maxPersons: 4,
        color: '#e67e22',
        active: true,
        bookingEnabled: true,
        minDurationMinutes: 30,
        maxDurationMinutes: 180,
        displayOrder: 6,
        features: ['English Birch Plywood Board', 'Championship Coins & Striker', 'Surco French Powder', 'Professional Corner Nets'],
        rules: ['Use designated carrom powder only', 'No coins to leave the playing surface'],
      },
    ];

    for (const fac of facilities) {
      await Facility.findOneAndUpdate({ name: fac.name }, fac, { upsert: true });
    }
    console.log('✅ Facilities seeded (PS5 1, PS5 2, Cockpit 1, Cockpit 2, Table Tennis 1, Carrom Board 1)');

    // Expense Categories
    const expenseCategories = [
      'Rent', 'Electricity', 'Internet', 'Staff Salaries', 'Maintenance & Repairs',
      'Gaming Equipment', 'New Games & Licenses', 'Marketing & Social Media', 'Cleaning & Sanitation', 'Utilities', 'Other'
    ];
    for (const name of expenseCategories) {
      await ExpenseCategory.findOneAndUpdate({ name }, { name, active: true }, { upsert: true });
    }
    console.log('✅ Expense Categories ready');

    // Games Library
    const games = [
      {
        title: 'EA Sports FC 25',
        platform: 'PS5',
        facilityCategory: categoryMap['playstation'],
        category: 'Sports',
        description: 'Next-gen football action featuring HyperMotionV technology and full club licensing.',
        coverImage: 'https://images.unsplash.com/photo-1579952363873-27f3bade9f55?w=400&q=80',
        active: true,
        featured: true,
        displayOrder: 1,
      },
      {
        title: 'Tekken 8',
        platform: 'PS5',
        facilityCategory: categoryMap['playstation'],
        category: 'Fighting',
        description: 'The legendary fighting franchise returns with unreal engine 5 visuals and aggressive battle mechanics.',
        coverImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?w=400&q=80',
        active: true,
        featured: true,
        displayOrder: 2,
      },
      {
        title: 'Gran Turismo 7',
        platform: 'Racing Cockpit / PS5',
        facilityCategory: categoryMap['racing-cockpit'],
        category: 'Racing',
        description: 'The real driving simulator. Over 400 cars across 90 track routes with true-to-life physics.',
        coverImage: 'https://images.unsplash.com/photo-1568605117036-5fe5e7bab0b7?w=400&q=80',
        active: true,
        featured: true,
        displayOrder: 3,
      },
      {
        title: 'Mortal Kombat 1',
        platform: 'PS5',
        facilityCategory: categoryMap['playstation'],
        category: 'Fighting',
        description: 'A reborn Mortal Kombat universe created by the Fire God Liu Kang with kameo fighters.',
        coverImage: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?w=400&q=80',
        active: true,
        featured: true,
        displayOrder: 4,
      },
      {
        title: 'Call of Duty: Modern Warfare III',
        platform: 'PS5',
        facilityCategory: categoryMap['playstation'],
        category: 'Shooter',
        description: 'Adrenaline-packed multiplayer featuring iconic modernized maps and weapon customization.',
        coverImage: 'https://images.unsplash.com/photo-1538481199705-c710c4e965fc?w=400&q=80',
        active: true,
        featured: true,
        displayOrder: 5,
      },
      {
        title: 'Assetto Corsa Competizione',
        platform: 'Racing Cockpit',
        facilityCategory: categoryMap['racing-cockpit'],
        category: 'Sim Racing',
        description: 'The official GT World Challenge racing simulator featuring laser-scanned circuits and real driver telemetry.',
        coverImage: 'https://images.unsplash.com/photo-1511919884226-fd3cad34687c?w=400&q=80',
        active: true,
        featured: true,
        displayOrder: 6,
      },
    ];
    for (const g of games) {
      await Game.findOneAndUpdate({ title: g.title }, g, { upsert: true });
    }
    console.log('✅ Games seeded');

    // 4 Business Partners (Dynamic Profit Sharing)
    const partners = [
      {
        name: 'Partner A',
        email: 'partner.a@atrios.lk',
        phone: '+94 77 100 0001',
        initialInvestment: 4000000,
        totalInvestment: 4000000,
        ownershipPercentage: 40,
        percentageType: 'calculated',
        active: true,
        notes: 'Lead Partner / Founding Investor',
      },
      {
        name: 'Partner B',
        email: 'partner.b@atrios.lk',
        phone: '+94 77 100 0002',
        initialInvestment: 3000000,
        totalInvestment: 3000000,
        ownershipPercentage: 30,
        percentageType: 'calculated',
        active: true,
        notes: 'Operations & Strategy',
      },
      {
        name: 'Partner C',
        email: 'partner.c@atrios.lk',
        phone: '+94 77 100 0003',
        initialInvestment: 2000000,
        totalInvestment: 2000000,
        ownershipPercentage: 20,
        percentageType: 'calculated',
        active: true,
        notes: 'Technology & Marketing',
      },
      {
        name: 'Partner D',
        email: 'partner.d@atrios.lk',
        phone: '+94 77 100 0004',
        initialInvestment: 1000000,
        totalInvestment: 1000000,
        ownershipPercentage: 10,
        percentageType: 'calculated',
        active: true,
        notes: 'Facility Management',
      },
    ];

    for (const p of partners) {
      await Partner.findOneAndUpdate({ name: p.name }, p, { upsert: true });
    }
    console.log('✅ 4 Business Partners seeded (40%, 30%, 20%, 10%)');

    // Sample Active Offers
    const ps5 = await Facility.findOne({ name: 'PS5 1' });
    const cockpit = await Facility.findOne({ name: 'Cockpit 1' });

    const now = new Date();
    const futureDate = new Date();
    futureDate.setDate(futureDate.getDate() + 60);

    const offers = [
      {
        title: 'Weekend Night Owl Special',
        description: 'Get 20% off all bookings after 9:00 PM on Fridays and Saturdays.',
        discountType: 'percentage',
        discountValue: 20,
        code: 'NIGHTOWL20',
        applicableFacilities: [ps5?._id, cockpit?._id].filter(Boolean),
        startDate: now,
        endDate: futureDate,
        expiryDate: futureDate,
        active: true,
        featured: true,
        displayOrder: 1,
        terms: 'Valid on bookings of 1 hour or more. Cannot be combined with other offers.',
      },
      {
        title: 'Sim Racing Duo Challenge',
        description: 'Book both racing cockpits together for 1 hour and receive Rs. 500 flat discount.',
        discountType: 'fixed',
        discountValue: 500,
        code: 'SIMDUO500',
        applicableFacilities: [cockpit?._id].filter(Boolean),
        startDate: now,
        endDate: futureDate,
        expiryDate: futureDate,
        active: true,
        featured: true,
        displayOrder: 2,
        terms: 'Must book consecutive or parallel sessions.',
      },
    ];
    for (const o of offers) {
      await Offer.findOneAndUpdate({ title: o.title }, o, { upsert: true });
    }
    console.log('✅ Promotional Offers seeded');

    // Sample News
    const news = [
      {
        title: 'Grand Opening: Atrios Entertainment Lounge Now Live',
        slug: 'grand-opening-atrios-entertainment',
        category: 'Announcements',
        excerpt: 'Experience Sri Lanka\'s premier high-end gaming lounge featuring cutting-edge PS5 stations, pro sim rigs, and classic indoor sports.',
        content: 'We are thrilled to officially welcome you to Atrios Entertainment! Designed with a high-end luxury aesthetic, our facility brings competitive console gaming and pro simulation to a whole new level. Reserve your session today without any online advance payment.',
        author: 'Atrios Team',
        publishDate: now,
        publishedAt: now,
        status: 'published',
        published: true,
        featured: true,
        image: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
        featuredImage: 'https://images.unsplash.com/photo-1511512578047-dfb367046420?auto=format&fit=crop&w=800&q=80',
        tags: ['Launch', 'Gaming', 'Lounge'],
      },
      {
        title: 'EA Sports FC 25 Weekend Tournament Announced',
        slug: 'fc-25-weekend-tournament',
        category: 'Tournaments',
        excerpt: 'Compete against the city\'s top players for the championship trophy and exciting prizes this month.',
        content: 'Registrations are now open for our inaugural FC 25 tournament. Sessions will be conducted on our calibrated competitive PS5 consoles with certified tournament rules.',
        author: 'Tournament Director',
        publishDate: now,
        publishedAt: now,
        status: 'published',
        published: true,
        featured: true,
        image: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
        featuredImage: 'https://images.unsplash.com/photo-1542751371-adc38448a05e?auto=format&fit=crop&w=800&q=80',
        tags: ['Tournament', 'FC25', 'PlayStation'],
      },
    ];
    for (const n of news) {
      await News.findOneAndUpdate({ slug: n.slug }, n, { upsert: true });
    }
    console.log('✅ News articles seeded');

    console.log('\n🎉 ALL DATABASE SEEDING COMPLETED SUCCESSFULLY!');
    return true;
  } catch (error) {
    console.error('❌ Seeding error:', error);
    throw error;
  }
};

if (require.main === module) {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/atrios';
  mongoose.connect(uri, { serverSelectionTimeoutMS: 2000 })
    .then(async () => {
      await seedDatabase();
      process.exit(0);
    })
    .catch(async () => {
      console.log('⚠️ Local MongoDB not found on localhost:27017. Using MongoMemoryServer for seed...');
      const { MongoMemoryServer } = require('mongodb-memory-server');
      const mongod = await MongoMemoryServer.create();
      await mongoose.connect(mongod.getUri());
      await seedDatabase();
      await mongod.stop();
      process.exit(0);
    });
}
