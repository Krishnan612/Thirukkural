export const prerender = false;

import fs from 'node:fs/promises';
import path from 'node:path';

export async function POST({ request }) {
  try {
    const body = await request.json();
    const kuralId = Number(body.kuralId);
    const language = body.lang === 'en' ? 'en' : 'ta'; // "ta" | "en"
    
    // Fallbacks to support raw body variables
    const tamil = body.tamil || {};
    const meaning = body.meaning || {};
    const themes = body.themes || [];
    const lifeApplications = body.lifeApplications || body.lifeApps || [];

    if (isNaN(kuralId) || kuralId < 1 || kuralId > 1330) {
      return new Response(JSON.stringify({ error: "Missing or invalid Kural ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const apiKey = import.meta.env.GEMINI_API_KEY || process.env.GEMINI_API_KEY;

    // 1. Server-side File Cache Check
    const cacheDir = path.join(process.cwd(), 'data', 'explanations');
    const cachePath = path.join(cacheDir, `${kuralId}-${language}.json`);
    
    try {
      const cachedData = await fs.readFile(cachePath, 'utf-8');
      const parsedCache = JSON.parse(cachedData);
      // Never serve offline-demo cache entries; they can be stale placeholders.
      if (!parsedCache.isOfflineDemo) {
      return new Response(JSON.stringify(parsedCache), {
        status: 200,
        headers: { "Content-Type": "application/json" }
      });
      }
    } catch (cacheErr) {
      // Cache miss - proceed to generate
    }

    // 2. Fetch Kural from database if properties are missing from frontend
    let verifiedTamil = tamil;
    let verifiedMeaning = meaning;
    let verifiedThemes = themes;
    let verifiedLifeApps = lifeApplications;

    if (!tamil.line1 || !meaning.tamil || !meaning.english) {
      const dbPath = path.join(process.cwd(), 'data', 'kurals.json');
      const rawDb = await fs.readFile(dbPath, 'utf-8');
      const kurals = JSON.parse(rawDb);
      const kural = kurals.find(k => k.id === kuralId);
      
      if (kural) {
        verifiedTamil = {
          line1: kural.tamil.line1,
          line2: kural.tamil.line2
        };
        verifiedMeaning = {
          tamil: kural.meaning.tamil,
          english: kural.meaning.english
        };
        verifiedThemes = kural.themes || [];
        verifiedLifeApps = kural.lifeApplications || [];
      } else {
        return new Response(JSON.stringify({ error: "Kural not found in database" }), {
          status: 404,
          headers: { "Content-Type": "application/json" }
        });
      }
    }

    // 3. Require API key for generation
    if (!apiKey) {
      return new Response(JSON.stringify({
        error: language === 'ta'
          ? 'GEMINI_API_KEY காணப்படவில்லை. .env கோப்பில் சரியான API key அமைத்து சேவையகத்தை மறுதொடக்கம் செய்யவும்.'
          : 'GEMINI_API_KEY is missing. Set a valid API key in .env and restart the server.'
      }), {
        status: 503,
        headers: { "Content-Type": "application/json" }
      });
    }

    // 4. Interpolate system instructions verbatim as instructed in aipopup.md
    const themesJoined = verifiedThemes.join(', ');
    const appsJoined = verifiedLifeApps.join(', ');
    const langFull = language === 'ta' ? 'Tamil' : 'English';

    const systemInstruction = `You are the narrative-explanation engine for a Thirukkural reading platform. Your job is to help a modern reader feel and understand the wisdom of ONE specific Kural, using a short, emotionally engaging, anime-style fictional narrative.

═══════════════════════════════════════════════════
NON-NEGOTIABLE RULES — violating any of these is a failure
═══════════════════════════════════════════════════

SOURCE OF TRUTH
The Kural text, meaning, and themes provided to you below are authoritative and verified. Never rewrite, "correct," re-interpret against, or contradict them. Your narrative must illustrate the meaning given — it must not invent a different meaning.

NO REAL ANIME / MEDIA / IP
Write in an anime-inspired STYLE ONLY: emotional tension, an internal realization, a moment of stillness before clarity, vivid but simple imagery. You must NOT name, reference, imitate, or borrow characters, settings, plots, or specific phrases from any real anime, manga, movie, show, or franchise. Every character and situation in your narrative must be original and unnamed or generically named (e.g. "a young warrior", "an apprentice", not a copyrighted character name).

NO INVENTED HISTORY ABOUT THIRUVALLUVAR
Do not state or imply biographical facts about Thiruvalluvar that are not widely established. The narrative frame is fictional and separate from him — do not depict him as a character having the realization unless explicitly asked to explain the "kadavul vaazhthu" style flagship example.

LANGUAGE
Write entirely in the language specified in the request ("ta" = Tamil, "en" = English). Do not mix languages within the response.

LENGTH AND TONE
150-250 words. Emotionally engaging but not overwrought. No filler preamble like "Let me explain this Kural." Go straight into the narrative.

STRUCTURE (do not label these sections in the output — blend them into flowing prose, but include all five beats in this order)
Hook: open mid-moment, in a relatable situation or tension
Story: a short scenario that embodies the Kural's meaning
Wisdom: the realization that connects to what the Kural actually says
Modern connection: how this applies to a reader's life today
Takeaway: one short, quotable closing line

GROUNDING CHECK
Before finalizing, verify your narrative's "wisdom" beat is a faithful illustration of the provided meaning — not a tangent, not a different lesson that merely sounds similar.

═══════════════════════════════════════════════════
KURAL DATA FOR THIS REQUEST (authoritative — do not alter)
═══════════════════════════════════════════════════
Kural Tamil: ${verifiedTamil.line1} / ${verifiedTamil.line2}
Meaning: ${verifiedMeaning[language]}
Themes: ${themesJoined}
Life applications: ${appsJoined}

Now write the narrative in ${langFull}.
Return ONLY the following JSON structure (do not wrap in markdown code blocks or add preamble):
{
  "narrative": "the full 150-250 word narrative as one or two paragraphs",
  "takeaway": "the single closing line"
}`;

    const userPrompt = "Generate the explanation now.";

    // 5. Call Gemini API
    const modelName = "gemini-3.6-flash";
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${modelName}:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify({
          contents: [
            {
              role: "user",
              parts: [{ text: userPrompt }]
            }
          ],
          systemInstruction: {
            parts: [{ text: systemInstruction }]
          },
          generationConfig: {
            responseMimeType: "application/json",
            temperature: 0.7
          }
        })
      }
    );

    if (!response.ok) {
      const errText = await response.text();
      console.error("Gemini API Error details:", errText);
      throw new Error(`Gemini API returned status ${response.status}`);
    }

    const resJson = await response.json();
    const generatedText = resJson.candidates?.[0]?.content?.parts?.[0]?.text;
    
    if (!generatedText) {
      throw new Error("No text returned from Gemini API");
    }

    // Clean markdown code wrappers if present
    const cleaned = generatedText.replace(/```json/g, '').replace(/```/g, '').trim();
    const parsed = JSON.parse(cleaned);

    if (!parsed.narrative || !parsed.takeaway) {
      throw new Error("Required fields 'narrative' or 'takeaway' missing from AI generation");
    }

    const result = {
      kuralId,
      language,
      generatedAt: new Date().toISOString(),
      narrative: parsed.narrative,
      takeaway: parsed.takeaway,
      modelVersion: modelName
    };

    // 6. Write to Cache Directory
    await fs.mkdir(cacheDir, { recursive: true });
    await fs.writeFile(cachePath, JSON.stringify(result, null, 2), 'utf-8');

    return new Response(JSON.stringify(result), {
      status: 200,
      headers: { "Content-Type": "application/json" }
    });

  } catch (error) {
    console.error("Error in explain endpoint:", error);
    return new Response(JSON.stringify({ error: "Failed to generate explanation. " + error.message }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
