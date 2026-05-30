export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
  const { category, tone, length, topic, tokens } = req.body;
  try {
    const response = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${process.env.OPENAI_API_KEY}`
      },
      body: JSON.stringify({
        model: 'gpt-3.5-turbo',
        max_tokens: tokens || 1000,
        messages: [{
          role: 'user',
          content: `You are a professional script writer. Write a ${length} ${category} script. Tone: ${tone}. Topic: ${topic || 'your choice'}. Format with TITLE, [scene directions], CHARACTER: dialogue. Write the full script.`
        }]
      })
    });
    const data = await response.json();
    const text = data.choices?.[0]?.message?.content || 'Error generating script.';
    res.status(200).json({ script: text });
  } catch (err) {
    res.status(500).json({ error: 'Failed to generate script.' });
  }
}
