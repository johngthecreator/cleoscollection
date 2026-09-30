import { StructuredToolInterface, tool } from "@langchain/core/tools";
import { ChatOpenAI } from "@langchain/openai";
import * as z from "zod";
import type { ToolCall } from "@langchain/core/messages/tool";

import { task, entrypoint } from "@langchain/langgraph";
import { type BaseMessage } from "@langchain/core/messages";
import { addMessages } from "@langchain/langgraph";

import { db } from "@/db";
import { recommendationsTable, salesTable } from "@/db/schema";
import { eq, and } from "drizzle-orm";

import { ToolMessage } from "@langchain/core/messages";
import { GET_PRODUCT_DETAIL_FORMAT, GRAB_SALES_FORMAT } from "./prompts";


const model = new ChatOpenAI({
  model: "gpt-6-luna",
  useResponsesApi: true,
  reasoning: { effort: "low" },
});



const brands = z.enum([
  "nike",
  "gymshark",
  "urban_outfitters",
  "allsaints",
])

// Define tools
const getSales = tool(async ({ brand, department }) => {
  if (department) {
    return JSON.stringify(await db.select().from(salesTable).where(and(eq(salesTable.source, brand), eq(salesTable.department, department))))
  }
  return JSON.stringify(await db.select().from(salesTable).where(and(eq(salesTable.source, brand))))
}, {
  name: "get_sales",
  description: "Grab all the sales related to a brand or a department",
  schema: z.object({
    brand: brands.describe("Specific brand you're looking for"),
    department: z.string().describe("Department to search, as specified in the system prompt"),
  }),
});

const connectRecommendations = tool(async ({ saleIds, userId }) => {
  await db.delete(recommendationsTable).where(
    eq(recommendationsTable.userId, userId),
  )
  const recommendationConnections = saleIds.map((saleId: number) => { return { userId, saleId } })
  await db.insert(recommendationsTable).values(recommendationConnections);
}, {
  name: "connect_recommendations",
  description: "Connect recommendations with a given user",
  schema: z.object({
    saleIds: z.number().array().describe("an array of sale ids from products that were recommended"),
    userId: z.string().describe("The id of the user we want to associate these products to"),
  }),
});

// Augment the LLM with tools
const toolsByName = {
  [getSales.name]: getSales,
  [connectRecommendations.name]: connectRecommendations,
};

const tools = Object.values(toolsByName);
const modelWithTools = model.bindTools(tools, { strict: true });


const FinalAnswerSchema = z.object({
  products: z.array(
    z.object({
      saleId: z.number(),
      reason: z.string(),
    }),
  ),
});

const finalModel = model.withStructuredOutput(FinalAnswerSchema, {
  method: "jsonSchema",
  strict: true,
});


const callLlm = task({ name: "callLlm" }, async (messages: BaseMessage[]) => {
  return modelWithTools.invoke([
    ...messages,
  ]);
});

const callStructured = task({ name: "callStructured" }, async (messages: BaseMessage[]) => {
  return finalModel.invoke([
    ...messages,
  ]);
});


const callTool = task({ name: "callTool" }, async (toolCall: ToolCall) => {
  const toolFn = toolsByName[
    toolCall.name as keyof typeof toolsByName
  ] as StructuredToolInterface;

  if (!toolFn) throw new Error(`Unknown tool: ${toolCall.name}`)
  const result = await toolFn.invoke(toolCall.args);

  let content = String(result);
  if (toolCall.name === "grab_sales") {
    content = `${GRAB_SALES_FORMAT}${content}`;
  } else if (toolCall.name === "get_product_detail") {
    content = `${GET_PRODUCT_DETAIL_FORMAT}${content}`;
  }

  if (!toolCall.id) throw new Error("Tool call is missing an ID");

  return new ToolMessage({
    content,
    name: toolCall.name,
    tool_call_id: toolCall.id,
  });
});


export const stylist = entrypoint({ name: "stylist" }, async (input: { userId: string; department: string; messages: BaseMessage[] }) => {
  let messages = input.messages;
  let modelResponse = await callLlm(messages);

  while (true) {
    if (!modelResponse.tool_calls?.length) {
      break;
    }

    // Execute tools
    const toolResults = await Promise.all(
      modelResponse.tool_calls.map((toolCall) => callTool(toolCall))
    );
    messages = addMessages(messages, [modelResponse, ...toolResults]);
    modelResponse = await callLlm(messages);
  }
  const result = await callStructured(addMessages(messages, [modelResponse]));
  return result;
});

export const shopper = entrypoint({ name: "shopper" }, async (messages: BaseMessage[]) => {
  let modelResponse = await callLlm(messages);

  while (true) {
    if (!modelResponse.tool_calls?.length) {
      break;
    }

    const toolResults = await Promise.all(
      modelResponse.tool_calls.map((toolCall) => callTool(toolCall))
    );
    messages = addMessages(messages, [modelResponse, ...toolResults]);
    modelResponse = await callLlm(messages);
  }

  const result = await callStructured(messages);

  return result;
});
