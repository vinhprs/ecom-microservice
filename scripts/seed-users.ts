import axios from 'axios';

const AUTH_API_URL = 'http://localhost:8000/api/v1/auth';
const TOTAL_USERS = 100000;
const BATCH_SIZE = 1000;
const CONCURRENCY = 10;

const createUser = async (index: number) => {
  try {
    const response = await axios.post(AUTH_API_URL + '/register', {
      email: `user${index}@example.com`,
      password: '12345678',
      fullName: `User ${index}`,
    });
    return response.data;
  } catch (error) {
    console.error(`Error creating user ${index}:`, error);
    throw error;
  }
};

const createBatch = async (startIndex: number, batchSize: number) => {
  const promises = [];

  for (let i = startIndex; i < startIndex + batchSize; i++) {
    const user = await createUser(i);
    if (user) {
      promises.push(user);
    }
  }

  return promises;
};

const seedUsers = async () => {
  for (let i = 0; i < TOTAL_USERS; i += BATCH_SIZE * CONCURRENCY) {
    const batchPromises = [];

    // Create batches concurrently
    for (let j = 0; j < CONCURRENCY; j++) {
      const batchStart = i + j * BATCH_SIZE;
      if (batchStart < TOTAL_USERS) {
        const batchEnd = Math.min(batchStart + BATCH_SIZE, TOTAL_USERS);
        const actualBatchSize = batchEnd - batchStart;
        batchPromises.push(createBatch(batchStart, actualBatchSize));
      }
    }

    await Promise.all(batchPromises);
  }
};

seedUsers()
  .then(() => {
    console.log('Users seeded successfully');
  })
  .catch((error) => {
    console.error('Error seeding users:', error);
  });
