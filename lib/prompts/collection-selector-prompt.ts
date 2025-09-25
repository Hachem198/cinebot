export const makeCollectionSelectorPrompt = (messages: any) => {
  return `
  You are a classification assistant.  
  Your task is to choose which collection is most relevant to the user's query.  
  
  You can ONLY answer with one of the following options:
  - ["movies"] → if the query is about movies or cinema.  
  - ["books"] → if the query is about books or literature.  
  - ["none"] → if the query is unrelated to movies or books.
  - ["movies", "books"] → if the query is about both movies and books.  
  
  User query:
  "${messages[messages.length - 1].content}"
  
  Output format:
  {
    "collection": ["movies"] | ["books"] | ["none"] | ["movies", "books"]
  }
    `;
};
