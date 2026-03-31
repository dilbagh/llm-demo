import { createInterface } from "node:readline/promises";
import { stdin as input, stdout as output } from "node:process";

type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

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
const maxLoggedMessageLength = 120;
const systemPrompt =
  "You are a helpful assistant. Give clear, concise answers and ask brief follow-up questions only when needed.";

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

function normalizeMessageContent(content: string): string {
  return content.replace(/\r?\n/g, " | ");
}

function truncateMessageContent(content: string): string {
  if (content.length <= maxLoggedMessageLength) {
    return content;
  }

  return `${content.slice(0, maxLoggedMessageLength - 3)}...`;
}

function formatMessagesTable(messages: ChatMessage[]): Array<{
  role: ChatMessage["role"];
  content: string;
}> {
  return messages.map((message) => ({
    role: message.role,
    content: truncateMessageContent(normalizeMessageContent(message.content)),
  }));
}

function printRequest(requestBody: { model: string; messages: ChatMessage[] }): void {
  console.log("\n=== Request ===");
  console.log("POST", `${baseUrl}/chat/completions`);
  console.log("Model:", requestBody.model);
  console.log("Messages:");
  console.table(formatMessagesTable(requestBody.messages));
}

function printResponse(assistantText: string): void {
  console.log("\n=== Response ===");
  console.log("Assistant:");
  console.log(assistantText);
}

async function main(): Promise<void> {
  const readline = createInterface({ input, output });
  const messages: ChatMessage[] = [
    {
      role: "system",
      content: systemPrompt,
    },
  ];

  console.log("Chat demo started. Type 'exit' or 'quit' to end the session.");

  try {
    while (true) {
      const userInput = (await readline.question("\nYou: ")).trim();

      if (!userInput) {
        console.log("Please enter a message.");
        continue;
      }

      if (userInput === "exit" || userInput === "quit") {
        console.log("Ending chat demo.");
        break;
      }

      messages.push({
        role: "user",
        content: userInput,
      });

      const requestBody = {
        model,
        messages,
      };

      printRequest(requestBody);

      const response = await fetch(`${baseUrl}/chat/completions`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${apiKey}`,
        },
        body: JSON.stringify(requestBody),
      });

      const data = (await response.json()) as OpenRouterResponse;

      if (!response.ok) {
        console.log("\n=== Response ===");
        console.log("Status:", response.status, response.statusText);
        console.log("Body:");
        console.log(prettyJson(data));

        const message = data.error?.message ?? `Request failed with status ${response.status}`;
        throw new Error(message);
      }

      const assistantText = getTextFromResponse(data);
      printResponse(assistantText);

      messages.push({
        role: "assistant",
        content: assistantText,
      });
    }
  } finally {
    readline.close();
  }
}

main().catch((error: unknown) => {
  const message = error instanceof Error ? error.message : String(error);
  console.error("OpenRouter chat demo failed:", message);
  process.exit(1);
});
