// ─────────────────────────────────────────────────────────────────────────────
//  SWAPPIT — Smart Swap Engine v1.0
//  A fully deterministic algorithm replacing all AI API calls.
//  No internet connection, no API key, no cost. Runs entirely in the browser.
//
//  Features:
//    1. estimateValue()        — FCFA value estimation for any item
//    2. analyseFairness()      — rate any swap as Balanced/Acceptable/Unfair
//    3. findMatches()          — scored matching algorithm for smart suggestions
//    4. swapChat()             — intent-based chat responder
//    5. calculateTrustScore()  — composite user reliability score
// ─────────────────────────────────────────────────────────────────────────────


// ── 1. MARKET PRICE DATABASE ──────────────────────────────────────────────────
// Base prices in FCFA for common items in the Cameroonian second-hand market.
// Each entry: { base, min, max, decay (annual depreciation rate) }
const PRICE_DB = {
  // ── Phones ──
  iphone:        { base: 250000, min: 80000,  max: 600000, decay: 0.20 },
  samsung:       { base: 180000, min: 50000,  max: 500000, decay: 0.22 },
  tecno:         { base: 60000,  min: 20000,  max: 150000, decay: 0.25 },
  itel:          { base: 35000,  min: 10000,  max: 80000,  decay: 0.28 },
  infinix:       { base: 75000,  min: 25000,  max: 200000, decay: 0.24 },
  oppo:          { base: 90000,  min: 30000,  max: 250000, decay: 0.23 },
  xiaomi:        { base: 80000,  min: 25000,  max: 220000, decay: 0.23 },
  phone:         { base: 80000,  min: 15000,  max: 400000, decay: 0.22 },
  smartphone:    { base: 90000,  min: 20000,  max: 400000, decay: 0.22 },

  // ── Computers ──
  laptop:        { base: 250000, min: 80000,  max: 600000, decay: 0.18 },
  macbook:       { base: 400000, min: 150000, max: 900000, decay: 0.15 },
  dell:          { base: 220000, min: 70000,  max: 500000, decay: 0.18 },
  hp:            { base: 200000, min: 60000,  max: 450000, decay: 0.18 },
  lenovo:        { base: 210000, min: 65000,  max: 480000, decay: 0.18 },

  // ── Tablets ──
  tablet:        { base: 120000, min: 40000,  max: 300000, decay: 0.20 },
  ipad:          { base: 200000, min: 80000,  max: 500000, decay: 0.18 },

  // ── Audio ──
  headphones:    { base: 45000,  min: 5000,   max: 200000, decay: 0.15 },
  airpods:       { base: 80000,  min: 30000,  max: 180000, decay: 0.18 },
  earphones:     { base: 15000,  min: 2000,   max: 80000,  decay: 0.20 },
  speaker:       { base: 40000,  min: 8000,   max: 150000, decay: 0.15 },

  // ── Cameras ──
  camera:        { base: 180000, min: 50000,  max: 500000, decay: 0.12 },
  canon:         { base: 200000, min: 60000,  max: 550000, decay: 0.12 },
  nikon:         { base: 190000, min: 55000,  max: 520000, decay: 0.12 },
  gopro:         { base: 100000, min: 30000,  max: 280000, decay: 0.15 },

  // ── TV & Entertainment ──
  television:    { base: 150000, min: 40000,  max: 400000, decay: 0.15 },
  tv:            { base: 150000, min: 40000,  max: 400000, decay: 0.15 },
  console:       { base: 120000, min: 40000,  max: 300000, decay: 0.15 },
  playstation:   { base: 150000, min: 60000,  max: 350000, decay: 0.15 },
  xbox:          { base: 130000, min: 50000,  max: 300000, decay: 0.15 },

  // ── Watches ──
  watch:         { base: 30000,  min: 5000,   max: 200000, decay: 0.10 },
  smartwatch:    { base: 80000,  min: 20000,  max: 250000, decay: 0.20 },
  casio:         { base: 25000,  min: 8000,   max: 80000,  decay: 0.08 },

  // ── Clothing & Shoes ──
  nike:          { base: 55000,  min: 15000,  max: 150000, decay: 0.20 },
  adidas:        { base: 45000,  min: 12000,  max: 120000, decay: 0.20 },
  jordan:        { base: 80000,  min: 30000,  max: 200000, decay: 0.18 },
  puma:          { base: 35000,  min: 10000,  max: 100000, decay: 0.22 },
  sneakers:      { base: 40000,  min: 8000,   max: 150000, decay: 0.22 },
  shoes:         { base: 25000,  min: 5000,   max: 100000, decay: 0.25 },
  boots:         { base: 30000,  min: 8000,   max: 100000, decay: 0.22 },
  jacket:        { base: 30000,  min: 8000,   max: 100000, decay: 0.20 },
  bag:           { base: 25000,  min: 5000,   max: 150000, decay: 0.18 },
  handbag:       { base: 35000,  min: 8000,   max: 200000, decay: 0.18 },
  backpack:      { base: 20000,  min: 5000,   max: 80000,  decay: 0.20 },
  dress:         { base: 20000,  min: 5000,   max: 80000,  decay: 0.25 },
  jeans:         { base: 18000,  min: 4000,   max: 60000,  decay: 0.25 },
  shirt:         { base: 10000,  min: 2000,   max: 40000,  decay: 0.30 },
  suit:          { base: 60000,  min: 15000,  max: 200000, decay: 0.15 },

  // ── Furniture ──
  chair:         { base: 45000,  min: 10000,  max: 150000, decay: 0.12 },
  table:         { base: 60000,  min: 15000,  max: 200000, decay: 0.10 },
  sofa:          { base: 150000, min: 40000,  max: 500000, decay: 0.10 },
  bed:           { base: 120000, min: 30000,  max: 400000, decay: 0.10 },
  wardrobe:      { base: 100000, min: 25000,  max: 350000, decay: 0.08 },
  desk:          { base: 55000,  min: 15000,  max: 180000, decay: 0.10 },
  mattress:      { base: 80000,  min: 20000,  max: 250000, decay: 0.15 },
  shelf:         { base: 30000,  min: 8000,   max: 100000, decay: 0.10 },

  // ── Books ──
  book:          { base: 5000,   min: 500,    max: 25000,  decay: 0.08 },
  books:         { base: 20000,  min: 2000,   max: 80000,  decay: 0.08 },
  textbook:      { base: 8000,   min: 1000,   max: 35000,  decay: 0.10 },
  novel:         { base: 3500,   min: 500,    max: 15000,  decay: 0.05 },
  manga:         { base: 4000,   min: 500,    max: 20000,  decay: 0.05 },

  // ── Music & Instruments ──
  guitar:        { base: 60000,  min: 15000,  max: 200000, decay: 0.08 },
  piano:         { base: 300000, min: 80000,  max: 800000, decay: 0.06 },
  keyboard:      { base: 80000,  min: 20000,  max: 250000, decay: 0.10 },
  drums:         { base: 120000, min: 30000,  max: 400000, decay: 0.08 },
  microphone:    { base: 35000,  min: 8000,   max: 150000, decay: 0.12 },
  amplifier:     { base: 60000,  min: 15000,  max: 200000, decay: 0.10 },

  // ── Sports ──
  bicycle:       { base: 80000,  min: 20000,  max: 300000, decay: 0.12 },
  bike:          { base: 80000,  min: 20000,  max: 300000, decay: 0.12 },
  treadmill:     { base: 120000, min: 30000,  max: 400000, decay: 0.15 },
  weights:       { base: 30000,  min: 8000,   max: 100000, decay: 0.08 },
  dumbbell:      { base: 15000,  min: 4000,   max: 60000,  decay: 0.08 },
  jersey:        { base: 20000,  min: 5000,   max: 80000,  decay: 0.20 },

  // ── Appliances ──
  refrigerator:  { base: 200000, min: 60000,  max: 600000, decay: 0.10 },
  fridge:        { base: 200000, min: 60000,  max: 600000, decay: 0.10 },
  microwave:     { base: 60000,  min: 15000,  max: 180000, decay: 0.12 },
  blender:       { base: 25000,  min: 6000,   max: 80000,  decay: 0.15 },
  iron:          { base: 15000,  min: 4000,   max: 45000,  decay: 0.15 },
  fan:           { base: 20000,  min: 5000,   max: 60000,  decay: 0.12 },
  printer:       { base: 80000,  min: 20000,  max: 200000, decay: 0.18 },
}

