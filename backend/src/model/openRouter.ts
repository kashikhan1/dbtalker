import { ChatOpenAI } from "@langchain/openai";

export const openRouterLLM = new ChatOpenAI({
  modelName: process.env.OPEN_ROUTER_MODEL,
  apiKey: process.env.OPEN_ROUTER_API_KEY,
  configuration: {
    baseURL: process.env.OPEN_ROUTER_BASE_URL,
  },
});

