import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { connectDB, User, StaffProfile } = await import('../db.js');

async function main() {
  await connectDB();

  console.log('--- EXECUTING SAFE AGRONOMIST DATA CLEANUP ---');

  const dummyExpertIds = [
    'USR-EXPERT-01',
    'USR-EXPERT-02',
    'USR-EXPERT-03',
    'USR-EXPERT-04'
  ];

  // 1. Deactivate dummy USR-EXPERT-* fixtures (preserves historical bookings while removing from live catalog)
  for (const id of dummyExpertIds) {
    const user = await User.findById(id).lean();
    if (user) {
      await User.findByIdAndUpdate(id, {
        $set: {
          isAgronomyExpert: false,
          status: 'inactive',
          department: 'Archived Demo Fixture',
          updatedAt: new Date().toISOString()
        }
      });
      await StaffProfile.findByIdAndUpdate(id, {
        $set: {
          isAgronomyExpert: false,
          status: 'inactive',
          updatedAt: new Date().toISOString()
        }
      });
      console.log(`✓ Deactivated dummy fixture: ${id} (${user.name})`);
    } else {
      console.log(`- Fixture not found in User: ${id}`);
    }
  }

  // 2. Remove isAgronomyExpert flag from Employee 1 (remains active normal employee)
  const emp1 = await User.findOne({ email: 'employee1@sathyamagromart.com' });
  if (emp1) {
    await User.findByIdAndUpdate(emp1._id, {
      $set: {
        isAgronomyExpert: false,
        updatedAt: new Date().toISOString()
      }
    });
    await StaffProfile.findByIdAndUpdate(emp1._id, {
      $set: {
        isAgronomyExpert: false,
        updatedAt: new Date().toISOString()
      }
    });
    console.log(`✓ Removed agronomist flag from normal employee: ${emp1._id} (${emp1.name})`);
  }

  console.log('--- CLEANUP COMPLETED SAFELY ---');
  process.exit(0);
}

main().catch(err => {
  console.error('Cleanup error:', err);
  process.exit(1);
});
