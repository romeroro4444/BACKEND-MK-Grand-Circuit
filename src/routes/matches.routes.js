const express = require("express");
const router = express.Router();
const matchesController = require("../controllers/matches.controller");
const {
  authenticateJWT,
  authorizeAdmin,
} = require("../middlewares/auth.middleware");

/**
 * POST /matches
 * Crear partido (solo ADMIN)
 */
router.post(
  "/matches",
  authenticateJWT,
  authorizeAdmin,
  matchesController.createMatch,
);

/**
 * GET /tournaments/:id/matches
 * Ver partidos de un torneo (público)
 */
router.get("/tournaments/:id/matches", matchesController.getTournamentMatches);

router.patch(
  "/matches/:id",
  authenticateJWT,
  authorizeAdmin,
  matchesController.updateMatch,
);

/**
 * PATCH /matches/:id/result
 * Registrar resultado (solo ADMIN)
 */
router.patch(
  "/matches/:id/result",
  authenticateJWT,
  authorizeAdmin,
  matchesController.updateMatchResult,
);

module.exports = router;
