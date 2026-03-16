const express = require("express");
const swaggerUi = require("swagger-ui-express");
const swaggerSpec = require("./config/swagger");
const authRoutes = require("./routes/auth.routes");
const teamsRoutes = require("./routes/teams.routes");
const tournamentsRoutes = require("./routes/tournaments.routes");
const registrationsRoutes = require("./routes/registrations.routes");
const matchesRoutes = require("./routes/matches.routes");
const roundsRoutes = require("./routes/rounds.routes");
const { authenticateJWT } = require("./middlewares/auth.middleware");

const app = express();

app.use(express.json());
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));

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
