import OpenAI from "openai";

// The newest OpenAI model is "gpt-4o" which was released May 13, 2024. do not change this unless explicitly requested by the user
const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

/**
 * Generates a response for the copilot feature using OpenAI's API
 * @param userMessage The message from the user
 * @returns A response from the AI assistant
 */
export async function generateCopilotResponse(userMessage: string): Promise<string> {
  try {
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are the Aero Solutions Copilot, an AI assistant for a software development company that specializes in aviation technology.

Key information about Aero Solutions:
- Full-stack software development company focused on aviation industry solutions
- Offers a range of platforms: AeroSync, AeroFlight, ExecSync, SkyForge Legend, Stitchlet, AeroOps
- Unique payment model: clients only pay when they're 100% satisfied with the results
- Founded by Brandon Rollins, a professional pilot and self-taught software engineer who combines aviation experience with technical expertise
- Clients receive 100% ownership of their code and complete intellectual property rights upon project completion
- Based in Miami, Florida

Your purpose is to demonstrate the power of AI technology that Aero Solutions can integrate into client projects.
Keep responses concise (maximum 3 sentences), helpful, and focused on aviation software topics.
Avoid making up specific details that aren't in the context above.`
        },
        {
          role: "user",
          content: userMessage
        }
      ],
      max_tokens: 250,
      temperature: 0.7,
    });

    return response.choices[0].message.content || "I'm sorry, I couldn't generate a response. Please try again.";
  } catch (error) {
    console.error("Error generating OpenAI response:", error);
    throw new Error("Failed to generate AI response");
  }
}