// Category fallbacks when no keyword matches
const CATEGORY_BASE = {
  Electronics: { base: 80000,  min: 10000,  max: 400000, decay: 0.20 },
  Clothing:    { base: 20000,  min: 3000,   max: 100000, decay: 0.25 },
  Furniture:   { base: 70000,  min: 15000,  max: 350000, decay: 0.10 },
  Books:       { base: 8000,   min: 500,    max: 40000,  decay: 0.08 },
  Music:       { base: 60000,  min: 10000,  max: 300000, decay: 0.10 },
  Sports:      { base: 45000,  min: 8000,   max: 200000, decay: 0.12 },
  Other:       { base: 30000,  min: 2000,   max: 150000, decay: 0.15 },
}

// How much value is retained per condition
const CONDITION_FACTOR = {
  Excellent: 0.88,
  Good:      0.62,
  Fair:      0.38,
}


// ─────────────────────────────────────────────────────────────────────────────
//  ALGORITHM 1: VALUE ESTIMATOR
//  Steps:
//    1. Tokenize name + description into lowercase words
//    2. Score each PRICE_DB keyword against the tokens
//       — exact match → keyword.length points
//       — partial match → keyword.length * 0.6 points
//    3. Use the highest-scoring keyword's price range
//    4. Multiply by condition factor
//    5. Detect quantity multipliers (e.g. "×12 books")
//    6. Round to nearest 500 FCFA
// ─────────────────────────────────────────────────────────────────────────────
export function estimateValue(name, description = '', category = 'Other', condition = 'Good') {
  const text   = `${name} ${description}`.toLowerCase()
  const tokens = text.split(/[\s,.()\-\/×x*:;!?]+/).filter(t => t.length > 1)

  let bestMatch = null
  let bestScore = 0

  for (const [keyword, data] of Object.entries(PRICE_DB)) {
    let score = 0
    for (const token of tokens) {
      if (token === keyword)             score += keyword.length * 1.0  // exact
      else if (token.includes(keyword))  score += keyword.length * 0.8  // token contains keyword
      else if (keyword.includes(token) && token.length >= 3)
                                         score += token.length   * 0.6  // keyword contains token
    }
    if (score > bestScore) { bestScore = score; bestMatch = { keyword, ...data } }
  }

  const source    = bestMatch || CATEGORY_BASE[category] || CATEGORY_BASE.Other
  const factor    = CONDITION_FACTOR[condition] || CONDITION_FACTOR.Good

  // Detect quantity: "×12", "x5", "set of 3", "lot of 8"
  const qtyMatch  = text.match(/(?:[×x\*]|set of|lot of|pack of|lot)\s*(\d{1,2})/i)
  const qty       = qtyMatch ? Math.min(parseInt(qtyMatch[1]), 30) : 1
  // Bulk discount — each additional item adds diminishing value
  const qtyFactor = qty > 1 ? 1 + (qty - 1) * 0.4 : 1

  const rawBase   = source.base  * factor * qtyFactor
  const rawMin    = source.min   * factor * (qty > 1 ? 0.8 : 1)
  const rawMax    = source.max   * factor * (qty > 1 ? qtyFactor * 1.1 : 1)

  // Round to nearest 500 FCFA
  const r = v => Math.round(Math.max(500, v) / 500) * 500
  const estimated = r(Math.min(rawMax, Math.max(rawMin, rawBase)))
  const min       = r(rawMin)
  const max       = r(rawMax)

  // Build human-readable reasoning
  const pct      = Math.round(factor * 100)
  const matchMsg = bestMatch
    ? `Identified as "${bestMatch.keyword}" from your item name.`
    : `No specific match found — used ${category} category baseline.`
  const qtyMsg   = qty > 1 ? ` Group of ${qty} detected.` : ''
  const condMsg  = `${condition} condition = ~${pct}% of market value.`
  const reasoning = `${matchMsg}${qtyMsg} ${condMsg} Values adjusted for the Cameroonian second-hand market.`

  const tips = {
    Excellent: 'Include the original box and accessories — this can push the value toward the higher end.',
    Good:      'Add clear photos from multiple angles to build buyer confidence.',
    Fair:      'Be transparent about defects in your description — honest listings convert faster.',
  }[condition]

  return {
    estimatedValue: estimated,
    range:          { min, max },
    suggestedCondition: condition,
    reasoning,
    tips,
    matchedKeyword: bestMatch?.keyword || null,
    confidence:     bestMatch ? 'high' : 'medium',
  }
}


