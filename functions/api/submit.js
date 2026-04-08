// Profanity word list
const PROFANITY = new Set([
  'fuck','shit','ass','bitch','damn','dick','cock','pussy','cunt',
  'bastard','slut','whore','nigger','nigga','fag','faggot','retard',
  'twat','wanker','bollocks','piss','tits','asshole','motherfucker',
  'fucker','dickhead','shithead','dumbass','jackass','bullshit',
  'goddamn','hell','crap','penis','vagina','boob','dildo','anal'
]);

function isProfane(word) {
  const lower = word.toLowerCase().trim();
  if (PROFANITY.has(lower)) return true;
  // Check if the word contains a profane word
  for (const p of PROFANITY) {
    if (lower.includes(p)) return true;
  }
  return false;
}

export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { word, name, city } = await request.json();

    if (!word || typeof word !== 'string') {
      return Response.json({ error: 'Word is required' }, { status: 400 });
    }

    const cleaned = word.trim().toLowerCase().replace(/[^a-z0-9\s'-]/g, '');

    if (cleaned.length === 0 || cleaned.length > 30) {
      return Response.json({ error: 'Invalid word' }, { status: 400 });
    }

    if (isProfane(cleaned)) {
      return Response.json({ error: 'profanity', message: "let's keep it clean" }, { status: 400 });
    }

    const nameClean = (name || 'anonymous').trim().toLowerCase().replace(/[^a-z\s'-]/g, '').substring(0, 30);
    const cityClean = (city || 'los angeles').trim().toLowerCase().substring(0, 50);

    // Store in D1
    await env.DB.prepare(
      'INSERT INTO submissions (word, name, city, created_at) VALUES (?, ?, ?, ?)'
    ).bind(cleaned, nameClean, cityClean, new Date().toISOString()).run();

    // Get updated count
    const { results } = await env.DB.prepare('SELECT COUNT(*) as count FROM submissions').all();
    const count = results[0].count;

    return Response.json({ success: true, word: cleaned, count }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return Response.json({ error: 'Server error' }, { status: 500 });
  }
}

export async function onRequestOptions() {
  return new Response(null, {
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'POST, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type',
    }
  });
}
