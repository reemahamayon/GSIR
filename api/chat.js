function buildSystemPrompt() {
  const today = new Date().toISOString().slice(0, 10)

  return `You are the GSIR Analyst, an AI assistant for the Global Society of International Relations website. You help people understand international relations, world history, wars and conflicts, diplomacy, international law, geopolitics, and the global economy.

Today's date is ${today}.

Write like a friendly, knowledgeable teacher explaining to a smart student who is new to the topic.

Format rules (very important):
- Use simple, everyday words. If you must use a technical term, explain it in a few words.
- Start with a direct answer in 1 or 2 sentences.
- Then give at most 5 short points. Use a numbered list for steps and a bulleted list for everything else. Each point is one idea in 1 or 2 sentences.
- If the user asks for step by step, give a maximum of 5 numbered steps, one short sentence each.
- Never use tables, emojis, horizontal lines, # headings, links, or long checklists.
- You may use **bold** for a few key words only.
- Keep the whole answer under 200 words unless the user asks for more detail.
- End with one short follow-up question or offer, such as "Want me to explain the history behind this?"

Content rules:
- For questions about current or recent events, use web search to get up-to-date facts. Mention the date or time period of what you found, and name the news source in plain words (for example "according to Reuters") for the most important facts.
- For history and conflicts, present multiple perspectives fairly and separate established facts from contested claims.
- For "what if" and future-scenario questions, explain the likely impact on specific countries and regions (economic, political, security, humanitarian) as a simple chain of cause and effect, and make clear these are scenarios, not predictions.
- Be honest about uncertainty. If you could not confirm something, say so.
- Stay respectful and neutral on contested political questions. Do not take sides; lay out the main positions instead.
- If a question is unrelated to international relations, history, politics, or economics, politely steer the conversation back.`
}

// Free Groq models.
// Search-enabled model is used first for questions about recent events.
const SEARCH_MODEL = 'groq/compound'
const CHAT_MODELS = ['openai/gpt-oss-120b', 'openai/gpt-oss-20b']

// Words that suggest the question needs fresh, live information
const CURRENT_WORDS =
  /\b(current|currently|latest|recent|recently|today|tonight|yesterday|this week|this month|this year|right now|now|news|update|updates|happening|ongoing|breaking|2025|2026)\b/i

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed.' })
  }

  // 1. Only logged-in users may use the chatbot
  const idToken = (req.headers.authorization || '').replace('Bearer ', '')
  if (!idToken) {
    return res.status(401).json({ error: 'Please log in to use the chatbot.' })
  }

  try {
    const verify = await fetch(
      `https://identitytoolkit.googleapis.com/v1/accounts:lookup?key=${process.env.FIREBASE_API_KEY}`,
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken }),
      }
    )
    if (!verify.ok) {
      return res.status(401).json({ error: 'Your session is invalid. Please log in again.' })
    }
  } catch {
    return res.status(500).json({ error: 'Could not verify your login.' })
  }

  // 2. Validate and trim the conversation
  const { messages } = req.body || {}
  if (!Array.isArray(messages) || messages.length === 0) {
    return res.status(400).json({ error: 'No messages provided.' })
  }

  const trimmed = messages.slice(-10).map((m) => ({
    role: m.role === 'assistant' ? 'assistant' : 'user',
    content: String(m.content || '').slice(0, 2000),
  }))

  // 3. Decide which models to try
  const lastUserMessage = [...trimmed].reverse().find((m) => m.role === 'user')?.content || ''
  const needsLiveInfo = CURRENT_WORDS.test(lastUserMessage)
  const modelsToTry = needsLiveInfo ? [SEARCH_MODEL, ...CHAT_MODELS] : CHAT_MODELS

  // 4. Call Groq, trying each model in order
  let lastError = 'The AI service returned an error.'

  for (const model of modelsToTry) {
    try {
      const body = {
        model,
        messages: [{ role: 'system', content: buildSystemPrompt() }, ...trimmed],
        max_tokens: 2000,
      }

      // Only the gpt-oss models support this setting
      if (model.startsWith('openai/gpt-oss')) {
        body.reasoning_effort = 'low'
      }

      const response = await fetch('https://api.groq.com/openai/v1/chat/completions', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${process.env.GROQ_API_KEY}`,
        },
        body: JSON.stringify(body),
      })

      const data = await response.json()

      if (response.ok) {
        const reply = data.choices?.[0]?.message?.content
        if (reply) {
          return res.status(200).json({ reply })
        }
        lastError = 'The AI returned an empty answer.'
        continue
      }

      lastError = data?.error?.message || lastError
      console.error(`Groq error with ${model}:`, lastError)
    } catch (err) {
      lastError = 'Could not reach the AI service.'
      console.error(`Groq request failed with ${model}:`, err)
    }
  }

  return res.status(500).json({ error: lastError })
}