// ─────────────────────────────────────────────────────────────────────────────
//  ALGORITHM 2: FAIRNESS ANALYSER
//  Steps:
//    1. Compute ratio = lower / higher  (always 0–1)
//    2. Compute absolute and percentage difference
//    3. Apply threshold tiers:
//         ≥ 0.92 → Balanced     (within 8%)
//         ≥ 0.75 → Acceptable   (within 25%)
//         ≥ 0.50 → Unbalanced   (within 50%)
//          < 0.50 → Unfair      (over 50%)
// ─────────────────────────────────────────────────────────────────────────────
export function analyseFairness(valueA, valueB) {
  if (!valueA || !valueB || valueA <= 0 || valueB <= 0) return null

  const higher = Math.max(valueA, valueB)
  const lower  = Math.min(valueA, valueB)
  const ratio  = lower / higher
  const diff   = higher - lower
  const pct    = Math.round((1 - ratio) * 100)

  if (ratio >= 0.92) return {
    label:       'Balanced',
    icon:        '⚖️',
    color:       'var(--green)',
    bg:          'var(--green-soft)',
    description: `Values differ by only ${pct}% — this is a fair, equal trade.`,
    advice:      'Great match! Both parties receive equivalent value.',
    diff, ratio, tier: 1,
  }

  if (ratio >= 0.75) return {
    label:       'Acceptable',
    icon:        '〜',
    color:       'var(--orange)',
    bg:          'var(--orange-soft)',
    description: `A ${pct}% gap (${diff.toLocaleString()} FCFA). Slightly uneven but workable.`,
    advice:      `The lower-value party could add ${diff.toLocaleString()} FCFA to fully balance the exchange.`,
    diff, ratio, tier: 2,
  }

  if (ratio >= 0.50) return {
    label:       'Unbalanced',
    icon:        '⚠️',
    color:       'var(--accent-2)',
    bg:          'rgba(255,107,53,0.1)',
    description: `A ${pct}% difference (${diff.toLocaleString()} FCFA). One party benefits significantly more.`,
    advice:      `Add ${diff.toLocaleString()} FCFA or an additional item to bring this into balance.`,
    diff, ratio, tier: 3,
  }

  return {
    label:       'Unfair',
    icon:        '🚫',
    color:       'var(--red)',
    bg:          'var(--red-soft)',
    description: `A ${pct}% gap (${diff.toLocaleString()} FCFA) — this heavily favours one side.`,
    advice:      'This swap is not recommended without a substantial complement.',
    diff, ratio, tier: 4,
  }
}


