const express = require("express");
const cors = require("cors");
const swaggerSpec = require("./config/swagger");
const authRoutes = require("./routes/auth.routes");
const teamsRoutes = require("./routes/teams.routes");
const tournamentsRoutes = require("./routes/tournaments.routes");
const registrationsRoutes = require("./routes/registrations.routes");
const matchesRoutes = require("./routes/matches.routes");
const roundsRoutes = require("./routes/rounds.routes");
const { authenticateJWT } = require("./middlewares/auth.middleware");

const app = express();

const allowedOrigins = (process.env.ALLOWED_ORIGINS || "")
  .split(",")
  .map((origin) => origin.trim().replace(/\/$/, ""))
  .filter(Boolean);

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) {
        return callback(null, true);
      }

      const normalizedOrigin = origin.endsWith("/")
        ? origin.slice(0, -1)
        : origin;

      if (allowedOrigins.length === 0) {
        return callback(
          new Error("CORS no configurado: falta ALLOWED_ORIGINS"),
        );
      }

      if (allowedOrigins.includes(normalizedOrigin)) {
        return callback(null, true);
      }

      return callback(new Error("Origen no permitido por CORS"));
    },
    methods: ["GET", "POST", "PATCH", "PUT", "DELETE", "OPTIONS"],
    allowedHeaders: ["Content-Type", "Authorization", "token"],
    credentials: true,
  }),
);

app.use(express.json());

app.get("/api-docs/swagger.json", (req, res) => {
  return res.status(200).json(swaggerSpec);
});

const swaggerHtml = `<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="UTF-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1.0" />
    <title>MK Grand Circuit API Docs</title>
    <link
      rel="stylesheet"
      href="https://unpkg.com/swagger-ui-dist@5/swagger-ui.css"
    />
  </head>
  <body>
    <div id="swagger-ui"></div>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-bundle.js"></script>
    <script src="https://unpkg.com/swagger-ui-dist@5/swagger-ui-standalone-preset.js"></script>
    <script>
      window.onload = () => {
        window.ui = SwaggerUIBundle({
          url: '/api-docs/swagger.json',
          dom_id: '#swagger-ui',
          deepLinking: true,
          presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
          layout: 'BaseLayout'
        });
      };
    </script>
  </body>
</html>`;

app.get("/api-docs", (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.status(200).send(swaggerHtml);
});

app.get("/api-docs/", (req, res) => {
  res.setHeader("Content-Type", "text/html; charset=utf-8");
  return res.status(200).send(swaggerHtml);
});

app.get("/", (req, res) => {
  return res.json({ message: "API de Express funcionando" });
});

app.use("/auth", authRoutes);
app.use("/teams", teamsRoutes);
app.use("/tournaments", tournamentsRoutes);
app.use("/", registrationsRoutes);
app.use("/", matchesRoutes);
app.use("/", roundsRoutes);

app.get("/auth/me", authenticateJWT, (req, res) => {
  return res.status(200).json({ user: req.user });
});

module.exports = app;
