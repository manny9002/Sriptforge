export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  const { category, tone, length, topic, tokens } = req.body;

  try {
    const response = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': process.env.ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify({
        model: 'claude-sonnet-4-20250514',
        max_tokens: tokens || 1000,
        messages: [{
          role: 'user',
          content: `You are a professional script writer. Write a ${length} ${category} script. Tone: ${tone}. Topic: ${topic || 'your choice'}. Format with TITLE, [scene directions], CHARACTER: dialogue. Write the full script.`
        }]
      })
    });

    const data = await response.json();
    const text = data.content?.map(b => b.text || '').join('\n') || 'Error generating script.';
    res.status(200).json({ script: text });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate script.' });
  }
}
