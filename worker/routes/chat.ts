import { Hono } from "hono";
import { eq, desc, and } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import type { Env, Variables } from "../index";

export const chatRoutes = new Hono<{ Bindings: Env; Variables: Variables }>();

// Get chat messages for a project
chatRoutes.get("/:projectId/messages", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  
  const db = c.get("db");
  const projectId = parseInt(c.req.param("projectId"));
  
  // Verify project ownership
  const project = await db.select()
    .from(schema.projects)
    .where(and(
      eq(schema.projects.id, projectId),
      eq(schema.projects.userId, user.id)
    ))
    .get();
  
  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }
  
  const messages = await db.select()
    .from(schema.chatMessages)
    .where(eq(schema.chatMessages.projectId, projectId))
    .orderBy(schema.chatMessages.createdAt);
  
  return c.json({ messages });
});

// Send a message and get AI response
chatRoutes.post("/:projectId/messages", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  
  const db = c.get("db");
  const projectId = parseInt(c.req.param("projectId"));
  const body = await c.req.json();
  
  // Verify project ownership
  const project = await db.select()
    .from(schema.projects)
    .where(and(
      eq(schema.projects.id, projectId),
      eq(schema.projects.userId, user.id)
    ))
    .get();
  
  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }
  
  const { content } = body;
  
  if (!content) {
    return c.json({ error: "Message content is required" }, 400);
  }
  
  // Save user message
  const userMessage = await db.insert(schema.chatMessages).values({
    projectId,
    role: "user",
    content,
  }).returning();
  
  // Get conversation history for context
  const history = await db.select()
    .from(schema.chatMessages)
    .where(eq(schema.chatMessages.projectId, projectId))
    .orderBy(schema.chatMessages.createdAt)
    .limit(20);
  
  // Call AI to generate response
  let aiResponse: string;
  
  try {
    if (c.env.OPENAI_API_KEY) {
      aiResponse = await callOpenAI(c.env.OPENAI_API_KEY, history, content, project);
    } else {
      // Fallback response when no API key is configured
      aiResponse = generateFallbackResponse(content, project);
    }
  } catch (error) {
    console.error("AI error:", error);
    aiResponse = "I apologize, but I encountered an error processing your request. Please try again.";
  }
  
  // Save assistant message
  const assistantMessage = await db.insert(schema.chatMessages).values({
    projectId,
    role: "assistant",
    content: aiResponse,
    metadata: JSON.stringify({
      model: c.env.OPENAI_API_KEY ? "gpt-4" : "fallback",
      timestamp: new Date().toISOString(),
    }),
  }).returning();
  
  // Update project status if needed
  if (project.status === "draft") {
    await db.update(schema.projects)
      .set({ status: "generating", updatedAt: new Date() })
      .where(eq(schema.projects.id, projectId));
  }
  
  return c.json({
    userMessage: userMessage[0],
    assistantMessage: assistantMessage[0],
  });
});

// Delete a message
chatRoutes.delete("/:projectId/messages/:messageId", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  
  const db = c.get("db");
  const projectId = parseInt(c.req.param("projectId"));
  const messageId = parseInt(c.req.param("messageId"));
  
  // Verify project ownership
  const project = await db.select()
    .from(schema.projects)
    .where(and(
      eq(schema.projects.id, projectId),
      eq(schema.projects.userId, user.id)
    ))
    .get();
  
  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }
  
  await db.delete(schema.chatMessages)
    .where(and(
      eq(schema.chatMessages.id, messageId),
      eq(schema.chatMessages.projectId, projectId)
    ));
  
  return c.json({ success: true });
});

// Clear all messages
chatRoutes.delete("/:projectId/messages", async (c) => {
  const user = c.get("user");
  if (!user) return c.json({ error: "Unauthorized" }, 401);
  
  const db = c.get("db");
  const projectId = parseInt(c.req.param("projectId"));
  
  // Verify project ownership
  const project = await db.select()
    .from(schema.projects)
    .where(and(
      eq(schema.projects.id, projectId),
      eq(schema.projects.userId, user.id)
    ))
    .get();
  
  if (!project) {
    return c.json({ error: "Project not found" }, 404);
  }
  
  await db.delete(schema.chatMessages)
    .where(eq(schema.chatMessages.projectId, projectId));
  
  return c.json({ success: true });
});

// Helper function to call OpenAI
async function callOpenAI(
  apiKey: string, 
  history: schema.ChatMessage[], 
  userMessage: string,
  project: schema.Project
): Promise<string> {
  const systemPrompt = `You are ADELE, an AI-powered application builder assistant. You help users build full-stack applications by understanding their requirements and generating code.

Current Project: ${project.name}
Description: ${project.description || "No description provided"}
Type: ${project.type}
Tech Stack: ${project.techStack || "Not specified"}

Your capabilities:
1. Understand application requirements from natural language
2. Design database schemas
3. Generate frontend code (React, TypeScript)
4. Generate backend code (Python FastAPI, Node.js)
5. Implement authentication and security
6. Create deployment configurations
7. Generate documentation

When the user describes what they want to build:
1. Ask clarifying questions if needed
2. Break down the requirements into components
3. Suggest a tech stack if not specified
4. Generate code step by step
5. Explain your decisions

Be helpful, concise, and professional. Format code blocks with appropriate language tags.`;

  const messages = [
    { role: "system", content: systemPrompt },
    ...history.slice(-10).map(m => ({
      role: m.role as "user" | "assistant" | "system",
      content: m.content,
    })),
    { role: "user", content: userMessage },
  ];

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "Authorization": `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: "gpt-4-turbo-preview",
      messages,
      max_tokens: 4096,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    throw new Error(`OpenAI API error: ${response.status}`);
  }

  const data = await response.json() as any;
  return data.choices[0].message.content;
}

// Fallback response when no API key
function generateFallbackResponse(userMessage: string, project: schema.Project): string {
  const lowerMessage = userMessage.toLowerCase();
  
  if (lowerMessage.includes("hello") || lowerMessage.includes("hi")) {
    return `Hello! I'm ADELE, your AI application builder assistant. I'm here to help you build "${project.name}". 

To get started, please describe what kind of application you want to build. For example:
- What features should it have?
- Who are the target users?
- What's the main purpose?

**Note:** For full AI capabilities, please configure your OpenAI API key in the admin settings.`;
  }
  
  if (lowerMessage.includes("help")) {
    return `I can help you with:

1. **Planning** - Define your application's features and architecture
2. **Database Design** - Create schemas for your data models
3. **Frontend** - Generate React/TypeScript UI components
4. **Backend** - Build APIs with FastAPI or Node.js
5. **Security** - Implement authentication and authorization
6. **Deployment** - Create Docker and cloud deployment configs

What would you like to work on first?

**Note:** Configure your OpenAI API key in admin settings for full AI-powered code generation.`;
  }
  
  return `I understand you want to work on: "${userMessage}"

To provide the best assistance, I need the OpenAI API key to be configured. Please ask your administrator to:

1. Go to **Admin Settings** → **API Keys**
2. Add your OpenAI API key
3. Save the configuration

Once configured, I'll be able to:
- Generate complete code for your requirements
- Design database schemas
- Create API endpoints
- Build UI components
- And much more!

In the meantime, you can:
- Describe your application requirements in detail
- I'll save your messages for when AI is enabled`;
}
