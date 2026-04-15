import { Pinecone } from "@pinecone-database/pinecone";

let pineconeInstance = null;

export const getPineconeClient = () => {
  if (!pineconeInstance) {
    pineconeInstance = new Pinecone({
      apiKey: process.env.PINECONE_API_KEY,
    });
  }
  return pineconeInstance;
};

export const getPineconeIndex = () => {
  const client = getPineconeClient();
  return client.index(process.env.PINECONE_INDEX_NAME);
};
