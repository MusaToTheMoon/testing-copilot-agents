import app from "./app";

const PORT = parseInt(process.env["PORT"] ?? "3001", 10);

const server = app.listen(PORT, () => {
  console.log(`Essay API server running on port ${PORT}`);
  console.log(`Environment: ${process.env["NODE_ENV"] ?? "development"}`);
  if (!process.env["OPENAI_API_KEY"]) {
    console.warn("⚠️  OPENAI_API_KEY not set — LLM calls will use mock mode");
  }
});

process.on("SIGTERM", () => {
  server.close(() => {
    console.warn("Server shut down gracefully");
    process.exit(0);
  });
});

export default server;
