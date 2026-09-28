import { Worker } from 'bullmq';
import IORedis from 'ioredis';

const redisUrl = "redis://127.0.0.1:6379/0"
const connection = new IORedis(redisUrl, { maxRetriesPerRequest: null });

console.log('Worker is running and waiting for jobs...');

const worker = new Worker(
  'shopper',
  async job => {
    // Will print { foo: 'bar'} for the first job
    // and { qux: 'baz' } for the second.
    console.log(job.data);
  },
  { connection },
);
