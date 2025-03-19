import { ChatOllama } from "@langchain/ollama";

export const ollamaLLM = new ChatOllama({
  baseUrl: process.env.OLLAMA_BASE_URL,
  model: process.env.OLLAMA_MODEL,
  temperature:0,
});

