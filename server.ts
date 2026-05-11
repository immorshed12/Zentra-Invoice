import express from "express";
import { createServer as createViteServer } from "vite";
import path from "path";
import { fileURLToPath } from "url";
import cron from "node-cron";
import { createClient } from "@supabase/supabase-js";
import dotenv from "dotenv";

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// --- Logger Utility ---
const logger = {
  info: (msg: string, meta?: any) => console.log(JSON.stringify({ level: 'INFO', timestamp: new Date().toISOString(), message: msg, ...meta })),
  error: (msg: string, err?: any) => console.error(JSON.stringify({ level: 'ERROR', timestamp: new Date().toISOString(), message: msg, error: err?.message, stack: err?.stack })),
  warn: (msg: string, meta?: any) => console.warn(JSON.stringify({ level: 'WARN', timestamp: new Date().toISOString(), message: msg, ...meta }))
};

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Initialize Supabase Admin
  const supabaseUrl = process.env.VITE_SUPABASE_URL;
  const supabaseServiceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  const supabaseAdmin = (supabaseUrl && supabaseServiceKey) 
    ? createClient(supabaseUrl, supabaseServiceKey)
    : null;

  // --- Scheduled Jobs (Hardened) ---
  cron.schedule("0 0 * * *", async () => {
    logger.info("[Cron] Starting daily maintenance job");
    if (!supabaseAdmin) {
      logger.warn("[Cron] Admin client missing, skipping reset.");
      return;
    }

    try {
      const now = new Date();
      const thirtyDaysAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

      // Multi-instance safety: We only reset if the last reset was more than 23 hours ago
      // This prevents race conditions if multiple containers start at once
      const { data: companies, error } = await supabaseAdmin
        .from('companies')
        .select('id, usage_reset_at')
        .lt('usage_reset_at', thirtyDaysAgo.toISOString());

      if (error) throw error;

      if (companies && companies.length > 0) {
        logger.info(`[Cron] Resetting usage for ${companies.length} companies.`);
        const { error: updateError } = await supabaseAdmin
          .from('companies')
          .update({ usage_reset_at: now.toISOString() })
          .in('id', companies.map(c => c.id));

        if (updateError) throw updateError;
        logger.info("[Cron] Usage reset completed successfully.");
      } else {
        logger.info("[Cron] No companies required reset.");
      }
    } catch (err) {
      logger.error("[Cron] Critical failure in reset job", err);
    }
  });

  // API health check with metadata
  app.get("/api/health", (req, res) => {
    res.json({ 
      status: "ok", 
      version: "1.0.0",
      env: process.env.NODE_ENV || "development",
      uptime: process.uptime()
    });
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*all", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Zentra Server running on http://localhost:${PORT}`);
    console.log(`Mode: ${process.env.NODE_ENV || 'development'}`);
  });
}

startServer().catch((err) => {
  console.error("Failed to start server:", err);
  process.exit(1);
});