// ─────────────────────────────────────────────────────────────────────────────
//  ALGORITHM 3: SMART MATCHER
//  Scores every possible pair (myItem × theirItem) out of 100 points:
//
//    Value proximity   40 pts — closer values = higher score
//    Category affinity 20 pts — same or complementary category
//    Condition match   20 pts — similar condition levels
//    Owner trust       10 pts — highly-rated owners rank higher
//    Freshness         10 pts — recently posted items rank higher
//
//  Then sorts descending, deduplicates, and returns top N matches.
// ─────────────────────────────────────────────────────────────────────────────
const CATEGORY_AFFINITY = {
  Electronics: ['Electronics', 'Music'],
  Clothing:    ['Clothing', 'Sports'],
  Books:       ['Books', 'Other'],
  Furniture:   ['Furniture', 'Other'],
  Music:       ['Music', 'Electronics'],
  Sports:      ['Sports', 'Clothing'],
  Other:       ['Other', 'Books', 'Furniture'],
}
const CONDITION_RANK = { Excellent: 3, Good: 2, Fair: 1 }

export function findMatches(myItems, allItems, users = [], limit = 6) {
  if (!myItems?.length || !allItems?.length) return []

  const results = []

  for (const mine of myItems) {
    if (!mine.available) continue

    for (const theirs of allItems) {
      if (!theirs.available)              continue
      if (theirs.userId === mine.userId)  continue  // never match own items

      let score = 0

      // ── Value proximity (40 pts) ──────────────────────────────
      const vRatio = Math.min(mine.value, theirs.value) / Math.max(mine.value, theirs.value)
      if      (vRatio >= 0.92) score += 40
      else if (vRatio >= 0.80) score += 30
      else if (vRatio >= 0.65) score += 18
      else if (vRatio >= 0.50) score += 8
      else continue  // more than 50% apart — skip entirely

      // ── Category affinity (20 pts) ────────────────────────────
      if (mine.category === theirs.category)
        score += 20
      else if (CATEGORY_AFFINITY[mine.category]?.includes(theirs.category))
        score += 10

      // ── Condition compatibility (20 pts) ──────────────────────
      const condDiff = Math.abs(
        (CONDITION_RANK[mine.condition]   || 2) -
        (CONDITION_RANK[theirs.condition] || 2)
      )
      if      (condDiff === 0) score += 20
      else if (condDiff === 1) score += 10

      // ── Owner trust bonus (10 pts) ────────────────────────────
      const owner = users.find(u => u.id === theirs.userId)
      if      (owner?.stars >= 4.5) score += 10
      else if (owner?.stars >= 3.5) score += 5
      else if (owner?.stars >= 2.5) score += 2

      // ── Freshness bonus (10 pts) ──────────────────────────────
      const daysOld = (Date.now() - new Date(theirs.createdAt)) / 86400000
      if      (daysOld <= 3)  score += 10
      else if (daysOld <= 14) score += 6
      else if (daysOld <= 30) score += 3

      results.push({
        myItem:       mine,
        theirItem:    theirs,
        score,
        fairness:     analyseFairness(mine.value, theirs.value)?.label?.toLowerCase() || 'unknown',
        fairnessData: analyseFairness(mine.value, theirs.value),
        owner,
      })
    }
  }

  // Sort descending, deduplicate by theirItem.id, return top N
  const seen = new Set()
  return results
    .sort((a, b) => b.score - a.score)
    .filter(r => {
      if (seen.has(r.theirItem.id)) return false
      seen.add(r.theirItem.id)
      return true
    })
    .slice(0, limit)
}


