// embedder.js
let embedder = null;

async function getEmbeddings(texts) {
  const { pipeline } = await import("@xenova/transformers");
  if (!embedder) {
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }

  const embeddings = await embedder(texts, {
    pooling: "mean",
    normalize: true,
  });

  return embeddings.tolist();
}

module.exports = { getEmbeddings };
