export async function queryOpenAI(prompt: string): Promise<string> {
  const apiKey = process.env.OPENAI_API_KEY;
  if (!apiKey) {
    throw new Error("OPENAI_API_KEY ist nicht gesetzt. Bitte ergänze die Umgebungsvariable in .env.local.");
  }

  const response = await fetch("https://api.openai.com/v1/chat/completions", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`
    },
    body: JSON.stringify({
      model: process.env.OPENAI_MODEL ?? "gpt-3.5-turbo",
      messages: [
        {
          role: "system",
          content: "Du bist ein hilfreicher Assistent für Weinbeschreibungen und Weinkellerverwaltung."
        },
        {
          role: "user",
          content: prompt
        }
      ],
      temperature: 0.8,
      max_tokens: 350
    })
  });

  if (!response.ok) {
    const errorResponse = await response.json().catch(() => null);
    const message = errorResponse?.error?.message ?? response.statusText;
    throw new Error(`OpenAI-API fehlgeschlagen: ${message}`);
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content?.trim() ?? "";
}
