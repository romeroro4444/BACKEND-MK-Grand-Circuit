const matchesService = require("../services/matches.service");

const handleError = (res, error) => {
  const statusCode = error.statusCode || 500;
  const message =
    statusCode === 500 ? "Error interno del servidor" : error.message;
  return res.status(statusCode).json({ error: message });
};

/**
 * POST /matches
 * Crea un partido entre dos equipos
 * Solo ADMIN
 */
async function createMatch(req, res) {
  try {
    const { tournamentId, teamAId, teamBId } = req.body;

    if (!tournamentId || !teamAId || !teamBId) {
      return res.status(400).json({
        error: "Se requieren tournamentId, teamAId y teamBId",
      });
    }

    const match = await matchesService.createMatchExtended(req.body);
    return res.status(201).json(match);
  } catch (error) {
    return handleError(res, error);
  }
}

/**
 * GET /tournaments/:id/matches
 * Obtiene todos los partidos de un torneo
 */
async function getTournamentMatches(req, res) {
  try {
    const { id } = req.params;

    const matches = await matchesService.getTournamentMatches(id);
    return res.status(200).json(matches);
  } catch (error) {
    return handleError(res, error);
  }
}

async function updateMatch(req, res) {
  try {
    const { id } = req.params;
    const match = await matchesService.updateMatch(id, req.body);
    return res.status(200).json(match);
  } catch (error) {
    return handleError(res, error);
  }
}

/**
 * PATCH /matches/:id/result
 * Actualiza el resultado de un partido
 * Solo ADMIN
 */
async function updateMatchResult(req, res) {
  try {
    const { id } = req.params;
    const { scoreA, scoreB } = req.body;

    if (scoreA === undefined || scoreB === undefined) {
      return res.status(400).json({
        error: "Se requieren scoreA y scoreB",
      });
    }

    const match = await matchesService.updateMatchResult(id, scoreA, scoreB);
    return res.status(200).json(match);
  } catch (error) {
    return handleError(res, error);
  }
}

module.exports = {
  createMatch,
  getTournamentMatches,
  updateMatch,
  updateMatchResult,
};
