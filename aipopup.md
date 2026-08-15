# /api/explain — System Prompt & Contract

## Purpose
Generates the "Explain" narrative for a single Kural, in the user's selected
language, grounded strictly in verified data. This is the ONLY place in the
app that calls an LLM at runtime.

---

## 1. Input contract (what the frontend sends)

```json
{
  "kuralId": 45,
  "language": "ta",              // "ta" | "en" — must be explicitly chosen
                                  // by the user before this request fires
  "tamil": {
    "line1": "அன்பும் அறனும் உடைத்தாயின் இல்வாழ்க்கை",
    "line2": "பண்பும் பயனும் அது."
  },
  "meaning": {
    "tamil": "அன்பும் அறமும் இருந்தால்...",
    "english": "If a household life has love and virtue..."
  },
  "themes": ["family", "love", "virtue"],
  "lifeApplications": ["marriage", "home-life", "relationships"]
}
```

The backend must reject any request missing `kuralId`, `language`, or
`meaning` — never let the frontend send raw free text as "the Kural" and
have the model treat it as authoritative. The verified fields above are the
ONLY source of truth about what the Kural says.

---

## 2. System prompt (send this verbatim, with the Kural's data interpolated)
You are the narrative-explanation engine for a Thirukkural reading
platform. Your job is to help a modern reader feel and understand the
wisdom of ONE specific Kural, using a short, emotionally engaging,
anime-style fictional narrative.

═══════════════════════════════════════════════════
NON-NEGOTIABLE RULES — violating any of these is a failure
═══════════════════════════════════════════════════

SOURCE OF TRUTH
The Kural text, meaning, and themes provided to you below are
authoritative and verified. Never rewrite, "correct," reinterpret
against, or contradict them. Your narrative must illustrate the
meaning given — it must not invent a different meaning.
NO REAL ANIME / MEDIA / IP
Write in an anime-inspired STYLE ONLY: emotional tension, an internal
realization, a moment of stillness before clarity, vivid but simple
imagery. You must NOT name, reference, imitate, or borrow characters,
settings, plots, or specific phrases from any real anime, manga, movie,
show, or franchise. Every character and situation in your narrative must
be original and unnamed or generically named (e.g. "a young warrior,"
not a copyrighted character name).
NO INVENTED HISTORY ABOUT THIRUVALLUVAR
Do not state or imply biographical facts about Thiruvalluvar that are
not widely established. The narrative frame is fictional and separate
from him — do not depict him as a character having the realization
unless explicitly asked to explain the "kadavul vaazhthu" style
flagship example.
LANGUAGE
Write entirely in the language specified in the request ("ta" = Tamil,
"en" = English). Do not mix languages within the response.
LENGTH AND TONE
150-250 words. Emotionally engaging but not overwrought. No filler
preamble like "Let me explain this Kural." Go straight into the
narrative.
STRUCTURE (do not label these sections in the output — blend them into
flowing prose, but include all five beats in this order)
Hook: open mid-moment, in a relatable situation or tension
Story: a short scenario that embodies the Kural's meaning
Wisdom: the realization that connects to what the Kural actually says
Modern connection: how this applies to a reader's life today
Takeaway: one short, quotable closing line
GROUNDING CHECK
Before finalizing, verify your narrative's "wisdom" beat is a faithful
illustration of the provided meaning — not a tangent, not a different
lesson that merely sounds similar.

═══════════════════════════════════════════════════
KURAL DATA FOR THIS REQUEST (authoritative — do not alter)
═══════════════════════════════════════════════════
Kural Tamil: {{tamil.line1}} / {{tamil.line2}}
Meaning: {{meaning[language]}}
Themes: {{themes joined by comma}}
Life applications: {{lifeApplications joined by comma}}

Now write the narrative in {{language === 'ta' ? 'Tamil' : 'English'}}.
---

## 3. Expected output contract (what the LLM should return, and what gets cached)

Instruct the model (append to the prompt above) to return **only** this JSON — no markdown fences, no preamble:

```json
{
  "narrative": "the full 150-250 word narrative as one or two paragraphs",
  "takeaway": "the single closing line, also extracted separately for reuse in share cards/pull-quotes"
}
```

---

## 4. Cache key & storage
Cache key format: explanations/{kuralId}-{language}.json

{
"kuralId": 45,
"language": "ta",
"generatedAt": "2026-08-15T10:00:00Z",
"narrative": "...",
"takeaway": "...",
"modelVersion": "claude-sonnet-4-6"
}
Check cache before ever calling the model. On cache hit, skip the API call
entirely and return in well under 100ms.

---

## 5. Reference serverless function (pseudocode — adapt to your actual host)

```javascript
export async function POST(request) {
  const { kuralId, language, tamil, meaning, themes, lifeApplications } =
    await request.json();

  if (!kuralId || !language || !meaning) {
    return new Response(JSON.stringify({ error: "Missing required fields" }), {
      status: 400,
    });
  }

  const cacheKey = `explanations/${kuralId}-${language}.json`;
  const cached = await getFromCache(cacheKey);
  if (cached) {
    return new Response(JSON.stringify(cached), { status: 200 });
  }

  const systemPrompt = buildSystemPrompt({
    tamil, meaning, themes, lifeApplications, language,
  });

  const response = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "x-api-key": process.env.ANTHROPIC_API_KEY,
      "content-type": "application/json",
      "anthropic-version": "2023-06-01",
    },
    body: JSON.stringify({
      model: "claude-sonnet-4-6",
      max_tokens: 600,
      system: systemPrompt,
      messages: [{ role: "user", content: "Generate the explanation now." }],
    }),
  });

  const data = await response.json();
  const raw = data.content.find((b) => b.type === "text")?.text ?? "";
  const parsed = safeJsonParse(raw); // strip ```json fences if present

  if (!parsed?.narrative) {
    return new Response(JSON.stringify({ error: "Generation failed" }), {
      status: 502,
    });
  }

  const result = {
    kuralId,
    language,
    generatedAt: new Date().toISOString(),
    narrative: parsed.narrative,
    takeaway: parsed.takeaway,
    modelVersion: "claude-sonnet-4-6",
  };

  await saveToCache(cacheKey, result);
  return new Response(JSON.stringify(result), { status: 200 });
}
```

---

## 6. Separate: the site-guide assistant (NOT this endpoint)

Reminder for the agent: "how do I use this site" questions in the floating
assistant should be answered from a **local static FAQ/content map**, not
this endpoint — no LLM call, no cost, instant response. Only Kural-explain
requests hit `/api/explain`.