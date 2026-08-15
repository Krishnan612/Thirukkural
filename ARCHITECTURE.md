# AI Caching & Serverless Architecture

This document details the flow of user queries, AI generation, and caching strategies for the Thirukkural explanation companion on this platform.

---

## 1. Flow Diagram

```
User requests a Kural explanation in floating popup (or page panel)
│
▼
Check Browser Client Cache
localStorage.getItem("thirukkural_explain_{kuralId}_{lang}")
│
├─► [Exists] ──► Return instantly (Client-side, <5ms)
│
└─► [Missing] ──► Call HTTP POST to /api/explain (Serverless function)
                  │
                  ▼
                  Check Server Cache
                  data/explanations/{kuralId}-{lang}.json
                  │
                  ├─► [Exists] ──► Return instantly (Server-side, <100ms)
                  │
                  └─► [Missing] ──► Call Gemini API (gemini-1.5-flash)
                                    │
                                    ▼
                                    Verify response JSON contract
                                    │
                                    ▼
                                    Write JSON file to server cache
                                    data/explanations/{kuralId}-{lang}.json
                                    │
                                    ▼
                                    Send response back to client
                                    │
                                    ▼
                                    Write to client cache & render
```

---

## 2. API Contract — `/api/explain`

### Request Header
```http
POST /api/explain
Content-Type: application/json
```

### Request Payload (Frontend to Backend)
```json
{
  "kuralId": 45,
  "lang": "ta",
  "tamil": {
    "line1": "அன்பும் அறனும் உடைத்தாயின் இல்வாழ்க்கை",
    "line2": "பண்பும் பயனும் அது."
  },
  "meaning": {
    "tamil": "அன்பும் அறமும் இருந்தால்...",
    "english": "If a household life has love and virtue..."
  },
  "themes": ["family", "love", "virtue"],
  "lifeApplications": ["marriage", "relationships"]
}
```

### Response Payload (Backend to Frontend)
```json
{
  "kuralId": 45,
  "language": "ta",
  "generatedAt": "2026-08-15T10:00:00.000Z",
  "narrative": "A short, 150-250 word anime-style prose describing a scenario, realization, and modern application of the Kural...",
  "takeaway": "The single closing takeaway line."
}
```

---

## 3. Prompts & Grounding Guardrails

1. **API Key Isolation**: The API key (`GEMINI_API_KEY`) is stored strictly on the server side in process environment variables. It is never exposed to the client.
2. **Strict Grounding Context**: The AI model is strictly bounded by the `meaning` and `tamil` text provided in the request payload. It does not have permission to modify, invent, or "correct" the Kural text itself, ensuring absolute fidelity to the source dataset.
3. **Fictional Frame Instruction**: System instructions enforce the creation of unnamed original characters in anime-style dramatic realization beats, explicitly forbidding copyrighted names, biographical fabrications about Thiruvalluvar, and mixed-language output.
