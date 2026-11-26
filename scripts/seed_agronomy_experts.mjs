import dotenv from 'dotenv';
dotenv.config();
dotenv.config({ path: './server/.env' });
import { db, StaffProfile, User, connectDB } from '../server/db.js';

async function seed() {
  await connectDB();
  const defaultExperts = [
    {
      id: 'USR-EXPERT-01',
      name: 'Dr. K. Senthil, Ph.D.',
      phone: '9876543220',
      email: 'dr.senthil@sathyamagromart.com',
      role: 'employee',
      isAgronomyExpert: true,
      status: 'active',
      profile: {
        designation: 'Senior Agronomist & Crop Protection Specialist',
        specialization: 'Crop Disease Diagnostics',
        qualification: 'Ph.D. Agronomy (TNAU Coimbatore)',
        experienceYears: 14,
        languages: ['Tamil', 'English', 'Hindi'],
        cropsExpertise: ['Paddy/Rice', 'Cotton', 'Sugarcane', 'Banana', 'Turmeric'],
        availableDays: 'Monday - Saturday',
        availableSlots: ['10:00 AM - 12:00 PM', '02:00 PM - 04:00 PM', '04:00 PM - 06:00 PM'],
        bio: 'Senior Agronomist with 14+ years research in pest diagnostics, fungal blast mitigation, and bio-protection strategies across South India.',
        rating: 4.9,
        reviewsCount: 148,
        isAgronomyExpert: true
      }
    },
    {
      id: 'USR-EXPERT-02',
      name: 'Dr. R. Malathi, M.Sc. (Agri)',
      phone: '9876543221',
      email: 'dr.malathi@sathyamagromart.com',
      role: 'employee',
      isAgronomyExpert: true,
      status: 'active',
      profile: {
        designation: 'Chief Soil Scientist & Nutritionist',
        specialization: 'Soil Health Restoration',
        qualification: 'M.Sc. Agricultural Chemistry & Soil Science',
        experienceYears: 11,
        languages: ['Tamil', 'English'],
        cropsExpertise: ['Vegetables', 'Tomato', 'Chilli', 'Onion', 'Coconut', 'Maize'],
        availableDays: 'Monday - Saturday',
        availableSlots: ['10:00 AM - 12:00 PM', '02:00 PM - 04:00 PM', '04:00 PM - 06:00 PM'],
        bio: 'Specialist in precision soil health restoration, saline-alkali land reclamation, micronutrient balance, and drip fertigation management.',
        rating: 4.8,
        reviewsCount: 112,
        isAgronomyExpert: true
      }
    },
    {
      id: 'USR-EXPERT-03',
      name: 'Er. M. Praveen, B.Sc. (Agri)',
      phone: '9876543222',
      email: 'm.praveen@sathyamagromart.com',
      role: 'employee',
      isAgronomyExpert: true,
      status: 'active',
      profile: {
        designation: 'Horticulture & Fertigation Specialist',
        specialization: 'Horticulture & Fertigation',
        qualification: 'B.Sc. Agriculture, PGD Protected Cultivation',
        experienceYears: 8,
        languages: ['Tamil', 'English', 'Telugu'],
        cropsExpertise: ['Horticulture', 'Mango', 'Guava', 'Pomegranate', 'Flowers', 'Polyhouse Crops'],
        availableDays: 'Monday - Saturday',
        availableSlots: ['10:00 AM - 12:00 PM', '02:00 PM - 04:00 PM', '04:00 PM - 06:00 PM'],
        bio: 'Field specialist for fruit orchards, commercial flower cultivation, polyhouse protected cultivation, and micro-irrigation systems.',
        rating: 4.9,
        reviewsCount: 94,
        isAgronomyExpert: true
      }
    },
    {
      id: 'USR-EXPERT-04',
      name: 'Dr. A. Rajendran, Ph.D. (Entomology)',
      phone: '9876543223',
      email: 'dr.rajendran@sathyamagromart.com',
      role: 'employee',
      isAgronomyExpert: true,
      status: 'active',
      profile: {
        designation: 'Senior Entomologist & Biological Pest Lead',
        specialization: 'Biological Pest Control',
        qualification: 'Ph.D. Agricultural Entomology',
        experienceYears: 16,
        languages: ['Tamil', 'English'],
        cropsExpertise: ['Paddy/Rice', 'Cotton', 'Pulses', 'Groundnut', 'Spices'],
        availableDays: 'Monday - Saturday',
        availableSlots: ['10:00 AM - 12:00 PM', '02:00 PM - 04:00 PM', '04:00 PM - 06:00 PM'],
        bio: 'Authority on Integrated Pest Management (IPM), parasitoids, bio-pesticides, and zero-residue pest control for export-grade yields.',
        rating: 4.9,
        reviewsCount: 165,
        isAgronomyExpert: true
      }
    }
  ];

  for (const exp of defaultExperts) {
    const { profile, ...userDoc } = exp;
    await User.findByIdAndUpdate(exp.id, { $set: { ...userDoc, _id: exp.id } }, { upsert: true });
    await StaffProfile.findByIdAndUpdate(exp.id, { $set: { ...profile, _id: exp.id, isAgronomyExpert: true } }, { upsert: true });
  }

  const emp1 = await User.findOne({ email: 'employee1@sathyamagromart.com' });
  if (emp1) {
    await User.findByIdAndUpdate(emp1._id, { $set: { isAgronomyExpert: true } });
    await StaffProfile.findByIdAndUpdate(emp1._id, {
      $set: {
        isAgronomyExpert: true,
        designation: 'Field Agronomist & Crop Advisory Specialist',
        specialization: 'Crop Disease Diagnostics',
        qualification: 'B.Sc. Agriculture (TNAU)',
        experienceYears: 5,
        languages: ['Tamil', 'English'],
        cropsExpertise: ['Paddy/Rice', 'Cotton', 'Vegetables', 'Sugarcane'],
        availableDays: 'Monday - Saturday',
        availableSlots: ['10:00 AM - 12:00 PM', '02:00 PM - 04:00 PM', '04:00 PM - 06:00 PM'],
        bio: 'Certified Field Agronomist providing immediate crop health diagnostics, pest identification, and organic fertilizer schedules.',
        rating: 4.8,
        reviewsCount: 64
      }
    }, { upsert: true });
  }

  const experts = await db.getAgronomyExperts();
  console.log(`Successfully configured! Total experts active: ${experts.length}`);
  experts.forEach(e => console.log(`- ${e.name} (${e.profile?.specialization || 'General'}) [ID: ${e.id}]`));
}

seed().then(() => process.exit(0)).catch(err => {
  console.error('Seed error:', err);
  process.exit(1);
});
