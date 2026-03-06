import { MongoClient } from "mongodb";

const options = {};

let clientPromise: Promise<MongoClient>;

if (process.env.MONGODB_URI) {
    const uri = process.env.MONGODB_URI;
    if (process.env.NODE_ENV === "development") {
        const globalWithMongo = global as typeof globalThis & {
            _mongoClientPromise?: Promise<MongoClient>;
        };
        if (!globalWithMongo._mongoClientPromise) {
            const client = new MongoClient(uri, options);
            globalWithMongo._mongoClientPromise = client.connect();
        }
        clientPromise = globalWithMongo._mongoClientPromise;
    } else {
        const client = new MongoClient(uri, options);
        clientPromise = client.connect();
    }
} else {
    // Deferred connection — will throw at runtime if accessed without env var
    clientPromise = new Promise((_, reject) => {
        reject(new Error("Please add your Mongo URI to .env.local"));
    });
}

export default clientPromise;