// ─────────────────────────────────────────────────────────────────────────────
//  ALGORITHM 4: SWAP CHAT RESPONDER
//  Steps:
//    1. Classify message intent using regex patterns
//    2. Extract entities (numbers, item names, categories)
//    3. Query the live items/users data
//    4. Generate a structured natural-language response
// ─────────────────────────────────────────────────────────────────────────────
const INTENTS = {
  greeting:     /^(hi|hello|hey|salut|bonjour|bonsoir|yo|sup)\b/i,
  listAsk:      /(show|list|see|display|browse|what.*available|what.*there)/i,
  cheapAsk:     /(cheap|affordable|low|under|less than|below|moins de)/i,
  expensiveAsk: /(expensive|high value|premium|most valuable|top|highest)/i,
  matchAsk:     /(match|swap for|exchange for|trade for|what can i (get|swap)|find me)/i,
  valueAsk:     /(worth|value|price|cost|fcfa|how much|combien|estimate)/i,
  fairnessAsk:  /(fair|balanced|equal|worth it|good deal|equit)/i,
  categoryAsk:  /(electronic|phone|laptop|cloth|shoe|book|furniture|music|sport|camera)/i,
  howAsk:       /(how does|how do|how to|how.*work|explain|tell me about)/i,
  trustAsk:     /(trust|reliable|safe|legit|star|rating|review|best user|who is good)/i,
}

