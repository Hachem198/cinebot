export const makeGenerateResponsePrompt = (
  documents?: any,
  userQuery?: string
) => {
  return `
  You are a helpful assistant that generates a concise and informative response to the user's query.
  
  User query:
  "${userQuery || (documents?.[documents.length - 1].content ?? "")}"
  
  Available information:
  
  Movies:
  ${
    documents?.movies?.length
      ? documents.movies
          .map(
            (m: any, i: number) => `${i + 1}. ${m.metadata?.title || m.content}`
          )
          .join("\n")
      : "None"
  }
  
  Books:
  ${
    documents?.books?.length
      ? documents.books
          .map(
            (b: any, i: number) => `${i + 1}. ${b.metadata?.title || b.content}`
          )
          .join("\n")
      : "None"
  }
  
  Instructions:
  - Only use the information provided in the Movies and Books lists.  
  - Pick the most relevant items that directly answer the user's query.  
  - If multiple items are relevant, you can mention up to 3 of each type.  
  
  Generate a natural, helpful response to the user query.
    `;
};
