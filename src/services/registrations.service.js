const validator = require("validator");
const supabase = require("../config/supabase");

const ALLOWED_REGISTRATION_STATUSES = ["PENDING", "APPROVED", "REJECTED"];

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const mapRepositoryError = (error) => {
  if (error && error.code === "23505") {
    return createHttpError(409, "El equipo ya está inscrito en este torneo");
  }

  return error;
};

const getTournamentOrThrow = async (tournamentId) => {
  const { data, error } = await supabase
    .from("tournaments")
    .select("id, name, max_teams, status")
    .eq("id", tournamentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw createHttpError(404, "Torneo no encontrado");
  }

  return data;
};

const getTeamOrThrow = async (teamId) => {
  const { data, error } = await supabase
    .from("teams")
    .select("id, name")
    .eq("id", teamId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw createHttpError(404, "Equipo no encontrado");
  }

  return data;
};

const ensureOwnerMembership = async (teamId, requesterId) => {
  const { data, error } = await supabase
    .from("team_members")
    .select("id, role")
    .eq("team_id", teamId)
    .eq("user_id", requesterId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw createHttpError(403, "No perteneces a este equipo");
  }

  if (data.role !== "OWNER") {
    throw createHttpError(403, "Solo el OWNER puede inscribir el equipo");
  }
};

const getRegistrationOrThrow = async (registrationId) => {
  const { data, error } = await supabase
    .from("registrations")
    .select("id, team_id, tournament_id, status, created_at")
    .eq("id", registrationId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw createHttpError(404, "Inscripción no encontrada");
  }

  return data;
};

const registerTeam = async (requesterId, tournamentId, { teamId }) => {
  if (!requesterId) {
    throw createHttpError(401, "Usuario no autenticado");
  }

  if (!validator.isUUID(tournamentId)) {
    throw createHttpError(400, "El id del torneo no es válido");
  }

  if (!validator.isUUID(teamId || "")) {
    throw createHttpError(400, "El id del equipo no es válido");
  }

  const [tournament] = await Promise.all([
    getTournamentOrThrow(tournamentId),
    getTeamOrThrow(teamId),
    ensureOwnerMembership(teamId, requesterId),
  ]);

  if (tournament.status !== "OPEN") {
    throw createHttpError(409, "El torneo está cerrado para inscripciones");
  }

  const { data: existingRegistration, error: existingError } = await supabase
    .from("registrations")
    .select("id")
    .eq("team_id", teamId)
    .eq("tournament_id", tournamentId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (existingRegistration) {
    throw createHttpError(409, "El equipo ya está inscrito en este torneo");
  }

  try {
    const { data, error } = await supabase
      .from("registrations")
      .insert({
        team_id: teamId,
        tournament_id: tournamentId,
        status: "PENDING",
      })
      .select("id, team_id, tournament_id, status, created_at")
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    throw mapRepositoryError(error);
  }
};

const getTournamentRegistrations = async (tournamentId) => {
  if (!validator.isUUID(tournamentId)) {
    throw createHttpError(400, "El id del torneo no es válido");
  }

  await getTournamentOrThrow(tournamentId);

  const { data: registrations, error } = await supabase
    .from("registrations")
    .select("id, team_id, status")
    .eq("tournament_id", tournamentId)
    .order("created_at", { ascending: true });

  if (error) {
    throw error;
  }

  if (!registrations || registrations.length === 0) {
    return [];
  }

  const teamIds = registrations.map((registration) => registration.team_id);
  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("id, name")
    .in("id", teamIds);

  if (teamsError) {
    throw teamsError;
  }

  const teamMap = new Map((teams || []).map((team) => [team.id, team.name]));

  return registrations.map((registration) => ({
    id: registration.id,
    teamId: registration.team_id,
    team: teamMap.get(registration.team_id) || null,
    status: registration.status,
  }));
};

const updateRegistrationStatus = async (registrationId, status) => {
  if (!validator.isUUID(registrationId)) {
    throw createHttpError(400, "El id de inscripción no es válido");
  }

  const normalizedStatus = String(status || "")
    .trim()
    .toUpperCase();
  if (!ALLOWED_REGISTRATION_STATUSES.includes(normalizedStatus)) {
    throw createHttpError(400, "Estado de inscripción no válido");
  }

  const registration = await getRegistrationOrThrow(registrationId);
  const tournament = await getTournamentOrThrow(registration.tournament_id);

  if (normalizedStatus === "APPROVED") {
    const { count, error: countError } = await supabase
      .from("registrations")
      .select("id", { count: "exact", head: true })
      .eq("tournament_id", registration.tournament_id)
      .eq("status", "APPROVED");

    if (countError) {
      throw countError;
    }

    const approvedCount = Number(count || 0);
    const isAlreadyApproved = registration.status === "APPROVED";

    if (!isAlreadyApproved && approvedCount >= tournament.max_teams) {
      throw createHttpError(
        409,
        "El torneo alcanzó el máximo de equipos aprobados",
      );
    }
  }

  const { data, error } = await supabase
    .from("registrations")
    .update({ status: normalizedStatus })
    .eq("id", registrationId)
    .select("id, team_id, tournament_id, status, created_at")
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const approveRegistration = async (registrationId) =>
  updateRegistrationStatus(registrationId, "APPROVED");

const rejectRegistration = async (registrationId) =>
  updateRegistrationStatus(registrationId, "REJECTED");

module.exports = {
  registerTeam,
  getTournamentRegistrations,
  approveRegistration,
  rejectRegistration,
};
