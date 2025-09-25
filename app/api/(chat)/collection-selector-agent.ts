import { makeCollectionSelectorPrompt } from "@/lib/prompts/collection-selector-prompt";
import { google } from "@ai-sdk/google";
import { generateText } from "ai";

export async function collectionSelectorAgent(messages: any) {
  const prompt = makeCollectionSelectorPrompt(messages);

  const result = await generateText({
    model: google("gemini-1.5-flash"),
    prompt,
  });

  const choice = result.text.trim().toLowerCase();

  if (!["movies", "books", "both", "none"].includes(choice)) {
    return "none";
  }

  return choice;
}
