import { PrismaClient } from '@prisma/client';
import bcrypt from 'bcryptjs';

const prisma = new PrismaClient();

/**
 * Seed script — populates the database with sample users and financial records
 * for testing and demonstration purposes.
 */
async function main() {
  console.log('🌱 Seeding database...\n');

  // ── Clear existing data ──
  await prisma.financialRecord.deleteMany({});
  await prisma.user.deleteMany({});
  console.log('  ✓ Cleared existing data');

  // ── Create Users ──
  const adminPassword = await bcrypt.hash('admin123', 12);
  const admin = await prisma.user.create({
    data: {
      name: 'Admin User',
      email: 'admin@zorvyn.com',
      password: adminPassword,
      role: 'ADMIN',
      status: 'ACTIVE',
    },
  });
  console.log(`  ✓ Created Admin: ${admin.email}`);

  const analystPassword = await bcrypt.hash('analyst123', 12);
  const analyst = await prisma.user.create({
    data: {
      name: 'Analyst User',
      email: 'analyst@zorvyn.com',
      password: analystPassword,
      role: 'ANALYST',
      status: 'ACTIVE',
    },
  });
  console.log(`  ✓ Created Analyst: ${analyst.email}`);

  const viewerPassword = await bcrypt.hash('viewer123', 12);
  const viewer = await prisma.user.create({
    data: {
      name: 'Viewer User',
      email: 'viewer@zorvyn.com',
      password: viewerPassword,
      role: 'VIEWER',
      status: 'ACTIVE',
    },
  });
  console.log(`  ✓ Created Viewer: ${viewer.email}`);

  // Create an inactive user to demonstrate status management
  const inactivePassword = await bcrypt.hash('inactive123', 12);
  const inactive = await prisma.user.create({
    data: {
      name: 'Inactive User',
      email: 'inactive@zorvyn.com',
      password: inactivePassword,
      role: 'VIEWER',
      status: 'INACTIVE',
    },
  });
  console.log(`  ✓ Created Inactive User: ${inactive.email}`);

  // ── Create Financial Records (spanning 6 months for trends) ──
  const now = new Date();
  const records = [
    // Current month (dated on or before today, Apr 5)
    { amount: 8500, type: 'INCOME', category: 'Salary', date: new Date(now.getFullYear(), now.getMonth(), 1), description: 'Monthly base salary', notes: 'Regular monthly salary payment', userId: admin.id },
    { amount: 2000, type: 'INCOME', category: 'Freelance', date: new Date(now.getFullYear(), now.getMonth(), 2), description: 'Web development project', notes: 'Client: TechCorp dashboard project', userId: admin.id },
    { amount: 1800, type: 'EXPENSE', category: 'Rent', date: new Date(now.getFullYear(), now.getMonth(), 3), description: 'Office space rent', notes: 'Monthly office rent payment', userId: admin.id },
    { amount: 350, type: 'EXPENSE', category: 'Utilities', date: new Date(now.getFullYear(), now.getMonth(), 4), description: 'Electricity and internet', notes: 'Combined utility bill', userId: admin.id },
    { amount: 200, type: 'EXPENSE', category: 'Food', date: new Date(now.getFullYear(), now.getMonth(), 5), description: 'Team lunch', notes: 'Weekly team lunch expense', userId: admin.id },

    // Last month
    { amount: 8500, type: 'INCOME', category: 'Salary', date: new Date(now.getFullYear(), now.getMonth() - 1, 1), description: 'Monthly base salary', notes: 'Regular monthly salary', userId: admin.id },
    { amount: 1500, type: 'INCOME', category: 'Investment', date: new Date(now.getFullYear(), now.getMonth() - 1, 15), description: 'Stock dividends', notes: 'Quarterly dividend payout', userId: admin.id },
    { amount: 1800, type: 'EXPENSE', category: 'Rent', date: new Date(now.getFullYear(), now.getMonth() - 1, 3), description: 'Office space rent', notes: null, userId: admin.id },
    { amount: 400, type: 'EXPENSE', category: 'Travel', date: new Date(now.getFullYear(), now.getMonth() - 1, 12), description: 'Client meeting travel', notes: 'Train and taxi', userId: admin.id },
    { amount: 300, type: 'EXPENSE', category: 'Utilities', date: new Date(now.getFullYear(), now.getMonth() - 1, 8), description: 'Electricity bill', notes: null, userId: admin.id },
    { amount: 150, type: 'EXPENSE', category: 'Entertainment', date: new Date(now.getFullYear(), now.getMonth() - 1, 20), description: 'Team building event', notes: 'Bowling night', userId: admin.id },

    // 2 months ago
    { amount: 8500, type: 'INCOME', category: 'Salary', date: new Date(now.getFullYear(), now.getMonth() - 2, 1), description: 'Monthly base salary', notes: null, userId: admin.id },
    { amount: 3000, type: 'INCOME', category: 'Freelance', date: new Date(now.getFullYear(), now.getMonth() - 2, 20), description: 'Mobile app project', notes: 'Phase 1 milestone payment', userId: admin.id },
    { amount: 1800, type: 'EXPENSE', category: 'Rent', date: new Date(now.getFullYear(), now.getMonth() - 2, 3), description: 'Office space rent', notes: null, userId: admin.id },
    { amount: 600, type: 'EXPENSE', category: 'Insurance', date: new Date(now.getFullYear(), now.getMonth() - 2, 15), description: 'Health insurance premium', notes: 'Quarterly payment', userId: admin.id },
    { amount: 250, type: 'EXPENSE', category: 'Education', date: new Date(now.getFullYear(), now.getMonth() - 2, 10), description: 'Online course subscription', notes: 'Cloud architecture course', userId: admin.id },

    // 3 months ago
    { amount: 8500, type: 'INCOME', category: 'Salary', date: new Date(now.getFullYear(), now.getMonth() - 3, 1), description: 'Monthly base salary', notes: null, userId: admin.id },
    { amount: 800, type: 'INCOME', category: 'Investment', date: new Date(now.getFullYear(), now.getMonth() - 3, 25), description: 'Bond interest', notes: 'Semi-annual interest payment', userId: admin.id },
    { amount: 1800, type: 'EXPENSE', category: 'Rent', date: new Date(now.getFullYear(), now.getMonth() - 3, 3), description: 'Office space rent', notes: null, userId: admin.id },
    { amount: 2500, type: 'EXPENSE', category: 'Taxes', date: new Date(now.getFullYear(), now.getMonth() - 3, 15), description: 'Quarterly tax payment', notes: 'Q1 estimated taxes', userId: admin.id },
    { amount: 350, type: 'EXPENSE', category: 'Utilities', date: new Date(now.getFullYear(), now.getMonth() - 3, 7), description: 'Utilities bill', notes: null, userId: admin.id },

    // 4 months ago
    { amount: 8500, type: 'INCOME', category: 'Salary', date: new Date(now.getFullYear(), now.getMonth() - 4, 1), description: 'Monthly base salary', notes: null, userId: admin.id },
    { amount: 1200, type: 'INCOME', category: 'Freelance', date: new Date(now.getFullYear(), now.getMonth() - 4, 18), description: 'Consulting session', notes: 'API architecture review', userId: admin.id },
    { amount: 1800, type: 'EXPENSE', category: 'Rent', date: new Date(now.getFullYear(), now.getMonth() - 4, 3), description: 'Office space rent', notes: null, userId: admin.id },
    { amount: 1000, type: 'EXPENSE', category: 'Healthcare', date: new Date(now.getFullYear(), now.getMonth() - 4, 22), description: 'Annual health checkup', notes: 'Full body checkup', userId: admin.id },
    { amount: 450, type: 'EXPENSE', category: 'Food', date: new Date(now.getFullYear(), now.getMonth() - 4, 12), description: 'Business dinner', notes: 'Client entertainment', userId: admin.id },

    // 5 months ago
    { amount: 8500, type: 'INCOME', category: 'Salary', date: new Date(now.getFullYear(), now.getMonth() - 5, 1), description: 'Monthly base salary', notes: null, userId: admin.id },
    { amount: 5000, type: 'INCOME', category: 'Savings', date: new Date(now.getFullYear(), now.getMonth() - 5, 10), description: 'Fixed deposit maturity', notes: '1 year FD matured', userId: admin.id },
    { amount: 1800, type: 'EXPENSE', category: 'Rent', date: new Date(now.getFullYear(), now.getMonth() - 5, 3), description: 'Office space rent', notes: null, userId: admin.id },
    { amount: 3000, type: 'EXPENSE', category: 'Marketing', date: new Date(now.getFullYear(), now.getMonth() - 5, 15), description: 'Product launch campaign', notes: 'Major ad campaign spend', userId: admin.id },

    // A soft-deleted record for demonstration
    { amount: 99.99, type: 'EXPENSE', category: 'Other', date: new Date(now.getFullYear(), now.getMonth(), 2), description: 'Deleted test entry', notes: 'This record was soft-deleted', userId: admin.id, isDeleted: true },
  ];

  for (const record of records) {
    await prisma.financialRecord.create({
      data: {
        amount: record.amount,
        type: record.type,
        category: record.category,
        date: record.date,
        description: record.description,
        notes: record.notes || null,
        userId: record.userId,
        isDeleted: (record as any).isDeleted || false,
      },
    });
  }

  console.log(`  ✓ Created ${records.length} financial records (spanning 6 months)\n`);

  // ── Summary ──
  console.log('═══════════════════════════════════════════════');
  console.log('  Database seeded successfully!');
  console.log('═══════════════════════════════════════════════');
  console.log('\n  Sample Credentials:');
  console.log('  ┌─────────┬────────────────────────┬─────────────┐');
  console.log('  │ Role    │ Email                  │ Password    │');
  console.log('  ├─────────┼────────────────────────┼─────────────┤');
  console.log('  │ ADMIN   │ admin@zorvyn.com       │ admin123    │');
  console.log('  │ ANALYST │ analyst@zorvyn.com     │ analyst123  │');
  console.log('  │ VIEWER  │ viewer@zorvyn.com      │ viewer123   │');
  console.log('  │ INACTIVE│ inactive@zorvyn.com    │ inactive123 │');
  console.log('  └─────────┴────────────────────────┴─────────────┘\n');
}

main()
  .catch((e) => {
    console.error('Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
