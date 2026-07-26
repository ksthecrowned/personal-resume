export async function runWorkersAiPrompt(
  system: string,
  user: string,
): Promise<string> {
  const accountId = process.env.CF_ACCOUNT_ID;
  const token = process.env.CF_API_TOKEN;
  if (!accountId || !token) {
    throw new Error(
      "CF_ACCOUNT_ID and CF_API_TOKEN are required when AI_MODE=cloudflare",
    );
  }
  const model = "@cf/meta/llama-3.1-8b-instruct";
  const res = await fetch(
    `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/${model}`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        messages: [
          { role: "system", content: system },
          { role: "user", content: user },
        ],
      }),
    },
  );
  if (!res.ok) {
    throw new Error(`Workers AI error: ${res.status} ${await res.text()}`);
  }
  const json = (await res.json()) as { result?: { response?: string } };
  return json.result?.response ?? "";
}
