import { streamText, tool } from "ai"
import { openai } from "@ai-sdk/openai"
import { z } from "zod"

// Allow streaming responses up to 30 seconds
export const maxDuration = 30

export async function POST(req: Request) {
  try {
    const { messages } = await req.json()

    if (!messages || !Array.isArray(messages)) {
      return new Response(JSON.stringify({ error: "Valid messages array is required" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      })
    }

    const result = streamText({
      model: openai("gpt-4o"),
      messages,
      system: "You are a database assistant that helps users explore and query databases.",
      toolCallStreaming: true, // Enable streaming of tool calls
      tools: {
        getTableNames: tool({
          description: "Get all table names from a database",
          parameters: z.object({
            dbUrl: z.string().describe("The database connection URL"),
          }),
          execute: async ({ dbUrl }) => {
            // In a real implementation, this would connect to the database
            // For demo purposes, we'll return mock data based on the provided output
            return JSON.stringify([
              "_prisma_migrations",
              "ProjectSetting",
              "User",
              "ResetToken",
              "Feedback",
              "AccessLog",
              "UserActivity",
              "File",
              "Chat",
              "Message",
            ])
          },
        }),
        getTableStructure: tool({
          description: "Get the structure of specified tables",
          parameters: z.object({
            dbUrl: z.string().describe("The database connection URL"),
            query: z.string().describe("The SQL query to get table structure"),
            requiredTables: z.array(z.string()).describe("The tables to get structure for"),
          }),
          execute: async ({ dbUrl, query, requiredTables }) => {
            // In a real implementation, this would execute the query
            // For demo purposes, we'll return mock data based on the provided output
            return JSON.stringify([
              {
                name: "public.User",
                columns: [
                  { name: "id", type: "integer" },
                  { name: "username", type: "text" },
                  { name: "email", type: "text" },
                  { name: "phoneNumber", type: "text" },
                  { name: "status", type: "enum(UserStatus)", enum_values: ["ACTIVE", "DISABLED"] },
                  { name: "role", type: "enum(UserRole)", enum_values: ["SUPER_ADMIN", "ADMIN", "USER"] },
                  { name: "password", type: "text" },
                  { name: "createdAt", type: "timestamp without time zone" },
                  { name: "updatedAt", type: "timestamp without time zone" },
                  { name: "deletedAt", type: "timestamp without time zone" },
                  { name: "metadata", type: "jsonb" },
                ],
                records: [
                  {
                    id: 1,
                    username: "user",
                    email: "user@example.com",
                    phoneNumber: "+13344442222",
                    status: "ACTIVE",
                    role: "SUPER_ADMIN",
                    password: "$2b$15$bYgmzgr9hjuviFkykob0Z.hjG1iaqgOfUsyN2fej/l87H9MlvgucO",
                    createdAt: "2025-02-12T06:20:31.263Z",
                    updatedAt: "2025-02-12T06:20:31.263Z",
                    deletedAt: null,
                    metadata: {},
                  },
                ],
              },
              {
                name: "public.Chat",
                columns: [
                  { name: "id", type: "integer" },
                  { name: "title", type: "text" },
                  { name: "userId", type: "integer" },
                  { name: "createdAt", type: "timestamp without time zone" },
                  { name: "updatedAt", type: "timestamp without time zone" },
                ],
                records: [
                  {
                    id: 1,
                    title: "germnay",
                    userId: 4,
                    createdAt: "2025-02-12T07:37:10.524Z",
                    updatedAt: "2025-02-12T07:37:10.524Z",
                  },
                ],
              },
            ])
          },
        }),
        executeQuery: tool({
          description: "Execute a SQL query on the database",
          parameters: z.object({
            dbUrl: z.string().describe("The database connection URL"),
            query: z.string().describe("The SQL query to execute"),
          }),
          execute: async ({ dbUrl, query }) => {
            // In a real implementation, this would execute the query
            // For demo purposes, we'll return mock data
            return JSON.stringify([
              {
                id: 1,
                username: "user",
                email: "user@example.com",
                chats: [
                  {
                    id: 1,
                    title: "germnay",
                  },
                ],
              },
            ])
          },
        }),
      },
      maxSteps: 5, // Allow multiple tool calls in a single request
    })

    return result.toDataStreamResponse()
  } catch (error) {
    console.error("Error in chat API:", error)
    return new Response(JSON.stringify({ error: "Failed to process request" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    })
  }
}

