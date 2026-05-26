// ─────────────────────────────────────────────────────────────────────────────
//  SWAPPIT — AI Provider Configuration
//  Change ACTIVE_PROVIDER to switch between services.
//  Only the active provider's API key is used at runtime.
// ─────────────────────────────────────────────────────────────────────────────

export const ACTIVE_PROVIDER = 'gemini' // 'claude' | 'openai' | 'gemini' | 'mistral' | 'openrouter'

export const AI_PROVIDERS = {

  // ── Anthropic Claude (paid, best quality) ────────────────────────────────
  claude: {
    name: 'Claude (Anthropic)',
    model: 'claude-sonnet-4-20250514',
    endpoint: 'https://api.anthropic.com/v1/messages',
    apiKey: import.meta.env.VITE_CLAUDE_API_KEY || '',
    free: false,
    buildRequest: (systemPrompt, messages, maxTokens = 800) => ({
      url: 'https://api.anthropic.com/v1/messages',
      headers: { 'Content-Type': 'application/json' },
      body: {
        model: 'claude-sonnet-4-20250514',
        max_tokens: maxTokens,
        system: systemPrompt,
        messages,
      },
      extractText: (data) => data.content?.[0]?.text || '',
    }),
  },

  // ── OpenAI GPT (paid, widely available) ──────────────────────────────────
  openai: {
    name: 'GPT-4o Mini (OpenAI)',
    model: 'gpt-4o-mini',
    free: false,
    buildRequest: (systemPrompt, messages, maxTokens = 800) => ({
      url: 'https://api.openai.com/v1/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_OPENAI_API_KEY || ''}`,
      },
      body: {
        model: 'gpt-4o-mini',
        max_tokens: maxTokens,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
      },
      extractText: (data) => data.choices?.[0]?.message?.content || '',
    }),
  },

  // ── Google Gemini (FREE tier available — recommended for now) ─────────────
  gemini: {
    name: 'Gemini 1.5 Flash (Google — Free)',
    model: 'gemini-1.5-flash',
    free: true,
    note: 'Get a free API key at https://aistudio.google.com/app/apikey',
    buildRequest: (systemPrompt, messages, maxTokens = 800) => {
      const apiKey = import.meta.env.VITE_GEMINI_API_KEY || ''
      // Convert messages to Gemini format
      const contents = messages.map(m => ({
        role: m.role === 'assistant' ? 'model' : 'user',
        parts: [{ text: m.content }],
      }))
      return {
        url: `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash:generateContent?key=${apiKey}`,
        headers: { 'Content-Type': 'application/json' },
        body: {
          system_instruction: { parts: [{ text: systemPrompt }] },
          contents,
          generationConfig: { maxOutputTokens: maxTokens },
        },
        extractText: (data) => data.candidates?.[0]?.content?.parts?.[0]?.text || '',
      }
    },
  },

  // ── Mistral (FREE tier available) ────────────────────────────────────────
  mistral: {
    name: 'Mistral 7B (Mistral — Free tier)',
    model: 'open-mistral-7b',
    free: true,
    note: 'Get a free API key at https://console.mistral.ai',
    buildRequest: (systemPrompt, messages, maxTokens = 800) => ({
      url: 'https://api.mistral.ai/v1/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_MISTRAL_API_KEY || ''}`,
      },
      body: {
        model: 'open-mistral-7b',
        max_tokens: maxTokens,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
      },
      extractText: (data) => data.choices?.[0]?.message?.content || '',
    }),
  },

  // ── OpenRouter (aggregator — many free models) ────────────────────────────
  openrouter: {
    name: 'OpenRouter (Free models available)',
    model: 'meta-llama/llama-3-8b-instruct:free',
    free: true,
    note: 'Get a free key at https://openrouter.ai — many free models available',
    buildRequest: (systemPrompt, messages, maxTokens = 800) => ({
      url: 'https://openrouter.ai/api/v1/chat/completions',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${import.meta.env.VITE_OPENROUTER_API_KEY || ''}`,
        'HTTP-Referer': 'https://swappit.cm',
        'X-Title': 'Swappit',
      },
      body: {
        model: 'meta-llama/llama-3-8b-instruct:free',
        max_tokens: maxTokens,
        messages: [{ role: 'system', content: systemPrompt }, ...messages],
      },
      extractText: (data) => data.choices?.[0]?.message?.content || '',
    }),
  },
}

// ─────────────────────────────────────────────────────────────────────────────
//  Universal AI call — uses whichever provider is active
// ─────────────────────────────────────────────────────────────────────────────
export async function callAI(systemPrompt, messages, maxTokens = 800) {
  const provider = AI_PROVIDERS[ACTIVE_PROVIDER]
  if (!provider) throw new Error(`Unknown AI provider: ${ACTIVE_PROVIDER}`)

  const { url, headers, body, extractText } = provider.buildRequest(systemPrompt, messages, maxTokens)

  const response = await fetch(url, {
    method: 'POST',
    headers,
    body: JSON.stringify(body),
  })

  if (!response.ok) {
    const err = await response.text()
    throw new Error(`AI API error (${response.status}): ${err}`)
  }

  const data = await response.json()
  return extractText(data)
}

// ─────────────────────────────────────────────────────────────────────────────
//  Mapbox config — get a free token at https://account.mapbox.com
//  Free tier: 50,000 map loads/month
// ─────────────────────────────────────────────────────────────────────────────
export const MAPBOX_TOKEN = import.meta.env.VITE_MAPBOX_TOKEN || ''

// Default map center: Yaoundé, Cameroon
export const DEFAULT_MAP_CENTER = [11.5021, 3.8480]
