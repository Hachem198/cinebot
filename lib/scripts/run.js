const fs = require("fs");
const path = require("path");
const { getEmbeddings } = require("../embedder");
const client = require("../database/chroma");

// Data mappers for different content types
const mapBookData = (book, index) => {
  const id = book.isbn || `book_${index}`;
  const text = `${book.title}${book.subtitle ? ` - ${book.subtitle}` : ""} by ${
    book.author
  }. ${book.description}`;
  const metadata = {
    title: book.title,
    author: book.author,
    publisher: book.publisher,
    pages: book.pages,
    published: book.published,
    type: "book",
    isbn: book.isbn,
  };
  return { id, text, metadata };
};

const mapMovieData = (movie, index) => {
  const id = `movie_${movie.title
    .replace(/[^a-zA-Z0-9]/g, "_")
    .toLowerCase()}_${movie.year}`;
  const cast = Array.isArray(movie.cast) ? movie.cast.join(", ") : "";
  const genres = Array.isArray(movie.genres) ? movie.genres.join(", ") : "";
  const text = `${movie.title} (${movie.year}). Genres: ${genres}. Cast: ${cast}. ${movie.extract}`;
  const metadata = {
    title: movie.title,
    year: movie.year,
    cast: movie.cast,
    genres: movie.genres,
    type: "movie",
  };
  return { id, text, metadata };
};

async function insertDataset(filePath, collectionName, mapper) {
  try {
    console.log(`📖 Reading ${filePath}...`);
    const fullPath = path.resolve(__dirname, filePath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`File not found: ${fullPath}`);
    }

    const raw = fs.readFileSync(fullPath, "utf-8");
    const data = JSON.parse(raw);

    if (!Array.isArray(data)) {
      throw new Error(`Expected array in ${filePath}, got ${typeof data}`);
    }

    console.log(`🗃️  Creating/getting collection "${collectionName}"...`);
    const collection = await client.getOrCreateCollection({
      name: collectionName,
    });

    console.log(`🧠 Processing ${data.length} items for embeddings...`);

    for (let i = 0; i < data.length; i++) {
      const item = data[i];
      const { id, text, metadata } = mapper(item, i);

      try {
        console.log(
          `  Processing: ${metadata.title} (${i + 1}/${data.length})`
        );

        const [embedding] = await getEmbeddings([text]);

        await collection.add({
          ids: [id],
          documents: [text],
          metadatas: [metadata],
          embeddings: [embedding],
        });
      } catch (error) {
        console.error(`❌ Error processing item ${i + 1}: ${error.message}`);
        console.error(`   Item: ${JSON.stringify(item, null, 2)}`);
        // Continue with next item instead of stopping
        continue;
      }
    }

    console.log(
      `✅ Successfully inserted ${data.length} items into "${collectionName}"`
    );
  } catch (error) {
    console.error(
      `❌ Failed to insert dataset ${collectionName}:`,
      error.message
    );
    throw error;
  }
}

async function run() {
  try {
    console.log("🚀 Starting data insertion process...\n");

    await insertDataset("./books.json", "books", mapBookData);
    await insertDataset("./movies.json", "movies", mapMovieData);

    console.log("\n🎉 All data successfully inserted into Chroma database!");
  } catch (error) {
    console.error("\n💥 Script failed:", error.message);
    process.exit(1);
  }
}

// Only run if this file is executed directly
if (require.main === module) {
  run();
}

module.exports = { run, insertDataset, mapBookData, mapMovieData };
