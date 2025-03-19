export interface AgentInterface {
  execute(prompt: string): Promise<string>
  streamResponse(prompt: string, onChunk: (chunk: string) => void): Promise<void>
}

