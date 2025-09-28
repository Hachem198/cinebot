import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { NextRequest } from "next/server";
import { collectionSelectorAgent } from "./collection-selector-agent";
import client from "@/lib/database/chroma";
import { makeGenerateResponsePrompt } from "@/lib/prompts/generate-response-prompt";
import { OpenAIEmbeddingFunction } from "@chroma-core/openai";
import type {
  RetrievedDocument,
  CollectionSearchResult,
  DocumentsByType,
} from "@/lib/types/chat-api";

export async function POST(req: NextRequest) {
  try {
    const { messages } = await req.json();
    if (!messages || !Array.isArray(messages) || messages.length === 0) {
      return new Response(
        JSON.stringify({ error: "Invalid messages format" }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const searchResults: CollectionSearchResult[] = [];
    const collectionNames = await collectionSelectorAgent(messages);

    if (collectionNames.includes("none")) {
      return new Response(
        JSON.stringify({ text: "I'm sorry, I can't answer that question." }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const availableCollections = await client.listCollections();
    const availableCollectionNames = availableCollections.map(
      (col) => col.name
    );

    for (const collectionName of collectionNames) {
      try {
        if (!availableCollectionNames.includes(collectionName)) {
          console.warn(`Collection "${collectionName}" not found`);
          continue;
        }

        const collection = await client.getCollection({ name: collectionName });

        const latestMessage = messages[messages.length - 1];
        if (!latestMessage || !latestMessage.content) {
          console.warn("Latest message has no content");
          continue;
        }
        const embeddingFunction = new OpenAIEmbeddingFunction({
          apiKey: process.env.NEXT_PUBLIC_OPENAI_API_KEY,
          modelName: "text-embedding-3-small",
        });
        const embeddings = await embeddingFunction.generate([
          latestMessage.content,
        ]);
        const queryResults = await collection.query({
          queryEmbeddings: embeddings,
          nResults: 5,
        });
        console.log({ results: queryResults });

        if (
          queryResults.documents &&
          queryResults.documents[0] &&
          queryResults.documents[0].length > 0
        ) {
          const documents = queryResults.documents[0];
          const metadatas = queryResults.metadatas?.[0] || [];
          const distances = queryResults.distances?.[0] || [];

          const retrievedDocuments: RetrievedDocument[] = documents
            .map((content: string | null, index: number) => ({
              content: content || "",
              metadata: metadatas[index] || {},
              distance: distances[index],
            }))
            .filter((doc) => doc.content.length > 0);

          const searchResult: CollectionSearchResult = {
            collectionName,
            documentType: collectionName === "movies" ? "movies" : "books",
            retrievedDocuments,
          };

          searchResults.push(searchResult);
        }
      } catch (collectionError) {
        console.error(
          `Error processing collection "${collectionName}":`,
          collectionError
        );
        continue;
      }
    }

    if (searchResults.length === 0) {
      return new Response(
        JSON.stringify({
          text: "I couldn't find any relevant information to answer your question.",
        }),
        {
          headers: { "Content-Type": "application/json" },
        }
      );
    }

    const documentsByType: DocumentsByType = {
      movies: [],
      books: [],
    };

    searchResults.forEach((result) => {
      const targetArray = documentsByType[result.documentType];
      targetArray.push(...result.retrievedDocuments);
    });

    const prompt = makeGenerateResponsePrompt(
      documentsByType,
      messages[messages.length - 1].content
    );

    const result = await generateText({
      model: google("gemini-2.0-flash"),
      prompt,
    });

    return new Response(JSON.stringify({ text: result.text }), {
      headers: { "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("API Route Error:", error);
    return new Response(
      JSON.stringify({
        error: "Internal server error",
        message:
          process.env.NODE_ENV === "development" ? error.message : undefined,
      }),
      {
        status: 500,
        headers: { "Content-Type": "application/json" },
      }
    );
  }
}
