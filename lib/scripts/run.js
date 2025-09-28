require("dotenv").config({ path: ".env.local" });
const fs = require("fs");
const path = require("path");
const client = require("../database/chroma");
const { OpenAIEmbeddingFunction } = require("@chroma-core/openai");
async function populateDatabase() {
  try {
    console.log("Starting database population...");

    // Check if OpenAI API key is available
    if (!process.env.OPENAI_API_KEY) {
      throw new Error(
        "OPENAI_API_KEY environment variable is not set. Please add it to your .env file."
      );
    }

    // Read JSON files
    const booksPath = path.join(__dirname, "books.json");
    const moviesPath = path.join(__dirname, "movies.json");

    const books = JSON.parse(fs.readFileSync(booksPath, "utf8"));
    const movies = JSON.parse(fs.readFileSync(moviesPath, "utf8"));

    console.log(`Loaded ${books.length} books and ${movies.length} movies`);

    // Delete existing collections if they exist (to fix embedding function issue)
    try {
      await client.deleteCollection({ name: "books" });
      console.log("Deleted existing books collection");
    } catch (error) {
      // Collection doesn't exist, that's fine
    }

    try {
      await client.deleteCollection({ name: "movies" });
      console.log("Deleted existing movies collection");
    } catch (error) {
      // Collection doesn't exist, that's fine
    }

    // Create or get collections
    let booksCollection, moviesCollection;

    try {
      booksCollection = await client.getCollection({ name: "books" });
      console.log("Found existing books collection");
    } catch (error) {
      booksCollection = await client.createCollection({
        name: "books",
        embeddingFunction: new OpenAIEmbeddingFunction({
          openai_api_key: process.env.OPENAI_API_KEY,
          modelName: "text-embedding-3-small",
        }),
      });
      console.log("Created new books collection");
    }

    try {
      moviesCollection = await client.getCollection({ name: "movies" });
      console.log("Found existing movies collection");
    } catch (error) {
      moviesCollection = await client.createCollection({
        name: "movies",
        embeddingFunction: new OpenAIEmbeddingFunction({
          openai_api_key: process.env.OPENAI_API_KEY,
          modelName: "text-embedding-3-small",
        }),
      });
      console.log("Created new movies collection");
    }

    // Process books
    console.log("Processing books...");
    for (let i = 0; i < books.length; i++) {
      const book = books[i];

      // Create text content for embedding
      const textContent = `${book.title} ${book.subtitle || ""} by ${
        book.author
      }. ${book.description}`.trim();

      // Get embeddings

      // Add to collection
      await booksCollection.add({
        ids: [book.isbn],
        metadatas: [
          {
            title: book.title,
            subtitle: book.subtitle || "",
            author: book.author,
            published: book.published,
            publisher: book.publisher,
            pages: book.pages,
            website: book.website || "",
          },
        ],
        documents: [textContent],
      });

      console.log(`Added book ${i + 1}/${books.length}: ${book.title}`);
    }

    // Process movies
    console.log("Processing movies...");
    for (let i = 0; i < movies.length; i++) {
      const movie = movies[i];

      // Create text content for embedding
      const cast = Array.isArray(movie.cast) ? movie.cast.join(", ") : "";
      const genres = Array.isArray(movie.genres) ? movie.genres.join(", ") : "";
      const textContent =
        `${movie.title} (${movie.year}). Genres: ${genres}. Cast: ${cast}. ${movie.extract}`.trim();

      // Generate unique ID for movie
      const movieId = `${movie.title.replace(/[^a-zA-Z0-9]/g, "_")}_${
        movie.year
      }`;

      // Get embeddings

      // Add to collection
      await moviesCollection.add({
        ids: [movieId],
        metadatas: [
          {
            title: movie.title,
            year: movie.year,
            cast: cast,
            genres: genres,
            href: movie.href || "",
            thumbnail: movie.thumbnail || "",
            thumbnail_width: movie.thumbnail_width || 0,
            thumbnail_height: movie.thumbnail_height || 0,
          },
        ],
        documents: [textContent],
      });

      console.log(`Added movie ${i + 1}/${movies.length}: ${movie.title}`);
    }

    console.log("Database population completed successfully!");

    // Verify collections
    const booksCount = await booksCollection.count();
    const moviesCount = await moviesCollection.count();
    console.log(`Final counts - Books: ${booksCount}, Movies: ${moviesCount}`);
  } catch (error) {
    console.error("Error populating database:", error);
    process.exit(1);
  }
}

// Run the script
if (require.main === module) {
  populateDatabase();
}

module.exports = { populateDatabase };
