# llm-demo

Small TypeScript workshop/demo project with examples for a basic script, a single-prompt OpenRouter request, and a simple interactive chat loop.

## Prerequisites

- Node.js 20+ recommended
- npm

## Setup

```bash
npm install
cp .env.example .env
```

Set `OPENROUTER_API_KEY` in `.env`.

## Build

```bash
npm run build
```

## Run examples

`npm start`

Runs the basic compiled TypeScript entrypoint.

`npm run start:llm-demo`

Prompts once, sends a single request to OpenRouter, and prints request/response details plus a summary.

`npm run start:chat-demo`

Starts a multi-turn terminal chat session using OpenRouter.

`start:llm-demo` and `start:chat-demo` expect `.env` to be present.

## Notes

- The default model used by the demos is `openai/gpt-4o-mini`.
- The demos call the OpenRouter Chat Completions endpoint.

## License

This project is licensed under the MIT License. See [LICENSE](LICENSE).
