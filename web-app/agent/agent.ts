import { StructuredToolInterface, tool } from "@langchain/core/tools";
import { ChatOpenAI } from "@langchain/openai";
import * as z from "zod";
import type { ToolCall } from "@langchain/core/messages/tool";

import { task, entrypoint } from "@langchain/langgraph";
import { type BaseMessage } from "@langchain/core/messages";
import { addMessages } from "@langchain/langgraph";

import { db } from "@/db";
import { recommendationsTable, salesTable } from "@/db/schema";
import { eq, and, inArray } from "drizzle-orm";

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

// Augment the LLM with tools
const toolsByName = {
  [getSales.name]: getSales,
};

const tools = Object.values(toolsByName);
const modelWithTools = model.bindTools(tools, {strict: true});


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
  const saleIds = [...new Set(result.products.map((product) => product.saleId))].slice(0, 5);
  const verifiedSales = saleIds.length
    ? await db.select({ id: salesTable.id }).from(salesTable).where(and(
        inArray(salesTable.id, saleIds),
        eq(salesTable.department, input.department),
        eq(salesTable.isActive, true),
      ))
    : [];

  await db.transaction(async (tx) => {
    await tx.delete(recommendationsTable).where(eq(recommendationsTable.userId, input.userId));
    if (verifiedSales.length) {
      await tx.insert(recommendationsTable).values(verifiedSales.map((sale) => ({ userId: input.userId, saleId: sale.id })));
    }
  });

  return { count: verifiedSales.length };
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
