import OpenAI from "openai";
import dotenv from "dotenv";
import { collection } from "../chroma/chromaClient";
dotenv.config();

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY! });

export async function getEmailInsight(
  emailThread: any[],
  clientEmail: string,
  clientName: string,
  leadDescription: string
) {
  // 1️⃣ Retrieve relevant product info from ChromaDB
  const chroma = await collection;
  const allDocs = await chroma.get();
  const docContext = allDocs.documents?.join("\n\n") || "";

  const prompt = ` You are an AI Lead Qualification & Sales Intelligence Engine.

  I will provide you with:
  1. Raw email-thread chunks (from ChromaDB)
  2. Revolte product description chunks (from ChromaDB)
  3. Lead’s company description
  
  Your job is to reconstruct, evaluate, classify, and advise based on my B2B pitch performance AND respond strictly in the JSON structure provided below.
  
  IMPORTANT:
  Your final output MUST ALWAYS follow this exact JSON schema with the same keys. Do NOT change key names, formatting, or structure.
  
  -------------------- JSON OUTPUT FORMAT --------------------
  
  {
    "client_name": ${clientName},
    "client_email": ${clientEmail},
    "reconstructed_email_thread": "",
    "lead_score_breakdown": {
      "base_score": 100,
      "response_rate_points": 0,
      "avg_response_time_points": 0,
      "positive_sentiment_points": 0,
      "budget_discussed_points": 0,
      "multiple_stakeholders_points": 0,
      "meeting_scheduled_points": 0,
      "technical_questions_points": 0,
      "company_size_points": 0,
      "decision_maker_points": 0,
      "no_response_penalty": 0,
      "negative_sentiment_penalty": 0,
      "price_objection_penalty": 0,
      "ghosting_penalty": 0,
      "final_score": 0
    },
    "conversion_likelihood": {
      "category": "",
      "reason": ""
    },
    "lead_fit_analysis": {
      "fit_rating": "",
      "budget_alignment": "",
      "technical_alignment": "",
      "company_stage_alignment": "",
      "overall_fit_reason": ""
    },
    "pitch_quality_evaluation": {
      "strengths": "",
      "weaknesses": "",
      "missed_opportunities": "",
      "recommended_focus_areas": ""
    },
    "next_steps": {
      "followup_messages": [
        "",
        "",
        ""
      ],
      "ghosting_nudges": [
        "",
        ""
      ],
      "strong_conversion_attempt": "",
      "value_reinforcement_message": ""
    }
  }
  
  -------------------- TASK RULES --------------------
  
  1. **Reconstruct Email Thread**
  - Combine fragmented ChromaDB chunks into a clean, chronological conversation.
  - Detect sender (me vs lead) per message.
  - Detect sentiment per message.
  - Identify buying intent signals + objections + delays.
  
  2. **Lead Scoring**
  Start with Base Score = 10
  
  Add:
  + Positive sentiment → +10
  + Budget discussed → +15
  + Meeting scheduled → +15
  + Technical questions asked → +10
  + Decision maker involved → +10
  + looking forward → +40
  + any green signals → +40
  + Amazing → +10
  + move ahead → +10
  
  Subtract:
  - No response in 7 days → -10
  - Negative sentiment → -15
  - Price objections → -5
  - Ghosting after proposal → -20
  - not fully convinced → -30
  
  3. **Conversion Likelihood**
  Classify into:
  - HOT LEAD (80–100)
  - WARM LEAD (60–79)
  - COLD LEAD (40–59)
  - LOW PRIORITY (<40)
  
  4. **Lead Fit Analysis**
  Based on the lead’s company description:
  - Budget alignment
  - Technical alignment
  - Stage alignment
  - Fit rating (Excellent / Good / Moderate / Weak)
  - Provide reasoning.
  
  5. **Pitch Quality Evaluation** (using Revolte product knowledge)
  Assess:
  - Strengths
  - Weaknesses
  - Missed opportunities
  - Recommended focus areas (pricing, ROI, security, DevX, tool consolidation, AWS comparison, etc.)
  
  6. **Next Steps**
  Provide:
  - Exactly 3 follow-up messages
  - Exactly 2 ghosting nudges
  - 1 strong conversion attempt
  - 1 value reinforcement message
  
  -------------------- NOW WAIT FOR MY INPUT --------------------
  
  I will paste in:
  
  EMAIL THREAD CHUNKS:
  ${emailThread}
  
  REVOLTE PRODUCT CHUNKS:
  ${docContext}
  
  LEAD COMPANY DESCRIPTION:
  ${leadDescription} `;

  const completion = await openai.chat.completions.create({
    model: "gpt-4o-mini",
    messages: [{ role: "user", content: prompt }],
  });

  return completion.choices[0].message?.content;
}
