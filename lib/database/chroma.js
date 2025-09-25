const { ChromaClient } = require("chromadb");

const client = new ChromaClient({
  path: "http://localhost:8000",
});

module.exports = client;

const collection = await client.getCollection("books");

const results = await collection.query({
  queryTexts: ["science fiction"],
  nResults: 5,
});

console.log(results);
