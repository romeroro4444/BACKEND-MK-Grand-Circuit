const authService = require("../services/auth.service");

const handleError = (res, error) => {
  const statusCode = error.statusCode || 500;
  const message =
    statusCode === 500 ? "Error interno del servidor" : error.message;
  return res.status(statusCode).json({ error: message });
};

const register = async (req, res) => {
  try {
    const user = await authService.register(req.body);
    return res.status(201).json(user);
  } catch (error) {
    return handleError(res, error);
  }
};

const registerAdmin = async (req, res) => {
  try {
    const user = await authService.registerAdmin({
      ...req.body,
      setupKey: req.headers["x-admin-setup-key"],
    });
    return res.status(201).json(user);
  } catch (error) {
    return handleError(res, error);
  }
};

const login = async (req, res) => {
  try {
    const data = await authService.login(req.body);
    return res.status(200).json(data);
  } catch (error) {
    return handleError(res, error);
  }
};

const updateProfile = async (req, res) => {
  try {
    const updatedUser = await authService.updateProfile(
      req.user?.userId,
      req.body,
    );
    return res.status(200).json(updatedUser);
  } catch (error) {
    return handleError(res, error);
  }
};

const getProfile = async (req, res) => {
  try {
    const profile = await authService.getProfile(req.user?.userId);
    return res.status(200).json(profile);
  } catch (error) {
    return handleError(res, error);
  }
};

const getProfileById = async (req, res) => {
  try {
    const profile = await authService.getProfileById(req.params.id);
    return res.status(200).json(profile);
  } catch (error) {
    return handleError(res, error);
  }
};

module.exports = {
  register,
  registerAdmin,
  login,
  updateProfile,
  getProfile,
  getProfileById,
};
