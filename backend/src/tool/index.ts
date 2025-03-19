import { query, getTableNames, getTableStructure } from "./pgTool";
import { ollamaLLM } from "../model/ollama";
// import { add, multiply, divide } from "./mathTool";


// Augment the LLM with tools
const tools = [query];
const toolTable = [getTableNames]
const toolTableStructure = [getTableStructure]
const toolsByName = Object.fromEntries(tools.map((tool) => [tool.name, tool]));
const toolsByNameTable = Object.fromEntries(toolTable.map((tool) => [tool.name, tool]));
const toolsByNameTableStructure = Object.fromEntries(toolTableStructure.map((tool) => [tool.name, tool]));
const llmWithTools = ollamaLLM.bindTools(tools);
const llmTableName = ollamaLLM.bindTools([getTableNames]);
const llmTablesStructure = ollamaLLM.bindTools([getTableStructure]);
const llmQuery = ollamaLLM.bindTools([ query]);

export { tools, toolsByName, llmWithTools,llmTableName, llmTablesStructure, toolsByNameTable, toolsByNameTableStructure, llmQuery, ollamaLLM as llm };