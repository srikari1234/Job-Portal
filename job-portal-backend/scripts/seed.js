const { validateEnv } = require('../src/config/env');

validateEnv();

const mongoose = require('mongoose');
const connectDB = require('../src/config/db');
const User = require('../src/models/User');
const Job = require('../src/models/Job');
const Application = require('../src/models/Application');
const { ROLES, APPLICATION_STATUS } = require('../src/constants');

const args = process.argv.slice(2);
const DEMO_PASSWORD = 'Password@123';

const daysFromNow = (days) => new Date(Date.now() + days * 24 * 60 * 60 * 1000);

async function findOrCreateUser(data) {
  const existing = await User.findOne({ email: data.email });
  if (existing) {
    console.log(`  = user exists: ${data.email}`);
    return existing;
  }

  const user = await User.create(data);
  console.log(`  + user created: ${data.email} (${data.role})`);
  return user;
}

async function seedAdmin() {
  console.log('Admin account');

  return findOrCreateUser({
    name: process.env.ADMIN_NAME || 'Platform Admin',
    email: (process.env.ADMIN_EMAIL || 'admin@jobportal.com').toLowerCase(),
    password: process.env.ADMIN_PASSWORD || 'Admin@12345',
    role: ROLES.ADMIN,
  });
}

async function seedDemoData() {
  console.log('Demo users');

  const employer = await findOrCreateUser({
    name: 'Priya Sharma',
    email: 'employer@demo.com',
    password: DEMO_PASSWORD,
    role: ROLES.EMPLOYER,
    companyName: 'TechNova Solutions',
    location: 'Hyderabad, India',
  });

  const seeker = await findOrCreateUser({
    name: 'Rahul Verma',
    email: 'seeker@demo.com',
    password: DEMO_PASSWORD,
    role: ROLES.JOB_SEEKER,
    headline: 'Full-stack developer',
    location: 'Hyderabad, India',
    skills: ['JavaScript', 'Node.js', 'MongoDB', 'React'],
    experience: [
      {
        jobTitle: 'Junior Developer',
        company: 'CodeCraft',
        startDate: new Date('2023-06-01'),
        endDate: new Date('2025-05-31'),
        description: 'Built REST APIs with Express and MongoDB.',
      },
    ],
    education: [
      {
        degree: 'B.Tech',
        institution: 'JNTU Hyderabad',
        fieldOfStudy: 'Computer Science',
        startYear: 2019,
        endYear: 2023,
      },
    ],
  });

  console.log('Demo jobs');

  const jobsData = [
    {
      title: 'Node.js Backend Developer',
      description:
        'Build and maintain REST APIs using Node.js, Express and MongoDB for our SaaS product.',
      location: 'Hyderabad, India',
      employmentType: 'full-time',
      salaryRange: { min: 600000, max: 1200000, currency: 'INR' },
      requiredSkills: ['node.js', 'express', 'mongodb'],
      experienceRequired: { min: 1, max: 3 },
    },
    {
      title: 'React Frontend Intern',
      description:
        'Work with our UI team to build responsive React components and fix front-end bugs.',
      location: 'Remote',
      employmentType: 'internship',
      salaryRange: { min: 15000, max: 25000, currency: 'INR' },
      requiredSkills: ['react', 'javascript', 'css'],
      experienceRequired: { min: 0, max: 1 },
    },
    {
      title: 'DevOps Engineer (Contract)',
      description:
        'Own CI/CD pipelines, containerisation and monitoring for a 6 month contract engagement.',
      location: 'Bengaluru, India',
      employmentType: 'contract',
      salaryRange: { min: 90000, max: 150000, currency: 'INR' },
      requiredSkills: ['docker', 'kubernetes', 'aws'],
      experienceRequired: { min: 3, max: 6 },
    },
  ];

  const jobs = [];

  for (const data of jobsData) {
    let job = await Job.findOne({ title: data.title, employer: employer._id });

    if (job) {
      console.log(`  = job exists: ${job.title}`);
    } else {
      job = await Job.create({
        ...data,
        companyName: employer.companyName,
        applicationDeadline: daysFromNow(45),
        employer: employer._id,
      });
      console.log(`  + job created: ${job.title}`);
    }

    jobs.push(job);
  }

  console.log('Demo application');

  const exists = await Application.exists({ job: jobs[0]._id, applicant: seeker._id });

  if (exists) {
    console.log('  = application exists');
  } else {
    await Application.create({
      job: jobs[0]._id,
      applicant: seeker._id,
      coverLetter: 'I enjoy building REST APIs and would love to join TechNova.',
      resumeUrl: 'https://example.com/resume/rahul-verma.pdf',
      expectedSalary: 900000,
      statusHistory: [{ status: APPLICATION_STATUS.APPLIED, changedBy: seeker._id }],
    });
    console.log('  + application created');
  }

  console.log(`\nDemo login password for employer@demo.com and seeker@demo.com: ${DEMO_PASSWORD}`);
}

async function destroy() {
  if (process.env.NODE_ENV === 'production') {
    throw new Error('Refusing to destroy data while NODE_ENV=production');
  }

  await Application.deleteMany({});
  await Job.deleteMany({});
  await User.deleteMany({});

  console.log('All users, jobs and applications deleted.');
}

(async () => {
  try {
    await connectDB();

    if (args.includes('--destroy')) {
      await destroy();
    } else {
      await seedAdmin();
      if (!args.includes('--admin-only')) await seedDemoData();
    }

    console.log('Done.');
  } catch (err) {
    console.error('Seed failed:', err.message);
    process.exitCode = 1;
  } finally {
    await mongoose.disconnect();
  }
})();
