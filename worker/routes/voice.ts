import { Hono } from "hono";
import { eq, and, desc } from "drizzle-orm";
import * as schema from "../../drizzle/schema";
import { authMiddleware } from "../middleware/auth";
import { Env, Variables } from "../index";

const voice = new Hono<{ Bindings: Env; Variables: Variables }>();

// Apply auth middleware to all routes
voice.use("*", authMiddleware);

// Start voice session
voice.post("/session", async (c) => {
  const user = c.get("user");
  const db = c.get("db");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Generate session ID
  const sessionId = `voice-${user.id}-${Date.now()}-${Math.random().toString(36).substring(7)}`;

  // Create session record
  const [session] = await db
    .insert(schema.voiceSessions)
    .values({
      userId: user.id,
      sessionId,
      status: "active",
    })
    .returning();

  // In production, this would return a WebSocket URL for real-time audio streaming
  const wsUrl = `wss://voice.adele.ayonix.com/ws/${sessionId}`;

  return c.json({ sessionId, wsUrl });
});

// End voice session
voice.delete("/session/:sessionId", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const sessionId = c.req.param("sessionId");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  await db
    .update(schema.voiceSessions)
    .set({
      status: "ended",
      endedAt: new Date(),
    })
    .where(
      and(
        eq(schema.voiceSessions.sessionId, sessionId),
        eq(schema.voiceSessions.userId, user.id)
      )
    );

  return c.json({ success: true });
});

// Get voice settings
voice.get("/settings", async (c) => {
  const user = c.get("user");
  const db = c.get("db");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const settings = await db.query.voiceSettings.findFirst({
    where: eq(schema.voiceSettings.userId, user.id),
  });

  if (!settings) {
    // Return defaults
    return c.json({
      settings: {
        language: "en-US",
        voiceId: "alloy",
        speed: 1.0,
        pitch: 1.0,
        volume: 1.0,
        autoDetectLanguage: true,
        noiseReduction: true,
        echoCancellation: true,
        wakeWord: false,
        wakeWordPhrase: "Hey ADELE",
      },
    });
  }

  return c.json({ settings });
});

// Update voice settings
voice.patch("/settings", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const body = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const existing = await db.query.voiceSettings.findFirst({
    where: eq(schema.voiceSettings.userId, user.id),
  });

  if (existing) {
    await db
      .update(schema.voiceSettings)
      .set({
        language: body.language ?? existing.language,
        voiceId: body.voiceId ?? existing.voiceId,
        speed: body.speed ?? existing.speed,
        pitch: body.pitch ?? existing.pitch,
        volume: body.volume ?? existing.volume,
        autoDetectLanguage: body.autoDetectLanguage ?? existing.autoDetectLanguage,
        noiseReduction: body.noiseReduction ?? existing.noiseReduction,
        echoCancellation: body.echoCancellation ?? existing.echoCancellation,
        wakeWord: body.wakeWord ?? existing.wakeWord,
        wakeWordPhrase: body.wakeWordPhrase ?? existing.wakeWordPhrase,
        updatedAt: new Date(),
      })
      .where(eq(schema.voiceSettings.userId, user.id));
  } else {
    await db.insert(schema.voiceSettings).values({
      userId: user.id,
      language: body.language || "en-US",
      voiceId: body.voiceId || "alloy",
      speed: body.speed || 1.0,
      pitch: body.pitch || 1.0,
      volume: body.volume || 1.0,
      autoDetectLanguage: body.autoDetectLanguage ?? true,
      noiseReduction: body.noiseReduction ?? true,
      echoCancellation: body.echoCancellation ?? true,
      wakeWord: body.wakeWord ?? false,
      wakeWordPhrase: body.wakeWordPhrase || "Hey ADELE",
    });
  }

  return c.json({ success: true });
});

// Get available voices
voice.get("/voices", async (c) => {
  // Return available TTS voices
  const voices = [
    { id: "alloy", name: "Alloy", language: "en-US", gender: "neutral", style: "natural" },
    { id: "echo", name: "Echo", language: "en-US", gender: "male", style: "natural" },
    { id: "fable", name: "Fable", language: "en-GB", gender: "male", style: "expressive" },
    { id: "onyx", name: "Onyx", language: "en-US", gender: "male", style: "deep" },
    { id: "nova", name: "Nova", language: "en-US", gender: "female", style: "warm" },
    { id: "shimmer", name: "Shimmer", language: "en-US", gender: "female", style: "bright" },
    // Additional languages
    { id: "aria", name: "Aria", language: "es-ES", gender: "female", style: "natural" },
    { id: "hans", name: "Hans", language: "de-DE", gender: "male", style: "natural" },
    { id: "sakura", name: "Sakura", language: "ja-JP", gender: "female", style: "natural" },
    { id: "pierre", name: "Pierre", language: "fr-FR", gender: "male", style: "natural" },
  ];

  return c.json({ voices });
});

// Transcribe audio
voice.post("/transcribe", async (c) => {
  const user = c.get("user");
  const env = c.env;

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const formData = await c.req.formData();
  const audio = formData.get("audio") as File;

  if (!audio) {
    return c.json({ error: "No audio provided" }, 400);
  }

  // Check if OpenAI is configured
  if (!env.OPENAI_API_KEY) {
    return c.json({ error: "Speech-to-text not configured" }, 500);
  }

  try {
    // Call OpenAI Whisper API
    const audioBuffer = await audio.arrayBuffer();
    const audioBlob = new Blob([audioBuffer], { type: audio.type });

    const formDataForApi = new FormData();
    formDataForApi.append("file", audioBlob, "audio.webm");
    formDataForApi.append("model", "whisper-1");
    formDataForApi.append("response_format", "json");

    const response = await fetch("https://api.openai.com/v1/audio/transcriptions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
      },
      body: formDataForApi,
    });

    if (!response.ok) {
      throw new Error("Transcription failed");
    }

    const result = await response.json() as { text: string };
    return c.json({ text: result.text });
  } catch (error: any) {
    console.error("Transcription error:", error);
    return c.json({ error: "Transcription failed" }, 500);
  }
});

