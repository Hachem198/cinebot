export interface RetrievedDocument {
  content: string;
  metadata: Record<string, any>;
  distance?: number | null;
}

export interface CollectionSearchResult {
  collectionName: string;
  documentType: "movies" | "books";
  retrievedDocuments: RetrievedDocument[];
}

export interface DocumentsByType {
  movies: RetrievedDocument[];
  books: RetrievedDocument[];
}
