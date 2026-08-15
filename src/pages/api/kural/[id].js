export const prerender = false;

import fs from 'node:fs/promises';
import path from 'node:path';

export async function GET({ params }) {
  try {
    const id = Number(params.id);
    if (isNaN(id) || id < 1 || id > 1330) {
      return new Response(JSON.stringify({ error: "Invalid Kural ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" }
      });
    }

    const dataPath = path.join(process.cwd(), 'data', 'kurals.json');
    const rawData = await fs.readFile(dataPath, 'utf-8');
    const kurals = JSON.parse(rawData);
    const kural = kurals.find(k => k.id === id);

    if (!kural) {
      return new Response(JSON.stringify({ error: "Kural not found" }), {
        status: 404,
        headers: { "Content-Type": "application/json" }
      });
    }

    // Format to match the explain API input contract
    const formatted = {
      kuralId: kural.id,
      tamil: {
        line1: kural.tamil.line1 || kural.line1,
        line2: kural.tamil.line2 || kural.line2
      },
      meaning: {
        tamil: kural.meaning.tamil || kural.meaningTa,
        english: kural.meaning.english || kural.meaningEn
      },
      themes: kural.themes || [],
      lifeApplications: kural.lifeApplications || kural.lifeApps || []
    };

    return new Response(JSON.stringify(formatted), {
      status: 200,
      headers: { 
        "Content-Type": "application/json",
        "Cache-Control": "public, max-age=31536000"
      }
    });

  } catch (err) {
    console.error("Error fetching single kural data:", err);
    return new Response(JSON.stringify({ error: "Server error" }), {
      status: 500,
      headers: { "Content-Type": "application/json" }
    });
  }
}
