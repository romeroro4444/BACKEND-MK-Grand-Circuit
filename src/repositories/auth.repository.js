const supabase = require("../config/supabase");

const findUserByEmail = async (email) => {
  const { data, error } = await supabase
    .from("users")
    .select("id, username, email, password_hash, role")
    .eq("email", email)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
};

const findUserById = async (id) => {
  const { data, error } = await supabase
    .from("users")
    .select("id, username, email, password_hash, role")
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
};

const findUserByUsername = async (username) => {
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("username", username)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
};

const createUser = async ({ username, email, passwordHash, role = "USER" }) => {
  const { data, error } = await supabase
    .from("users")
    .insert({
      username,
      email,
      password_hash: passwordHash,
      role,
    })
    .select("id, username, email, role")
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const findAdminUser = async () => {
  const { data, error } = await supabase
    .from("users")
    .select("id, email")
    .eq("role", "ADMIN")
    .limit(1)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
};

const updateUserById = async (id, updates) => {
  const { data, error } = await supabase
    .from("users")
    .update({
      ...updates,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select("id, username, email, role, created_at, updated_at")
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
};

module.exports = {
  findUserById,
  findUserByEmail,
  findUserByUsername,
  createUser,
  findAdminUser,
  updateUserById,
};
