import type { AgentInterface } from "./agent-interface"
import { generateText, streamText } from "ai"
import { openai } from "@ai-sdk/openai"

export class AIAgent implements AgentInterface {
  async execute(prompt: string): Promise<string> {
    try {
      // Using the AI SDK to generate text
      const { text } = await generateText({
        model: openai("gpt-4o"),
        prompt: prompt,
        system: "You are a helpful AI assistant that provides concise and accurate information.",
      })

      return text
    } catch (error) {
      console.error("Error in AI agent execution:", error)
      throw new Error("Failed to execute AI agent")
    }
  }

  async streamResponse(prompt: string, onChunk: (chunk: string) => void): Promise<void> {
    try {
      const result = streamText({
        model: openai("gpt-4o"),
        prompt: prompt,
        system: "You are a helpful AI assistant that provides concise and accurate information.",
      })

      // Process the text stream
      for await (const chunk of result.textStream) {
        onChunk(chunk)
      }
    } catch (error) {
      console.error("Error in AI agent streaming:", error)
      throw new Error("Failed to stream AI agent response")
    }
  }
}