export function swapChat(userMessage, availableItems = [], myItems = [], users = []) {
  const msg    = userMessage.trim()
  const lower  = msg.toLowerCase()

  // Detect intent
  const intent = Object.entries(INTENTS).find(([, rx]) => rx.test(lower))?.[0] || 'general'

  // Extract a threshold number if present
  const numMatch  = lower.match(/(\d[\d\s,]*)/)
  const threshold = numMatch ? parseInt(numMatch[1].replace(/[\s,]/g, '')) : null

  switch (intent) {

    case 'greeting':
      return {
        text: `Hello! 👋 I'm the Swappit assistant — powered by a smart local algorithm, no internet needed!\n\nI can help you:\n• 🔍 Find swap matches for your items\n• 💰 Estimate the value of any item\n• ⚖️ Check if a swap is fair\n• 📋 Browse available items\n• ⭐ Understand the trust system`,
        suggestions: ['Show me available items', 'Find matches for my items', 'How does swapping work?'],
      }

    case 'listAsk': {
      const list = availableItems.slice(0, 6)
      if (!list.length) return { text: 'No items available yet. Be the first to post something in My Space!', suggestions: [] }
      const lines = list.map(i => `• ${i.emoji || '📦'} **${i.name}** — ${i.value?.toLocaleString()} FCFA (${i.condition})`).join('\n')
      return {
        text: `${availableItems.length} items available. Here are the latest:\n\n${lines}\n\nOpen Explorer to see them all and filter by category!`,
        suggestions: ['Show me electronics', 'Find matches for my items', 'Show items under 50,000 FCFA'],
      }
    }

    case 'cheapAsk': {
      const limit = threshold && threshold > 1000 ? threshold : 50000
      const cheap = availableItems.filter(i => i.value <= limit).sort((a, b) => a.value - b.value).slice(0, 5)
      if (!cheap.length) return { text: `No items found under ${limit.toLocaleString()} FCFA right now. Check back soon!`, suggestions: ['Show me all items'] }
      const lines = cheap.map(i => `• ${i.emoji || '📦'} ${i.name} — ${i.value?.toLocaleString()} FCFA`).join('\n')
      return { text: `Items under ${limit.toLocaleString()} FCFA:\n\n${lines}`, suggestions: [] }
    }

    case 'expensiveAsk': {
      const top = [...availableItems].sort((a, b) => b.value - a.value).slice(0, 5)
      if (!top.length) return { text: 'No items available yet.', suggestions: [] }
      const lines = top.map(i => `• ${i.emoji || '📦'} ${i.name} — ${i.value?.toLocaleString()} FCFA`).join('\n')
      return { text: `Highest-value items:\n\n${lines}`, suggestions: [] }
    }

    case 'categoryAsk': {
      const catMap = {
        electronic: 'Electronics', phone: 'Electronics', laptop: 'Electronics',
        camera: 'Electronics', cloth: 'Clothing', shoe: 'Clothing',
        book: 'Books', furniture: 'Furniture', music: 'Music', sport: 'Sports',
      }
      const matchedCat = Object.entries(catMap).find(([k]) => lower.includes(k))?.[1] || 'Other'
      const items      = availableItems.filter(i => i.category === matchedCat).slice(0, 6)
      if (!items.length) return { text: `No ${matchedCat} items available right now.`, suggestions: ['Show me all items'] }
      const lines = items.map(i => `• ${i.emoji || '📦'} ${i.name} — ${i.value?.toLocaleString()} FCFA (${i.condition})`).join('\n')
      return { text: `${matchedCat} items available:\n\n${lines}`, suggestions: [] }
    }

    case 'matchAsk': {
      if (!myItems?.length) return {
        text: "You haven't posted any items yet! Go to **My Space → My Items → Add Item** to post your first item. Then I can find the best swap matches for you.",
        suggestions: [],
      }
      const matches = findMatches(myItems, availableItems, users, 4)
      if (!matches.length) return {
        text: "No close value matches found right now. Try posting more items, or check back as new listings come in!",
        suggestions: ['Show me all available items'],
      }
      const lines = matches.map(m =>
        `• Your **${m.myItem.name}** (${m.myItem.value?.toLocaleString()} FCFA)\n  ⇄ **${m.theirItem.name}** (${m.theirItem.value?.toLocaleString()} FCFA) — ${m.fairnessData?.icon || ''} ${m.fairnessData?.label || ''}`
      ).join('\n\n')
      return {
        text: `Your best swap matches right now:\n\n${lines}\n\n💡 Click **"Smart Suggestions"** in Explorer to propose these directly!`,
        suggestions: [],
      }
    }

    case 'valueAsk': {
      // Try to extract item name from patterns like "how much is a guitar worth"
      const patterns = [
        /(?:worth|value of|price of|cost of|how much (?:is|for))\s+(?:a\s+|an\s+)?(.{3,40}?)(?:\?|$)/i,
        /estimate\s+(?:a\s+|an\s+)?(.{3,40}?)(?:\?|$)/i,
        /(?:is|are)\s+(?:a\s+|an\s+)?(.{3,40}?)\s+worth/i,
      ]
      let itemName = null
      for (const p of patterns) {
        const m = lower.match(p)
        if (m?.[1]?.trim().length > 2) { itemName = m[1].trim(); break }
      }

      if (itemName) {
        const est = estimateValue(itemName, '', 'Other', 'Good')
        return {
          text: `Value estimate for **"${itemName}"** (Good condition):\n\n💰 **${est.estimatedValue.toLocaleString()} FCFA**\nRange: ${est.range.min.toLocaleString()} – ${est.range.max.toLocaleString()} FCFA\nConfidence: ${est.confidence}\n\n${est.reasoning}\n\n💡 ${est.tips}`,
          suggestions: [],
        }
      }

      return {
        text: `I can estimate the value of any item!\n\nTry asking:\n• "How much is a laptop worth?"\n• "Value of Nike shoes"\n• "What is a used guitar worth?"\n\nOr use the **✦ Estimate Value** button in the Add Item form in My Space!`,
        suggestions: ['How much is an iPhone worth?', 'Value of Nike shoes', 'What is a used guitar worth?'],
      }
    }

    case 'fairnessAsk': {
      // Extract two numbers for direct comparison
      const nums = [...lower.matchAll(/(\d[\d,\s]*)/g)]
        .map(m => parseInt(m[1].replace(/[,\s]/g, '')))
        .filter(n => n >= 500)
      if (nums.length >= 2) {
        const f = analyseFairness(nums[0], nums[1])
        if (f) return {
          text: `Comparing **${nums[0].toLocaleString()} FCFA** vs **${nums[1].toLocaleString()} FCFA**:\n\n${f.icon} **${f.label}** — ${f.description}\n\n💡 ${f.advice}`,
          suggestions: [],
        }
      }
      return {
        text: `Here's how the fairness system works:\n\n⚖️ **Balanced** — values within 8%. Perfect trade!\n〜 **Acceptable** — within 25% difference. A small top-up helps.\n⚠️ **Unbalanced** — 25–50% gap. Add items or cash.\n🚫 **Unfair** — over 50% difference. Not recommended.\n\n**Try it:** Give me two values like "80000 vs 60000" and I'll analyse it!`,
        suggestions: ['Check 80000 vs 75000', 'Check 200000 vs 100000', 'Check 50000 vs 20000'],
      }
    }

    case 'howAsk':
      return {
        text: `Here's how Swappit works, step by step:\n\n1️⃣ **Post an item** — photo, description, FCFA value, condition\n2️⃣ **Browse Explorer** — see all available items from other users\n3️⃣ **Propose a swap** — offer one of your items in exchange\n4️⃣ **Fairness check** — we show if the values are balanced\n5️⃣ **Accept or decline** — the owner responds to your proposal\n6️⃣ **Share contacts** — if accepted, both get each other's contact\n7️⃣ **Meet to exchange** — use the 📍 Map feature to find each other\n8️⃣ **Leave a review** — rate your partner ⭐ to build community trust`,
        suggestions: ['Show me available items', 'Find matches for my items', 'How is fairness calculated?'],
      }

    case 'trustAsk': {
      const topUsers = users.filter(u => u.stars > 0).sort((a, b) => b.stars - a.stars).slice(0, 3)
      const userList = topUsers.length
        ? topUsers.map(u => `• ${u.firstName} ${u.lastName} — ⭐ ${u.stars} · ${u.reviewCount} reviews · ${u.swapCount} swaps`).join('\n')
        : 'No reviews yet — be the first to complete a swap!'
      return {
        text: `Trust is earned through completed swaps and reviews.\n\n**Top trusted users:**\n${userList}\n\n⭐ Stars are calculated from: ratings average (40%), swap count (30%), review count (20%), account age (10%).\n\nThe more honest swaps you complete, the higher your score!`,
        suggestions: [],
      }
    }

    default: {
      // Keyword search fallback
      const words  = lower.split(/\s+/).filter(w => w.length >= 3)
      const relevant = availableItems.filter(i =>
        words.some(w =>
          i.name.toLowerCase().includes(w) ||
          (i.description || '').toLowerCase().includes(w) ||
          i.category.toLowerCase().includes(w)
        )
      ).slice(0, 4)

      if (relevant.length) {
        const lines = relevant.map(i => `• ${i.emoji || '📦'} **${i.name}** — ${i.value?.toLocaleString()} FCFA (${i.condition})`).join('\n')
        return {
          text: `I found some relevant items:\n\n${lines}\n\nWould you like me to find swap matches or check fairness for any of these?`,
          suggestions: ['Find matches for my items', 'How does swapping work?'],
        }
      }

      return {
        text: `I didn't quite understand that. Here's what I can help with:\n\n🔍 Find swap matches for your items\n💰 Estimate the value of any item\n⚖️ Check if a swap is fair (give me two FCFA values)\n📋 Browse available items\n⭐ Understand the trust system`,
        suggestions: ['Show me available items', 'Find matches for my items', 'How much is a phone worth?'],
      }
    }
  }
}


