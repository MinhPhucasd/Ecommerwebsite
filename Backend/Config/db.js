require('dotenv').config(); 
const { MongoClient, ServerApiVersion } = require('mongodb');

const uri = process.env.MONGODB_URI;

if (!uri) {
  console.error("Error: MONGODB_URI is not defined in your .env file.");
  process.exit(1);
}

const client = new MongoClient(uri, {
  serverApi: {
    version: ServerApiVersion.v1,
    strict: true,
    deprecationErrors: true,
  }
});

let dbInstance = null; 

async function connectDB() {
  if (dbInstance) {
    return dbInstance; 
  }
  try {
    await client.connect();
    console.log("Successfully connected to MongoDB Atlas!");
   
    dbInstance = client.db(); 

    return dbInstance;
  } catch (err) {
    console.error("Failed to connect to MongoDB Atlas", err);
    process.exit(1); 
  }
}

function getDB() {
  if (!dbInstance) {
    console.error("Database not connected. Call connectDB first.");
    return null; 
  }
  return dbInstance;
}

async function closeDB() {
  if (client) {
    await client.close();
    console.log("MongoDB connection closed.");
  }
}

module.exports = { connectDB, getDB, closeDB };