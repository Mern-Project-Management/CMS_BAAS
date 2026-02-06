import { MongoClient } from 'mongodb';

declare global {
  // eslint-disable-next-line no-var
  var __mongoClientPromise: Promise<MongoClient> | undefined;
}

const uri = process.env.MONGODB_URI;

if (!uri) {
  // This file is imported by server routes; avoid throwing at import time so the app can boot,
  // but database operations will fail with a clear error.
  console.warn('MONGODB_URI is not set. Database features will be limited.');
}

export const mongoClientPromise: Promise<MongoClient> =
  global.__mongoClientPromise ??
  (async () => {
    if (!uri) throw new Error('Missing MONGODB_URI environment variable');
    const client = new MongoClient(uri);
    await client.connect();
    return client;
  })();

if (!global.__mongoClientPromise) {
  global.__mongoClientPromise = mongoClientPromise;
}