// ─────────────────────────────────────────────────────────────────────────────
//  ALGORITHM 5: TRUST SCORE CALCULATOR
//  Composite score out of 100:
//    Stars average   40 pts  (stars/5 × 40)
//    Swap count      30 pts  (min(swaps/20, 1) × 30)
//    Review count    20 pts  (min(reviews/10, 1) × 20)
//    Account age     10 pts  (min(days/90, 1) × 10)
// ─────────────────────────────────────────────────────────────────────────────
export function calculateTrustScore(user) {
  if (!user) return { score: 0, label: 'Unknown', color: 'var(--ink-muted)' }

  const starScore   = ((user.stars || 0) / 5) * 40
  const swapScore   = Math.min((user.swapCount   || 0) / 20, 1) * 30
  const reviewScore = Math.min((user.reviewCount  || 0) / 10, 1) * 20
  const ageScore    = Math.min((Date.now() - new Date(user.joinedAt)) / (90 * 86400000), 1) * 10

  const score = Math.round(starScore + swapScore + reviewScore + ageScore)

  let label, color
  if      (score >= 80) { label = 'Highly Trusted'; color = 'var(--green)' }
  else if (score >= 60) { label = 'Trusted';         color = 'var(--green)' }
  else if (score >= 40) { label = 'Reliable';        color = 'var(--orange)' }
  else if (score >= 20) { label = 'Developing';      color = 'var(--orange)' }
  else                  { label = 'New Member';       color = 'var(--ink-muted)' }

  return { score, label, color }
}
