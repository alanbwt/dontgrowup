const ADMIN_PASSWORD = 'dontgrowup2026';

function checkAuth(request) {
  const auth = request.headers.get('Authorization');
  if (!auth || !auth.startsWith('Basic ')) return false;
  const decoded = atob(auth.split(' ')[1]);
  const [, password] = decoded.split(':');
  return password === ADMIN_PASSWORD;
}

// GET /api/admin — returns stats or CSV export
export async function onRequestGet(context) {
  const { request, env } = context;

  if (!checkAuth(request)) {
    return new Response('Unauthorized', {
      status: 401,
      headers: { 'WWW-Authenticate': 'Basic realm="Admin"' }
    });
  }

  const url = new URL(request.url);
  const format = url.searchParams.get('format');

  if (format === 'csv') {
    // Export all submissions as CSV
    const { results } = await env.DB.prepare(
      'SELECT word, name, city, phone, created_at FROM submissions ORDER BY created_at DESC'
    ).all();

    const header = 'word,name,city,phone,submitted_at';
    const rows = results.map(r =>
      `"${r.word}","${r.name}","${r.city}","${r.phone}","${r.created_at}"`
    );
    const csv = [header, ...rows].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="dontgrowup-submissions-${new Date().toISOString().slice(0, 10)}.csv"`,
      }
    });
  }

  if (format === 'phones') {
    // Export just phone numbers for Laylo import
    const { results } = await env.DB.prepare(
      'SELECT DISTINCT phone FROM submissions WHERE phone IS NOT NULL ORDER BY phone'
    ).all();

    const header = 'phone_number';
    const rows = results.map(r => r.phone);
    const csv = [header, ...rows].join('\n');

    return new Response(csv, {
      headers: {
        'Content-Type': 'text/csv',
        'Content-Disposition': `attachment; filename="dontgrowup-phones-${new Date().toISOString().slice(0, 10)}.csv"`,
      }
    });
  }

  // Default: return stats as JSON
  const { results: countResult } = await env.DB.prepare(
    'SELECT COUNT(*) as total FROM submissions'
  ).all();

  const { results: phoneCount } = await env.DB.prepare(
    'SELECT COUNT(DISTINCT phone) as unique_phones FROM submissions'
  ).all();

  const { results: recent } = await env.DB.prepare(
    'SELECT word, name, city, phone, created_at FROM submissions ORDER BY created_at DESC LIMIT 10'
  ).all();

  return Response.json({
    total_submissions: countResult[0].total,
    unique_phones: phoneCount[0].unique_phones,
    recent_submissions: recent
  });
}
