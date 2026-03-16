const registrationsService = require("../services/registrations.service");

const handleError = (res, error) => {
  const statusCode = error.statusCode || 500;
  const message =
    statusCode === 500 ? "Error interno del servidor" : error.message;
  return res.status(statusCode).json({ error: message });
};

const getRequesterId = (req) => req.user?.userId || req.user?.id;

const registerTeam = async (req, res) => {
  try {
    const registration = await registrationsService.registerTeam(
      getRequesterId(req),
      req.params.id,
      req.body,
    );
    return res.status(201).json(registration);
  } catch (error) {
    return handleError(res, error);
  }
};

const getTournamentRegistrations = async (req, res) => {
  try {
    const registrations = await registrationsService.getTournamentRegistrations(
      req.params.id,
    );
    return res.status(200).json(registrations);
  } catch (error) {
    return handleError(res, error);
  }
};

const approveRegistration = async (req, res) => {
  try {
    const registration = await registrationsService.approveRegistration(
      req.params.id,
    );
    return res.status(200).json(registration);
  } catch (error) {
    return handleError(res, error);
  }
};

const rejectRegistration = async (req, res) => {
  try {
    const registration = await registrationsService.rejectRegistration(
      req.params.id,
    );
    return res.status(200).json(registration);
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  registerTeam,
  getTournamentRegistrations,
  approveRegistration,
  rejectRegistration,
};
