export async function onRequestPost(context) {
  const { request, env } = context;

  try {
    const { phone, email } = await request.json();

    if (!phone && !email) {
      return Response.json({ error: 'Phone or email required' }, { status: 400 });
    }

    await env.DB.prepare(
      'INSERT INTO subscribers (phone, email, created_at) VALUES (?, ?, ?)'
    ).bind(
      phone || null,
      email || null,
      new Date().toISOString()
    ).run();

    return Response.json({ success: true }, {
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
