import { makeCollectionSelectorPrompt } from "@/lib/prompts/collection-selector-prompt";
import { google } from "@ai-sdk/google";
import { generateObject, generateText } from "ai";
import { z } from "zod";

export async function collectionSelectorAgent(messages: any) {
  const prompt = makeCollectionSelectorPrompt(messages);
  const result = await generateObject({
    model: google("gemini-2.0-flash"),
    prompt,
    schema: z.object({
      collection: z.array(z.string()),
    }),
  });

  const choice = result.object.collection;
  return choice;
}