// Synthesize speech
voice.post("/synthesize", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const env = c.env;
  const { text, voiceId } = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  if (!text) {
    return c.json({ error: "No text provided" }, 400);
  }

  if (!env.OPENAI_API_KEY) {
    return c.json({ error: "Text-to-speech not configured" }, 500);
  }

  try {
    // Get user's voice settings
    const settings = await db.query.voiceSettings.findFirst({
      where: eq(schema.voiceSettings.userId, user.id),
    });

    const voice = voiceId || settings?.voiceId || "alloy";
    const speed = settings?.speed || 1.0;

    // Call OpenAI TTS API
    const response = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        input: text,
        voice,
        speed,
        response_format: "mp3",
      }),
    });

    if (!response.ok) {
      throw new Error("Speech synthesis failed");
    }

    // Store audio in R2 and return URL
    const audioBuffer = await response.arrayBuffer();
    const key = `voice/${user.id}/${Date.now()}.mp3`;

    await env.STORAGE.put(key, audioBuffer, {
      httpMetadata: { contentType: "audio/mpeg" },
    });

    const audioUrl = `https://storage.adele.ayonix.com/${key}`;
    return c.json({ audioUrl });
  } catch (error: any) {
    console.error("Speech synthesis error:", error);
    return c.json({ error: "Speech synthesis failed" }, 500);
  }
});

// Get conversation history
voice.get("/history", async (c) => {
  const user = c.get("user");
  const db = c.get("db");

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  const sessions = await db.query.voiceSessions.findMany({
    where: eq(schema.voiceSessions.userId, user.id),
    orderBy: desc(schema.voiceSessions.createdAt),
    limit: 50,
  });

  // Get message counts for each session
  const conversations = await Promise.all(
    sessions.map(async (session) => {
      const messages = await db.query.voiceMessages.findMany({
        where: eq(schema.voiceMessages.sessionId, session.id),
      });

      return {
        id: session.id,
        startedAt: session.createdAt?.toISOString(),
        endedAt: session.endedAt?.toISOString(),
        messageCount: messages.length,
        summary: session.summary,
      };
    })
  );

  return c.json({ conversations });
});

// Process voice message (for async processing)
voice.post("/process", async (c) => {
  const user = c.get("user");
  const db = c.get("db");
  const env = c.env;
  const { sessionId, text } = await c.req.json();

  if (!user) {
    return c.json({ error: "Unauthorized" }, 401);
  }

  // Get session
  const session = await db.query.voiceSessions.findFirst({
    where: and(
      eq(schema.voiceSessions.sessionId, sessionId),
      eq(schema.voiceSessions.userId, user.id)
    ),
  });

  if (!session) {
    return c.json({ error: "Session not found" }, 404);
  }

  // Store user message
  await db.insert(schema.voiceMessages).values({
    sessionId: session.id,
    role: "user",
    content: text,
  });

  // Get conversation history
  const history = await db.query.voiceMessages.findMany({
    where: eq(schema.voiceMessages.sessionId, session.id),
    orderBy: schema.voiceMessages.createdAt,
  });

  // Call LLM for response
  if (!env.OPENAI_API_KEY) {
    return c.json({ error: "AI not configured" }, 500);
  }

  try {
    const messages = [
      {
        role: "system",
        content: `You are ADELE, an AI assistant. You're having a voice conversation with the user. 
Keep responses concise and conversational since they will be spoken aloud.
Be helpful, friendly, and natural in your responses.`,
      },
      ...history.map((m) => ({
        role: m.role as "user" | "assistant",
        content: m.content || "",
      })),
    ];

    const response = await fetch("https://api.openai.com/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "gpt-4-turbo-preview",
        messages,
        max_tokens: 500,
        temperature: 0.7,
      }),
    });

    if (!response.ok) {
      throw new Error("AI response failed");
    }

    const result = await response.json() as { choices: { message: { content: string } }[] };
    const assistantResponse = result.choices[0]?.message?.content || "I'm sorry, I couldn't process that.";

    // Store assistant message
    await db.insert(schema.voiceMessages).values({
      sessionId: session.id,
      role: "assistant",
      content: assistantResponse,
    });

    // Synthesize speech
    const ttsResponse = await fetch("https://api.openai.com/v1/audio/speech", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${env.OPENAI_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "tts-1",
        input: assistantResponse,
        voice: "alloy",
        response_format: "mp3",
      }),
    });

    if (!ttsResponse.ok) {
      return c.json({ text: assistantResponse, audioUrl: null });
    }

    const audioBuffer = await ttsResponse.arrayBuffer();
    const key = `voice/${user.id}/${Date.now()}.mp3`;

    await env.STORAGE.put(key, audioBuffer, {
      httpMetadata: { contentType: "audio/mpeg" },
    });

    const audioUrl = `https://storage.adele.ayonix.com/${key}`;
    return c.json({ text: assistantResponse, audioUrl });
  } catch (error: any) {
    console.error("Voice processing error:", error);
    return c.json({ error: "Processing failed" }, 500);
  }
});

export { voice as voiceRoutes };
