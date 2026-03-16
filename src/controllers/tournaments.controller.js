const tournamentsService = require("../services/tournaments.service");

const handleError = (res, error) => {
  const statusCode = error.statusCode || 500;
  const message =
    statusCode === 500 ? "Error interno del servidor" : error.message;
  return res.status(statusCode).json({ error: message });
};

const getRequesterId = (req) => req.user?.userId || req.user?.id;

const createTournament = async (req, res) => {
  try {
    const tournament = await tournamentsService.createTournament(
      getRequesterId(req),
      req.body,
    );
    return res.status(201).json(tournament);
  } catch (error) {
    return handleError(res, error);
  }
};

const getAllTournaments = async (req, res) => {
  try {
    const tournaments = await tournamentsService.getAllTournaments();
    return res.status(200).json(tournaments);
  } catch (error) {
    return handleError(res, error);
  }
};

const getTournamentById = async (req, res) => {
  try {
    const tournament = await tournamentsService.getTournamentById(
      req.params.id,
    );
    return res.status(200).json(tournament);
  } catch (error) {
    return handleError(res, error);
  }
};

const updateTournamentStatus = async (req, res) => {
  try {
    const tournament = await tournamentsService.updateTournamentStatus(
      req.params.id,
      req.body.status,
    );
    return res.status(200).json(tournament);
  } catch (error) {
    return handleError(res, error);
  }
};

const updateTournament = async (req, res) => {
  try {
    const tournament = await tournamentsService.updateTournament(
      req.params.id,
      req.body,
    );
    return res.status(200).json(tournament);
  } catch (error) {
    return handleError(res, error);
  }
};

const deleteTournament = async (req, res) => {
  try {
    const tournament = await tournamentsService.softDeleteTournament(
      req.params.id,
    );
    return res.status(200).json(tournament);
  } catch (error) {
    return handleError(res, error);
  }
};

const getPublicTournamentView = async (req, res) => {
  try {
    const tournamentView = await tournamentsService.getPublicTournamentView(
      req.params.id,
    );
    return res.status(200).json(tournamentView);
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  createTournament,
  getAllTournaments,
  getTournamentById,
  updateTournamentStatus,
  updateTournament,
  deleteTournament,
  getPublicTournamentView,
};
