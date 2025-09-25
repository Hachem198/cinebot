const client = require("../database/chroma");

async function testQuery() {
  const collection = await client.getCollection("books");

  const results = await collection.query({
    queryTexts: ["science fiction"],
    nResults: 5,
  });

  console.log(results);
}

testQuery();
