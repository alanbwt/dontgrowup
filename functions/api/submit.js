export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { word, name, phone } = await request.json();

    // Auto-detect city from Cloudflare request headers
    const cfCity = request.cf?.city || '';
    const cfRegion = request.cf?.region || '';

    if (!word || typeof word !== 'string') {
      return Response.json({ error: 'Word is required' }, { status: 400 });
    }

    if (!name || !phone) {
      return Response.json({ error: 'Name and phone are required' }, { status: 400 });
    }

    const cleaned = word.trim().toLowerCase().replace(/[^a-z0-9\s'-]/g, '');

    if (cleaned.length === 0 || cleaned.length > 30) {
      return Response.json({ error: 'Invalid word' }, { status: 400 });
    }

    // Enforce single word only (no spaces)
    if (cleaned.includes(' ')) {
      return Response.json({ error: 'One word only' }, { status: 400 });
    }

    const nameClean = name.trim().toLowerCase().replace(/[^a-z\s'-]/g, '').substring(0, 30);
    const cityClean = (cfCity || 'los angeles').toLowerCase().substring(0, 50);
    const phoneClean = phone.trim().replace(/[^0-9+\-() ]/g, '').substring(0, 20);

    // Store in D1
    await env.DB.prepare(
      'INSERT INTO submissions (word, name, city, phone, created_at) VALUES (?, ?, ?, ?, ?)'
    ).bind(cleaned, nameClean, cityClean, phoneClean, new Date().toISOString()).run();

    // Get updated count
    const { results } = await env.DB.prepare('SELECT COUNT(*) as count FROM submissions').all();
    const count = results[0].count;

    return Response.json({ success: true, word: cleaned, city: cityClean, count }, {
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
