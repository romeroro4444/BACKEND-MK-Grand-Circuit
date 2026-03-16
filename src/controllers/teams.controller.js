const teamsService = require("../services/teams.service");

const handleError = (res, error) => {
  const statusCode = error.statusCode || 500;
  const message =
    statusCode === 500 ? "Error interno del servidor" : error.message;
  return res.status(statusCode).json({ error: message });
};

const getRequesterId = (req) => req.user?.userId || req.user?.id;

const createTeam = async (req, res) => {
  try {
    const team = await teamsService.createTeam(getRequesterId(req), req.body);
    return res.status(201).json(team);
  } catch (error) {
    return handleError(res, error);
  }
};

const getTeamById = async (req, res) => {
  try {
    const team = await teamsService.getTeamById(req.params.id);
    return res.status(200).json(team);
  } catch (error) {
    return handleError(res, error);
  }
};

const addMember = async (req, res) => {
  try {
    const result = await teamsService.addMember(
      req.params.id,
      getRequesterId(req),
      req.body.userId,
    );
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

const removeMember = async (req, res) => {
  try {
    const result = await teamsService.removeMember(
      req.params.id,
      getRequesterId(req),
      req.params.userId,
    );
    return res.status(200).json(result);
  } catch (error) {
    return handleError(res, error);
  }
};

const getMyTeam = async (req, res) => {
  try {
    const team = await teamsService.getUserTeam(getRequesterId(req));
    return res.status(200).json(team);
  } catch (error) {
    return handleError(res, error);
  }
};

const updateTeam = async (req, res) => {
  try {
    const team = await teamsService.updateTeam(
      req.params.id,
      getRequesterId(req),
      req.user?.role,
      req.body,
    );
    return res.status(200).json(team);
  } catch (error) {
    return handleError(res, error);
  }
};

const createUploadUrl = async (req, res) => {
  try {
    const uploadData = await teamsService.createTeamUploadUrl(
      req.params.id,
      getRequesterId(req),
      req.user?.role,
      req.body,
    );
    return res.status(200).json(uploadData);
  } catch (error) {
    return handleError(res, error);
  }
};

const getTeamHistory = async (req, res) => {
  try {
    const history = await teamsService.getTeamTournamentHistory(req.params.id);
    return res.status(200).json(history);
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  createTeam,
  getTeamById,
  updateTeam,
  addMember,
  removeMember,
  getMyTeam,
  createUploadUrl,
  getTeamHistory,
};
