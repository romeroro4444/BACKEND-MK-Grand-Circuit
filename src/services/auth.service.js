const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const validator = require("validator");
const {
  findUserById,
  findUserByEmail,
  findUserByUsername,
  createUser,
  updateUserById,
} = require("../repositories/auth.repository");

const JWT_EXPIRES_IN = "2h";
const SALT_ROUNDS = 10;

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const mapRepositoryError = (error) => {
  if (error && error.code === "23505") {
    return createHttpError(409, "El usuario ya existe");
  }

  return error;
};

const getJwtSecret = () => {
  if (!process.env.JWT_SECRET) {
    throw createHttpError(500, "JWT_SECRET no está configurado en el entorno");
  }
  return process.env.JWT_SECRET;
};

const register = async ({ username, email, password, role }) => {
  if (typeof role !== "undefined") {
    throw createHttpError(400, "No puedes definir role en este endpoint");
  }

  if (!username || !email || !password) {
    throw createHttpError(400, "username, email y password son obligatorios");
  }

  if (!validator.isEmail(email)) {
    throw createHttpError(400, "El email no es válido");
  }

  if (password.length < 6) {
    throw createHttpError(
      400,
      "La contraseña debe tener al menos 6 caracteres",
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = username.trim();

  if (!normalizedUsername) {
    throw createHttpError(400, "El username es obligatorio");
  }

  const [emailUser, usernameUser] = await Promise.all([
    findUserByEmail(normalizedEmail),
    findUserByUsername(normalizedUsername),
  ]);

  if (emailUser || usernameUser) {
    throw createHttpError(409, "El usuario ya existe");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    return await createUser({
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash,
      role: "USER",
    });
  } catch (error) {
    throw mapRepositoryError(error);
  }
};

const registerAdmin = async ({ username, email, password, setupKey, role }) => {
  if (typeof role !== "undefined") {
    throw createHttpError(400, "No puedes definir role manualmente");
  }

  if (!process.env.ADMIN_SETUP_KEY) {
    throw createHttpError(500, "ADMIN_SETUP_KEY no está configurado");
  }

  if (!setupKey || setupKey !== process.env.ADMIN_SETUP_KEY) {
    throw createHttpError(401, "Clave de configuración de admin inválida");
  }

  if (password && password.length < 10) {
    throw createHttpError(
      400,
      "La contraseña de admin debe tener al menos 10 caracteres",
    );
  }

  if (!username || !email || !password) {
    throw createHttpError(400, "username, email y password son obligatorios");
  }

  if (!validator.isEmail(email)) {
    throw createHttpError(400, "El email no es válido");
  }

  const normalizedEmail = email.trim().toLowerCase();
  const normalizedUsername = username.trim();

  if (!normalizedUsername) {
    throw createHttpError(400, "El username es obligatorio");
  }

  const [emailUser, usernameUser] = await Promise.all([
    findUserByEmail(normalizedEmail),
    findUserByUsername(normalizedUsername),
  ]);

  if (emailUser || usernameUser) {
    throw createHttpError(409, "El usuario ya existe");
  }

  const passwordHash = await bcrypt.hash(password, SALT_ROUNDS);

  try {
    return await createUser({
      username: normalizedUsername,
      email: normalizedEmail,
      passwordHash,
      role: "ADMIN",
    });
  } catch (error) {
    throw mapRepositoryError(error);
  }
};

const updateProfile = async (
  userId,
  { username, email, password, currentPassword, role },
) => {
  if (!userId) {
    throw createHttpError(401, "Usuario no autenticado");
  }

  if (typeof role !== "undefined") {
    throw createHttpError(400, "No está permitido modificar el role");
  }

  if (
    typeof username === "undefined" &&
    typeof email === "undefined" &&
    typeof password === "undefined"
  ) {
    throw createHttpError(
      400,
      "Debes enviar al menos un campo para actualizar",
    );
  }

  const existingUser = await findUserById(userId);

  if (!existingUser) {
    throw createHttpError(401, "Usuario no encontrado");
  }

  const updates = {};

  if (typeof username !== "undefined") {
    const normalizedUsername = String(username).trim();

    if (!normalizedUsername) {
      throw createHttpError(400, "El username no puede estar vacío");
    }

    const usernameUser = await findUserByUsername(normalizedUsername);
    if (usernameUser && usernameUser.id !== userId) {
      throw createHttpError(409, "El username ya está en uso");
    }

    updates.username = normalizedUsername;
  }

  if (typeof email !== "undefined") {
    const normalizedEmail = String(email).trim().toLowerCase();

    if (!validator.isEmail(normalizedEmail)) {
      throw createHttpError(400, "El email no es válido");
    }

    const emailUser = await findUserByEmail(normalizedEmail);
    if (emailUser && emailUser.id !== userId) {
      throw createHttpError(409, "El email ya está en uso");
    }

    updates.email = normalizedEmail;
  }

  if (typeof password !== "undefined") {
    if (String(password).length < 6) {
      throw createHttpError(
        400,
        "La contraseña debe tener al menos 6 caracteres",
      );
    }

    if (!currentPassword) {
      throw createHttpError(
        400,
        "Para cambiar contraseña debes enviar currentPassword",
      );
    }

    const currentPasswordMatch = await bcrypt.compare(
      currentPassword,
      existingUser.password_hash,
    );

    if (!currentPasswordMatch) {
      throw createHttpError(401, "La contraseña actual es incorrecta");
    }

    updates.password_hash = await bcrypt.hash(password, SALT_ROUNDS);
  }

  if (Object.keys(updates).length === 0) {
    throw createHttpError(400, "No hay cambios para aplicar");
  }

  try {
    const updatedUser = await updateUserById(userId, updates);

    if (!updatedUser) {
      throw createHttpError(404, "No se pudo actualizar el usuario");
    }

    return {
      id: updatedUser.id,
      username: updatedUser.username,
      email: updatedUser.email,
      role: updatedUser.role,
      created_at: updatedUser.created_at,
      updated_at: updatedUser.updated_at,
    };
  } catch (error) {
    throw mapRepositoryError(error);
  }
};

const getProfile = async (userId) => {
  if (!userId) {
    throw createHttpError(401, "Usuario no autenticado");
  }

  const user = await findUserById(userId);

  if (!user) {
    throw createHttpError(401, "Usuario no encontrado");
  }

  return {
    username: user.username,
    email: user.email,
  };
};

const getProfileById = async (userId) => {
  if (!validator.isUUID(userId)) {
    throw createHttpError(400, "El id de usuario no es válido");
  }

  const user = await findUserById(userId);

  if (!user) {
    throw createHttpError(404, "Usuario no encontrado");
  }

  return {
    username: user.username,
  };
};

const login = async ({ email, password }) => {
  if (!email || !password) {
    throw createHttpError(400, "email y password son obligatorios");
  }

  const normalizedEmail = email.trim().toLowerCase();

  if (!validator.isEmail(normalizedEmail)) {
    throw createHttpError(400, "El email no es válido");
  }

  const user = await findUserByEmail(normalizedEmail);

  if (!user) {
    throw createHttpError(401, "Credenciales inválidas");
  }

  const passwordMatch = await bcrypt.compare(password, user.password_hash);

  if (!passwordMatch) {
    throw createHttpError(401, "Credenciales inválidas");
  }

  const token = jwt.sign(
    {
      userId: user.id,
      role: user.role,
    },
    getJwtSecret(),
    { expiresIn: JWT_EXPIRES_IN },
  );

  return {
    token,
    user: {
      id: user.id,
      username: user.username,
      role: user.role,
    },
  };
};

module.exports = {
  register,
  registerAdmin,
  login,
  updateProfile,
  getProfile,
  getProfileById,
};
