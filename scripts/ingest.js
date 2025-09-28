// scripts/ingest.js
// Node script to read JSON files and populate two Chroma collections: 'movies' and 'books'
const fs = require("fs");
const path = require("path");
const { ChromaClient } = require("chromadb");

const CHROMA_SERVER = "http://localhost:8000";
const client = new ChromaClient({ path: CHROMA_SERVER });

async function ingestCollection(name, filePath, docTextFn) {
  console.log(`Ingesting ${name} from ${filePath}...`);
  const raw = fs.readFileSync(filePath, "utf-8");
  const items = JSON.parse(raw);

  const ids = [];
  const documents = [];
  const metadatas = [];

  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    const id = `${name}-${i}-${Date.now()}`;
    ids.push(id);

    // Main searchable text
    documents.push(docTextFn(item));

    // ✅ Flatten metadata (no arrays or objects)
    const flatMeta = {};
    for (const [key, value] of Object.entries(item)) {
      if (Array.isArray(value)) {
        flatMeta[key] = value.join(", "); // turn array into string
      } else if (typeof value === "object" && value !== null) {
        flatMeta[key] = JSON.stringify(value); // stringify nested objects
      } else {
        flatMeta[key] = value; // keep string/number/boolean/null as-is
      }
    }

    metadatas.push(flatMeta);
  }

  const collection = await client.getOrCreateCollection({ name });

  await collection.add({
    ids,
    documents,
    metadatas,
  });

  console.log(`Inserted ${ids.length} docs into '${name}'`);
}
async function main() {
  const dataDir = path.resolve(process.cwd(), "data");

  await ingestCollection("movies", path.join(dataDir, "movies.json"), (m) => {
    // combine useful fields into searchable document text
    return `${m.title}\n\n${m.description || ""}\n\nGenres: ${(
      m.genres || []
    ).join(", ")}\nYear: ${m.year || ""}`;
  });

  await ingestCollection("books", path.join(dataDir, "books.json"), (b) => {
    return `${b.title}\n\n${b.description || ""}\n\nAuthor: ${
      b.author || ""
    }\nGenres: ${(b.genres || []).join(", ")}`;
  });

  console.log("Ingestion complete.");
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
