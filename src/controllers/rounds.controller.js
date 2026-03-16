const roundsService = require("../services/rounds.service");

const handleError = (res, error) => {
  const statusCode = error.statusCode || 500;
  const message =
    statusCode === 500 ? "Error interno del servidor" : error.message;
  return res.status(statusCode).json({ error: message });
};

const createRound = async (req, res) => {
  try {
    const round = await roundsService.createRound(
      req.params.tournamentId,
      req.body,
    );
    return res.status(201).json(round);
  } catch (error) {
    return handleError(res, error);
  }
};

const updateRound = async (req, res) => {
  try {
    const round = await roundsService.updateRound(req.params.id, req.body);
    return res.status(200).json(round);
  } catch (error) {
    return handleError(res, error);
  }
};

const deleteRound = async (req, res) => {
  try {
    const round = await roundsService.deleteRound(req.params.id);
    return res.status(200).json(round);
  } catch (error) {
    return handleError(res, error);
  }
};

const assignMatchToRound = async (req, res) => {
  try {
    const result = await roundsService.assignMatchToRound(
      req.params.id,
      req.params.matchId,
    );
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

const getTournamentBracket = async (req, res) => {
  try {
    const bracket = await roundsService.getTournamentBracket(req.params.id);
    return res.status(200).json(bracket);
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  createRound,
  updateRound,
  deleteRound,
  assignMatchToRound,
  getTournamentBracket,
};
