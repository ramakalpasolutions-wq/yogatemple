// prisma/seed.js
const { PrismaClient } = require('@prisma/client');
const bcrypt = require('bcryptjs');

const prisma = new PrismaClient();

async function main() {
  console.log('');
  console.log('🌱  Starting Yoga Temple Database Seed...');
  console.log('');

  // ════════════════════════════════════════════════════════════════
  //  1. FIX ENUM CASE — upgrade any lowercase values in MongoDB
  // ════════════════════════════════════════════════════════════════
  console.log('🔧  Step 1: Fixing enum case in existing documents...');

  try {
    // contacts.status
    const contacts = await prisma.contact.findMany();
    for (const c of contacts) {
      const upper = c.status?.toUpperCase();
      if (upper && c.status !== upper && ['NEW','READ','REPLIED'].includes(upper)) {
        await prisma.contact.update({
          where: { id: c.id },
          data:  { status: upper },
        });
      }
    }
    console.log(`   ✔  contacts.status fixed (${contacts.length} checked)`);
  } catch (e) {
    console.log('   ⚠  contacts skip:', e.message.slice(0, 60));
  }

  try {
    const bookings = await prisma.booking.findMany();
    for (const b of bookings) {
      const upper = b.status?.toUpperCase();
      if (upper && b.status !== upper && ['CONFIRMED','CANCELLED','ATTENDED','PENDING'].includes(upper)) {
        await prisma.booking.update({
          where: { id: b.id },
          data:  { status: upper },
        });
      }
    }
    console.log(`   ✔  bookings.status fixed (${bookings.length} checked)`);
  } catch (e) {
    console.log('   ⚠  bookings skip:', e.message.slice(0, 60));
  }

  try {
    const payments = await prisma.payment.findMany();
    for (const p of payments) {
      const upper = p.status?.toUpperCase();
      if (upper && p.status !== upper && ['PENDING','PAID','FAILED'].includes(upper)) {
        await prisma.payment.update({
          where: { id: p.id },
          data:  { status: upper },
        });
      }
    }
    console.log(`   ✔  payments.status fixed (${payments.length} checked)`);
  } catch (e) {
    console.log('   ⚠  payments skip:', e.message.slice(0, 60));
  }

  console.log('');

  // ════════════════════════════════════════════════════════════════
  //  2. ADMIN ACCOUNT
  // ════════════════════════════════════════════════════════════════
  console.log('👑  Step 2: Creating admin account...');

  const ADMIN_USERNAME = 'yogaadmin';
  const ADMIN_PASSWORD = 'Admin@123';
  const ADMIN_EMAIL    = 'admin@yogatemple.com';
  const ADMIN_NAME     = 'Yoga Temple Admin';

  const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 12);

  const existingAdmin = await prisma.adminAccount.findFirst({
    where: { OR: [{ username: ADMIN_USERNAME }, { email: ADMIN_EMAIL }] },
  });

  if (existingAdmin) {
    await prisma.adminAccount.update({
      where: { id: existingAdmin.id },
      data: {
        password:  hashedPassword,
        name:      ADMIN_NAME,
        isActive:  true,
        updatedAt: new Date(),
      },
    });
    console.log('   ✔  Admin account UPDATED');
  } else {
    await prisma.adminAccount.create({
      data: {
        username:  ADMIN_USERNAME,
        password:  hashedPassword,
        email:     ADMIN_EMAIL,
        name:      ADMIN_NAME,
        isActive:  true,
      },
    });
    console.log('   ✔  Admin account CREATED');
  }

  console.log('');

  // ════════════════════════════════════════════════════════════════
  //  3. SITE SETTINGS (defaults)
  // ════════════════════════════════════════════════════════════════
  console.log('⚙️   Step 3: Seeding site settings...');

  const defaultSettings = [
    { key: 'site_name',        value: 'Yoga Temple' },
    { key: 'site_tagline',     value: 'Find Your Inner Peace' },
    { key: 'contact_email',    value: 'hello@yogatemple.com' },
    { key: 'contact_phone',    value: '+91 98765 43210' },
    { key: 'contact_address',  value: '123 Serenity Lane, Hyderabad, TS 500001' },
    { key: 'razorpay_enabled', value: 'true' },
    { key: 'sms_enabled',      value: 'false' },
    {
      key:   'plan_monthly_price',
      value: '999',
    },
    {
      key:   'plan_quarterly_price',
      value: '2499',
    },
    {
      key:   'plan_annual_price',
      value: '7999',
    },
  ];

  for (const setting of defaultSettings) {
    await prisma.siteSetting.upsert({
      where:  { key: setting.key },
      update: {},                   // don't overwrite existing values
      create: setting,
    });
  }
  console.log(`   ✔  ${defaultSettings.length} site settings seeded`);
  console.log('');

  // ════════════════════════════════════════════════════════════════
  //  4. SAMPLE CLASSES
  // ════════════════════════════════════════════════════════════════
  console.log('🧘  Step 4: Seeding sample classes...');

  const sampleClasses = [
    {
      title:       'Morning Hatha Flow',
      description: 'Start your day with a gentle Hatha yoga session designed to awaken the body and calm the mind. Perfect for all levels.',
      instructor:  'Priya Sharma',
      level:       'BEGINNER',
      type:        'LIVE',
      duration:    60,
      category:    'HATHA',
      isPremium:   false,
      isActive:    true,
      isPublished: true,
      price:       0,
      tags:        ['morning', 'beginner', 'hatha'],
      scheduledAt: new Date(Date.now() + 2 * 24 * 60 * 60 * 1000), // 2 days from now
    },
    {
      title:       'Power Vinyasa Flow',
      description: 'A dynamic and energising Vinyasa class that builds strength, flexibility and endurance. Intermediate level.',
      instructor:  'Arjun Nair',
      level:       'INTERMEDIATE',
      type:        'RECORDED',
      duration:    75,
      category:    'VINYASA',
      isPremium:   true,
      isActive:    true,
      isPublished: true,
      price:       499,
      tags:        ['power', 'vinyasa', 'intermediate'],
    },
    {
      title:       'Yin Yoga Deep Stretch',
      description: 'A slow-paced practice targeting deep connective tissues. Ideal for stress relief and flexibility.',
      instructor:  'Meena Iyer',
      level:       'ALL_LEVELS',
      type:        'RECORDED',
      duration:    90,
      category:    'YIN',
      isPremium:   false,
      isActive:    true,
      isPublished: true,
      price:       0,
      tags:        ['yin', 'stretch', 'relaxation'],
    },
    {
      title:       'Meditation & Pranayama',
      description: 'Master breathing techniques and meditation practices to reduce anxiety and improve focus.',
      instructor:  'Priya Sharma',
      level:       'BEGINNER',
      type:        'LIVE',
      duration:    45,
      category:    'MEDITATION',
      isPremium:   false,
      isActive:    true,
      isPublished: true,
      price:       0,
      tags:        ['meditation', 'pranayama', 'breathing'],
      scheduledAt: new Date(Date.now() + 5 * 24 * 60 * 60 * 1000), // 5 days from now
    },
    {
      title:       'Advanced Ashtanga Series',
      description: 'Traditional Ashtanga yoga for advanced practitioners. Builds heat, strength and discipline.',
      instructor:  'Arjun Nair',
      level:       'ADVANCED',
      type:        'RECORDED',
      duration:    120,
      category:    'ASHTANGA',
      isPremium:   true,
      isActive:    true,
      isPublished: true,
      price:       799,
      tags:        ['ashtanga', 'advanced', 'traditional'],
    },
    {
      title:       'Restorative Yoga for Sleep',
      description: 'A deeply relaxing practice to prepare your body and mind for restful sleep. Use of props encouraged.',
      instructor:  'Meena Iyer',
      level:       'BEGINNER',
      type:        'RECORDED',
      duration:    60,
      category:    'RESTORATIVE',
      isPremium:   true,
      isActive:    true,
      isPublished: true,
      price:       299,
      tags:        ['restorative', 'sleep', 'relaxation'],
    },
  ];

  let classesCreated = 0;
  let classesSkipped = 0;

  for (const cls of sampleClasses) {
    const existing = await prisma.class.findFirst({
      where: { title: cls.title, instructor: cls.instructor },
    });

    if (!existing) {
      await prisma.class.create({ data: cls });
      classesCreated++;
    } else {
      classesSkipped++;
    }
  }

  console.log(`   ✔  ${classesCreated} classes created, ${classesSkipped} already exist`);
  console.log('');

  // ════════════════════════════════════════════════════════════════
  //  SUMMARY
  // ════════════════════════════════════════════════════════════════
  const totalClasses = await prisma.class.count();
  const totalUsers   = await prisma.user.count();
  const totalAdmins  = await prisma.adminAccount.count();

  console.log('═══════════════════════════════════════════════');
  console.log('   🌱  Seed Complete — Database Summary');
  console.log('═══════════════════════════════════════════════');
  console.log(`   Admin accounts  :  ${totalAdmins}`);
  console.log(`   Classes         :  ${totalClasses}`);
  console.log(`   Users           :  ${totalUsers}`);
  console.log('═══════════════════════════════════════════════');
  console.log('');
  console.log('   🧘  Admin Login');
  console.log(`   URL      :  http://localhost:3000/admin/login`);
  console.log(`   Username :  ${ADMIN_USERNAME}`);
  console.log(`   Password :  ${ADMIN_PASSWORD}`);
  console.log('═══════════════════════════════════════════════');
  console.log('');
}

main()
  .catch(e => {
    console.error('❌  Seed failed:', e.message);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });