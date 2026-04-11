// src/config/seed.js
require('dotenv').config();
const { connectPostgres, pool } = require('./postgres');
const { seedAchievements } = require('../services/achievementService');

async function seed() {
  await connectPostgres();
  await seedAchievements();

  // Seed subjects reference table
  const subjects = [
    ['mathematics',   'Mathematics',    'الرياضيات',          '📐', '#6C63FF', ['all']],
    ['science',       'Science',        'العلوم',             '🔬', '#0ECDA8', ['all']],
    ['arabic',        'Arabic',         'اللغة العربية',       '📚', '#F7B731', ['all']],
    ['english',       'English',        'اللغة الإنجليزية',    '🌐', '#38BDF8', ['all']],
    ['social_studies','Social Studies', 'الدراسات الاجتماعية', '🌍', '#FF5470', ['all']],
    ['religion',      'Religion',       'التربية الدينية',     '🕌', '#A78BFA', ['all']],
    ['physics',       'Physics',        'الفيزياء',           '⚡', '#F59E0B', ['sec1','sec2','sec3']],
    ['chemistry',     'Chemistry',      'الكيمياء',           '⚗️', '#EC4899', ['sec1','sec2','sec3']],
    ['biology',       'Biology',        'الأحياء',            '🧬', '#10B981', ['sec1','sec2','sec3']],
    ['history',       'History',        'التاريخ',            '📜', '#8B5CF6', ['prep1','prep2','prep3','sec1','sec2','sec3']],
    ['geography',     'Geography',      'الجغرافيا',          '🗺️', '#06B6D4', ['prep1','prep2','prep3','sec1','sec2','sec3']],
  ];

  for (const [key,en,ar,icon,color,grades] of subjects) {
    await pool.query(`
      INSERT INTO subjects (key,name_en,name_ar,icon,color,grades)
      VALUES ($1,$2,$3,$4,$5,$6)
      ON CONFLICT (key) DO UPDATE SET name_en=$2,name_ar=$3,icon=$4,color=$5,grades=$6
    `, [key,en,ar,icon,color,grades]);
  }

  // Seed a default admin user if none exists
  const bcrypt = require('bcryptjs');
  const adminEmail = 'admin@najah.eg';
  const { rows: existing } = await pool.query("SELECT id FROM users WHERE email=$1", [adminEmail]);
  if (!existing[0]) {
    const hash = await bcrypt.hash('Admin@123456', 12);
    await pool.query(
      "INSERT INTO users (name,email,password_hash,role,grade,email_verified) VALUES ($1,$2,$3,'admin','Admin','true')",
      ['Platform Admin', adminEmail, hash]
    );
    console.log('✅ Admin user created: admin@najah.eg / Admin@123456');
  }

  console.log('✅ Database seeded successfully');
  process.exit(0);
}

seed().catch(err => { console.error('Seed error:', err); process.exit(1); });
