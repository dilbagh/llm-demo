import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

type OpenRouterResponse = {
  id?: string;
  model?: string;
  choices?: Array<{
    index?: number;
    message?: {
      role?: string;
      content?: string;
    };
    finish_reason?: string;
  }>;
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    total_tokens?: number;
  };
  error?: {
    message?: string;
  };
};

const apiKey = process.env.OPENROUTER_API_KEY;
const baseUrl = "https://openrouter.ai/api/v1";
const model = "openai/gpt-4o-mini";

if (!apiKey) {
  console.error("Missing OPENROUTER_API_KEY. Copy .env.example to .env and set it.");
  process.exit(1);
}

function getTextFromResponse(data: OpenRouterResponse): string {
  const text = data.choices?.[0]?.message?.content?.trim();
  return text && text.length > 0 ? text : "No text response returned.";
}

function prettyJson(value: unknown): string {
  return JSON.stringify(value, null, 2);
}

async function main(): Promise<void> {
  const readline = createInterface({ input, output });
  const inputPrompt = (await readline.question("Enter a prompt: ")).trim();
  readline.close();

  if (!inputPrompt) {
    throw new Error("Prompt cannot be empty.");
  }

  const requestBody = {
    model,
    messages: [
      {
        role: "user",
        content: inputPrompt,
      },
    ],
  };

  console.log("\n=== Request ===");
  console.log("POST", `${baseUrl}/chat/completions`);
  console.log("Headers:");
  console.log(
    prettyJson({
      "Content-Type": "application/json",
      Authorization: "Bearer <OPENROUTER_API_KEY>",
    }),
  );
  console.log("Body:");
  console.log(prettyJson(requestBody));

  const response = await fetch(`${baseUrl}/chat/completions`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify(requestBody),
  });

  const data = (await response.json()) as OpenRouterResponse;

  console.log("\n=== HTTP Response ===");
  console.log("Status:", response.status, response.statusText);
  console.log("Body:");
  console.log(prettyJson(data));

  if (!response.ok) {
    const message = data.error?.message ?? `Request failed with status ${response.status}`;
    throw new Error(message);
  }

  console.log("\n=== Summary ===");
  console.log("Prompt:", inputPrompt);
  console.log("Model:", data.model ?? model);
  console.log("Response ID:", data.id ?? "not returned");
  console.log(
    "Usage:",
    data.usage
      ? `${data.usage.prompt_tokens ?? 0} prompt + ${data.usage.completion_tokens ?? 0} completion = ${data.usage.total_tokens ?? 0} total tokens`
      : "not returned",
  );
  console.log("Assistant Text:", getTextFromResponse(data));
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("OpenRouter demo failed:", message);
  process.exit(1);
});
