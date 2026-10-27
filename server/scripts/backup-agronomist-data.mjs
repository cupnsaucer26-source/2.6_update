import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import dotenv from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const { connectDB, User, StaffProfile, AgronomyBooking } = await import('../db.js');

async function main() {
  await connectDB();
  const backupDir = path.resolve(__dirname, '../backups');
  if (!fs.existsSync(backupDir)) fs.mkdirSync(backupDir, { recursive: true });

  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFile = path.join(backupDir, `agronomist_audit_backup_${timestamp}.json`);

  const users = await User.find({ role: { $in: ['employee', 'admin', 'billing', 'delivery'] } }).lean();
  const profiles = await StaffProfile.find({}).lean();
  const bookings = await AgronomyBooking.find({}).lean();

  const backupData = {
    timestamp: new Date().toISOString(),
    usersCount: users.length,
    profilesCount: profiles.length,
    bookingsCount: bookings.length,
    users,
    profiles,
    bookings
  };

  fs.writeFileSync(backupFile, JSON.stringify(backupData, null, 2), 'utf8');
  console.log(`BACKUP_SUCCESS: ${backupFile} (${users.length} users, ${profiles.length} profiles, ${bookings.length} bookings)`);
  process.exit(0);
}

main().catch(err => {
  console.error(err);
  process.exit(1);
});
