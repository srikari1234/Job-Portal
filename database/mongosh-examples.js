const RUN_WRITE_EXAMPLES = false;

const jobPortal = db.getSiblingDB('job_portal');

const show = (title, value) => {
  print(`\n===== ${title} =====`);
  printjson(value);
};

show('Collections', jobPortal.getCollectionNames());
show('Document counts', {
  users: jobPortal.users.countDocuments(),
  jobs: jobPortal.jobs.countDocuments(),
  applications: jobPortal.applications.countDocuments(),
});

jobPortal.users.createIndex({ email: 1 }, { unique: true });
jobPortal.users.createIndex({ role: 1, isActive: 1 });
jobPortal.jobs.createIndex({ employer: 1 });
jobPortal.jobs.createIndex({ status: 1, applicationDeadline: 1, postedDate: -1 });
jobPortal.jobs.createIndex({ requiredSkills: 1 });
jobPortal.applications.createIndex({ job: 1, applicant: 1 }, { unique: true });
jobPortal.applications.createIndex({ applicant: 1, createdAt: -1 });

show('Indexes on applications', jobPortal.applications.getIndexes());

show(
  'All employers (no password hash)',
  jobPortal.users.find({ role: 'employer' }, { password: 0, __v: 0 }).toArray()
);

show(
  'Job seekers who know node.js',
  jobPortal.users
    .find({ role: 'jobseeker', skills: 'node.js' }, { name: 1, email: 1, skills: 1 })
    .toArray()
);

show(
  'Job seekers with a B.Tech degree',
  jobPortal.users
    .find({ education: { $elemMatch: { degree: 'B.Tech' } } }, { name: 1, 'education.$': 1 })
    .toArray()
);

show(
  'Deactivated accounts',
  jobPortal.users.find({ isActive: false }, { name: 1, email: 1 }).toArray()
);

show(
  'Open jobs (page 1, 5 per page)',
  jobPortal.jobs
    .find({ status: 'open', applicationDeadline: { $gt: new Date() } })
    .sort({ postedDate: -1 })
    .skip(0)
    .limit(5)
    .toArray()
);

show(
  'Full-time jobs needing mongodb or react, paying up to at least 500000',
  jobPortal.jobs
    .find({
      employmentType: 'full-time',
      requiredSkills: { $in: ['mongodb', 'react'] },
      'salaryRange.max': { $gte: 500000 },
    })
    .toArray()
);

show(
  'Case-insensitive location search',
  jobPortal.jobs.find({ location: /hyderabad/i }, { title: 1, location: 1 }).toArray()
);

const firstJob = jobPortal.jobs.findOne();

if (firstJob) {
  show(
    `Applications for job "${firstJob.title}"`,
    jobPortal.applications.find({ job: firstJob._id }, { statusHistory: 0 }).toArray()
  );
}

show(
  'Applications joined with job and applicant',
  jobPortal.applications
    .aggregate([
      { $lookup: { from: 'jobs', localField: 'job', foreignField: '_id', as: 'job' } },
      { $lookup: { from: 'users', localField: 'applicant', foreignField: '_id', as: 'applicant' } },
      { $unwind: '$job' },
      { $unwind: '$applicant' },
      {
        $project: {
          _id: 0,
          status: 1,
          appliedAt: 1,
          jobTitle: '$job.title',
          company: '$job.companyName',
          applicantName: '$applicant.name',
          applicantEmail: '$applicant.email',
        },
      },
    ])
    .toArray()
);

show(
  'Applications per job',
  jobPortal.applications
    .aggregate([
      { $group: { _id: '$job', applications: { $sum: 1 } } },
      { $lookup: { from: 'jobs', localField: '_id', foreignField: '_id', as: 'job' } },
      { $unwind: '$job' },
      { $project: { _id: 0, job: '$job.title', applications: 1 } },
      { $sort: { applications: -1 } },
    ])
    .toArray()
);

show(
  'Status history of the first application',
  jobPortal.applications.findOne({}, { status: 1, statusHistory: 1 })
);

show(
  'Users by role',
  jobPortal.users.aggregate([{ $group: { _id: '$role', count: { $sum: 1 } } }]).toArray()
);

show(
  'Jobs by status',
  jobPortal.jobs.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]).toArray()
);

show(
  'Applications by status',
  jobPortal.applications.aggregate([{ $group: { _id: '$status', count: { $sum: 1 } } }]).toArray()
);

show(
  'Most demanded skills',
  jobPortal.jobs
    .aggregate([
      { $unwind: '$requiredSkills' },
      { $group: { _id: '$requiredSkills', jobs: { $sum: 1 } } },
      { $sort: { jobs: -1 } },
      { $limit: 5 },
    ])
    .toArray()
);

if (RUN_WRITE_EXAMPLES) {
  jobPortal.users.updateOne({ email: 'seeker@demo.com' }, { $set: { isActive: false } });
  jobPortal.users.updateOne({ email: 'seeker@demo.com' }, { $set: { isActive: true } });

  const firstApplication = jobPortal.applications.findOne();

  if (firstApplication) {
    jobPortal.applications.updateOne(
      { _id: firstApplication._id },
      {
        $set: { status: 'shortlisted' },
        $push: { statusHistory: { status: 'shortlisted', changedAt: new Date() } },
      }
    );
  }
}
