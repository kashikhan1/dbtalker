import { task, entrypoint, addMessages } from "@langchain/langgraph";
import { AIMessage, BaseMessageLike } from "@langchain/core/messages";
import { ToolCall } from "@langchain/core/messages/tool";
import {
  toolsByName,
  llmWithTools,
  llmTableName,
  llmTablesStructure,
  toolsByNameTable,
  toolsByNameTableStructure,
} from "../tool";
import { openRouterLLM } from "../model/openRouter";

const callLlm = task("llmCall", async (messages: BaseMessageLike[]) => {
  return llmWithTools.invoke([
    {
      role: "system",
      content: `You are an intelligent and precise assistant responsible for generating postgres queries based strictly on the provided database table structure and inputs query. Always enclose table names and column names in double quotes (e.g., "TableName" and "ColumnName" and "TableName"."ColumnName") to ensure postgres syntax correctness. Focus solely on constructing the query without additional explanations or modifications.`,
    },
    ...messages,
  ]);
});

const callLlmTable = task(
  "llmTableSchemaCall",
  async (messages: BaseMessageLike[]) => {
    return llmTableName.invoke([
      {
        role: "system",
        content: `You are a helpful assistant tasked with performing database operations on a set of inputs.`,
      },
      ...messages,
    ]);
  }
);

const callLlmTableStructure = task(
  "llmTableStructureSchemaCall",
  async (messages: BaseMessageLike[]) => {
    return llmTablesStructure.invoke([
      {
        role: "system",
        content: `You are a helpful assistant tasked with performing database operations on a set of inputs getting table structure from the url and table names and than create a query.`,
      },
      ...messages,
    ]);
  }
);

const callTool = task("toolCall", async (toolCall: ToolCall) => {
  // Performs the tool call
  const tool = toolsByName[toolCall.name];
  return tool.invoke(toolCall.args as any);
});

const callToolTable = task("toolCallTableName", async (toolCall: ToolCall) => {
  // Performs the tool call
  const tool = toolsByNameTable[toolCall.name];
  return tool.invoke(toolCall.args as any);
});

const callToolTableStructure = task(
  "toolCallTableStructure",
  async (toolCall: ToolCall) => {
    // Performs the tool call
    const tool = toolsByNameTableStructure[toolCall.name];
    return tool.invoke(toolCall.args as any);
  }
);

export const agent = entrypoint(
  "agent",
  async (messages: BaseMessageLike[]) => {
    let getTableStructure = [];
    let llmResponseTable = await callLlmTable(messages);
    while (true) {
      if (!llmResponseTable.tool_calls?.length) {
        break;
      }
      const toolTableResults = await Promise.all(
        llmResponseTable?.tool_calls?.map((toolCall) => callToolTable(toolCall))
      );
      const toolResultsMessages = toolTableResults.map(
        (result) => new AIMessage(String(`here is my table names : ${result}`))
      );
      messages = addMessages(messages, [
        llmResponseTable,
        ...toolResultsMessages,
      ]);
      break;
    }

    let llmResponseTableStructure = await callLlmTableStructure(messages);
    while (true) {
      if (!llmResponseTableStructure.tool_calls?.length) {
        break;
      }
      const toolTableResults = await Promise.all(
        llmResponseTableStructure?.tool_calls?.map((toolCall) =>
          callToolTableStructure(toolCall)
        )
      );
      getTableStructure = toolTableResults;
      const toolResultsMessages = toolTableResults.map(
        (result) =>
          new AIMessage(String(`here is my table Structure : ${result}`))
      );
      messages = addMessages(messages, [
        llmResponseTableStructure,
        ...toolResultsMessages,
      ]);
      break;
    }
    return messages;
  }
);

export const agentQuery = entrypoint(
  "agentQuery",
  async (messages: BaseMessageLike[]) => {

    let llmResponse = await callLlm(messages);
    console.log("=====================================");
    console.log( `query ${(messages[0] as any).content.split('query')[1]?.trim()}`)
    console.log("=====================================");
      if (!llmResponse.tool_calls?.length) {
        return messages;
      }

      // Execute tools
      const toolResults = await Promise.all(
        llmResponse?.tool_calls?.map((toolCall) => callTool(toolCall))
      );
      const toolResultsMessages = toolResults.map(
        (result) => new AIMessage(String(result))
      );
      messages = addMessages(messages, [llmResponse, ...toolResultsMessages]);
      return messages;
  }
);
