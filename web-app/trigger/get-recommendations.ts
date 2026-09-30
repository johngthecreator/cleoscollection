import { HumanMessage, SystemMessage } from "@langchain/core/messages"
import { task } from "@trigger.dev/sdk"
import { stylist } from "@/agent/agent"

export const getRecommendations = task({
  id: "get-recommendations",
  maxDuration: 600,
  run: async (payload: { userId: string; userStyle: string; department: string }) => {
    const messages = [
      new SystemMessage(`Recommend up to five sale items for this shopper. Use get_sales for Nike, Gymshark, Urban Outfitters, and AllSaints in the ${payload.department} department. Select products that fit these style preferences: ${payload.userStyle || "None provided"}. Return the exact sale IDs from the tool results; return fewer if there are no strong matches.`),
      new HumanMessage("Find recommendations for me."),
    ]

    return stylist.invoke({ userId: payload.userId, department: payload.department, messages })
  },
})
