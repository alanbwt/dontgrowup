export async function onRequestGet(context) {
  const { env } = context;

  try {
    // Get latest 20 submissions for the ticker
    const { results: submissions } = await env.DB.prepare(
      'SELECT word, name, city, created_at FROM submissions ORDER BY created_at DESC LIMIT 20'
    ).all();

    // Get total count
    const { results: countResult } = await env.DB.prepare(
      'SELECT COUNT(*) as count FROM submissions'
    ).all();

    return Response.json({
      submissions,
      count: countResult[0].count
    }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  } catch (err) {
    return Response.json({ submissions: [], count: 0 }, {
      headers: { 'Access-Control-Allow-Origin': '*' }
    });
  }
}
