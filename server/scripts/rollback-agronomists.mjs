import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { connectDB, User, StaffProfile } = await import('../db.js');

async function main() {
  await connectDB();
  console.log('--- REVERSING AGRONOMIST CLEANUP ---');

  const dummyExpertIds = [
    'USR-EXPERT-01',
    'USR-EXPERT-02',
    'USR-EXPERT-03',
    'USR-EXPERT-04'
  ];

  for (const id of dummyExpertIds) {
    await User.findByIdAndUpdate(id, { $set: { isAgronomyExpert: true, status: 'active' } });
    await StaffProfile.findByIdAndUpdate(id, { $set: { isAgronomyExpert: true, status: 'active' } });
    console.log(`Re-activated: ${id}`);
  }

  const emp1 = await User.findOne({ email: 'employee1@sathyamagromart.com' });
  if (emp1) {
    await User.findByIdAndUpdate(emp1._id, { $set: { isAgronomyExpert: true } });
    await StaffProfile.findByIdAndUpdate(emp1._id, { $set: { isAgronomyExpert: true } });
    console.log(`Restored flag for: ${emp1._id}`);
  }

  console.log('--- ROLLBACK COMPLETED ---');
  process.exit(0);
}

main().catch(err => {
  console.error('Rollback error:', err);
  process.exit(1);
});
