import { google } from "@ai-sdk/google";
import { generateText } from "ai";
import { NextRequest } from "next/server";
import { getEmbeddings } from "@/lib/embedder";
import { collectionSelectorAgent } from "./collection-selector-agent";
import client from "@/lib/database/chroma";
import { makeGenerateResponsePrompt } from "@/lib/prompts/generate-response-prompt";

export async function POST(req: NextRequest) {
  const { messages } = await req.json();
  const documments = [];
  const collectionssNames = await collectionSelectorAgent(messages);
  if (collectionssNames.includes("none")) {
    return new Response(
      JSON.stringify({ text: "I'm sorry, I can't answer that question." }),
      {
        headers: { "Content-Type": "application/json" },
      }
    );
  }
  for (const collectionName of collectionssNames) {
    const collection = await client.getCollection({ name: collectionName });
    const embeddedMessage = await getEmbeddings(
      messages[messages.length - 1].content
    );
    console.log({ embeddedMessage });
    const results = await collection.query({
      queryEmbeddings: embeddedMessage,
      nResults: 5,
    });
    documments.push(...results.documents);
  }
  const prompt = makeGenerateResponsePrompt(
    documments,
    messages[messages.length - 1].content
  );

  const result = await generateText({
    model: google("gemini-1.5-flash"),
    prompt,
  });

  // 👇 return JSON instead of a stream
  return new Response(JSON.stringify({ text: result.text }), {
    headers: { "Content-Type": "application/json" },
  });
}
