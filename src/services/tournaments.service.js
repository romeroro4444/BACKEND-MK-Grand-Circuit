const validator = require("validator");
const supabase = require("../config/supabase");

const ALLOWED_STATUSES = ["OPEN", "CLOSED", "IN_PROGRESS", "FINISHED"];

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const mapRepositoryError = (error) => {
  if (error && error.code === "23505") {
    return createHttpError(409, "Conflicto por dato duplicado");
  }

  return error;
};

const normalizeTournament = (row) => ({
  id: row.id,
  name: row.name,
  banner_url: row.banner_url,
  description: row.description,
  rules: row.rules,
  format: row.format,
  max_teams: row.max_teams,
  registration_open_at: row.registration_open_at,
  start_at: row.start_at,
  status: row.status,
  is_finished: row.is_finished,
  is_deleted: row.is_deleted,
  created_by: row.created_by,
  created_at: row.created_at,
  updated_at: row.updated_at,
});

const parseTimestamp = (value, fieldName) => {
  if (typeof value === "undefined" || value === null || value === "") {
    return null;
  }

  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    throw createHttpError(
      400,
      `${fieldName} no tiene un formato de fecha válido`,
    );
  }

  return date.toISOString();
};

const getTournamentOrThrow = async (id, includeDeleted = false) => {
  const { data, error } = await supabase
    .from("tournaments")
    .select(
      "id, name, banner_url, description, rules, format, max_teams, registration_open_at, start_at, status, is_finished, is_deleted, created_by, created_at, updated_at",
    )
    .eq("id", id)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw createHttpError(404, "Torneo no encontrado");
  }

  if (!includeDeleted && data.is_deleted) {
    throw createHttpError(404, "Torneo no encontrado");
  }

  return data;
};

const createTournament = async (
  requesterId,
  {
    name,
    banner_url,
    description,
    rules,
    format,
    max_teams,
    registration_open_at,
    start_at,
  },
) => {
  if (!requesterId) {
    throw createHttpError(401, "Usuario no autenticado");
  }

  const normalizedName = String(name || "").trim();
  if (!normalizedName) {
    throw createHttpError(400, "El nombre del torneo es obligatorio");
  }

  const parsedMaxTeams = Number(max_teams);
  if (!Number.isInteger(parsedMaxTeams) || parsedMaxTeams < 2) {
    throw createHttpError(
      400,
      "max_teams debe ser un entero mayor o igual a 2",
    );
  }

  const normalizedDescription =
    typeof description === "string" ? description.trim() : null;
  const normalizedRules = typeof rules === "string" ? rules.trim() : null;
  const normalizedFormat = typeof format === "string" ? format.trim() : null;

  const normalizedBannerUrl =
    typeof banner_url === "string" && banner_url.trim()
      ? banner_url.trim()
      : null;

  const registrationOpenAt = parseTimestamp(
    registration_open_at,
    "registration_open_at",
  );
  const startAt = parseTimestamp(start_at, "start_at");

  if (registrationOpenAt && startAt && registrationOpenAt > startAt) {
    throw createHttpError(
      400,
      "registration_open_at no puede ser mayor que start_at",
    );
  }

  try {
    const { data, error } = await supabase
      .from("tournaments")
      .insert({
        name: normalizedName,
        banner_url: normalizedBannerUrl,
        description: normalizedDescription,
        rules: normalizedRules,
        format: normalizedFormat,
        max_teams: parsedMaxTeams,
        registration_open_at: registrationOpenAt,
        start_at: startAt,
        status: "OPEN",
        is_finished: false,
        is_deleted: false,
        created_by: requesterId,
      })
      .select(
        "id, name, banner_url, description, rules, format, max_teams, registration_open_at, start_at, status, is_finished, is_deleted, created_by, created_at, updated_at",
      )
      .single();

    if (error) {
      throw error;
    }

    return normalizeTournament(data);
  } catch (error) {
    throw mapRepositoryError(error);
  }
};

const getAllTournaments = async () => {
  const { data, error } = await supabase
    .from("tournaments")
    .select(
      "id, name, banner_url, description, rules, format, max_teams, registration_open_at, start_at, status, is_finished, is_deleted, created_by, created_at, updated_at",
    )
    .eq("is_deleted", false)
    .order("created_at", { ascending: false });

  if (error) {
    throw error;
  }

  return (data || []).map(normalizeTournament);
};

const getTournamentById = async (id) => {
  if (!validator.isUUID(id)) {
    throw createHttpError(400, "El id del torneo no es válido");
  }

  const tournament = await getTournamentOrThrow(id, false);
  return normalizeTournament(tournament);
};

const updateTournamentStatus = async (id, status) => {
  if (!validator.isUUID(id)) {
    throw createHttpError(400, "El id del torneo no es válido");
  }

  const normalizedStatus = String(status || "")
    .trim()
    .toUpperCase();
  if (!ALLOWED_STATUSES.includes(normalizedStatus)) {
    throw createHttpError(
      400,
      "El estado debe ser OPEN, CLOSED, IN_PROGRESS o FINISHED",
    );
  }

  await getTournamentOrThrow(id, false);

  const { data, error } = await supabase
    .from("tournaments")
    .update({
      status: normalizedStatus,
      is_finished: normalizedStatus === "FINISHED",
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(
      "id, name, banner_url, description, rules, format, max_teams, registration_open_at, start_at, status, is_finished, is_deleted, created_by, created_at, updated_at",
    )
    .single();

  if (error) {
    throw error;
  }

  return normalizeTournament(data);
};

const updateTournament = async (id, payload) => {
  if (!validator.isUUID(id)) {
    throw createHttpError(400, "El id del torneo no es válido");
  }

  await getTournamentOrThrow(id, false);

  const updates = { updated_at: new Date().toISOString() };

  if (typeof payload.name !== "undefined") {
    const normalizedName = String(payload.name).trim();
    if (!normalizedName) {
      throw createHttpError(400, "El nombre del torneo no puede estar vacío");
    }
    updates.name = normalizedName;
  }

  if (typeof payload.banner_url !== "undefined") {
    updates.banner_url =
      typeof payload.banner_url === "string" && payload.banner_url.trim()
        ? payload.banner_url.trim()
        : null;
  }

  if (typeof payload.description !== "undefined") {
    updates.description =
      typeof payload.description === "string"
        ? payload.description.trim()
        : null;
  }

  if (typeof payload.rules !== "undefined") {
    updates.rules =
      typeof payload.rules === "string" ? payload.rules.trim() : null;
  }

  if (typeof payload.format !== "undefined") {
    updates.format =
      typeof payload.format === "string" ? payload.format.trim() : null;
  }

  if (typeof payload.max_teams !== "undefined") {
    const parsedMaxTeams = Number(payload.max_teams);
    if (!Number.isInteger(parsedMaxTeams) || parsedMaxTeams < 2) {
      throw createHttpError(
        400,
        "max_teams debe ser un entero mayor o igual a 2",
      );
    }
    updates.max_teams = parsedMaxTeams;
  }

  if (typeof payload.registration_open_at !== "undefined") {
    updates.registration_open_at = parseTimestamp(
      payload.registration_open_at,
      "registration_open_at",
    );
  }

  if (typeof payload.start_at !== "undefined") {
    updates.start_at = parseTimestamp(payload.start_at, "start_at");
  }

  if (
    updates.registration_open_at &&
    updates.start_at &&
    updates.registration_open_at > updates.start_at
  ) {
    throw createHttpError(
      400,
      "registration_open_at no puede ser mayor que start_at",
    );
  }

  if (Object.keys(updates).length === 1) {
    throw createHttpError(400, "No hay campos para actualizar");
  }

  const { data, error } = await supabase
    .from("tournaments")
    .update(updates)
    .eq("id", id)
    .select(
      "id, name, banner_url, description, rules, format, max_teams, registration_open_at, start_at, status, is_finished, is_deleted, created_by, created_at, updated_at",
    )
    .single();

  if (error) {
    throw error;
  }

  return normalizeTournament(data);
};

const softDeleteTournament = async (id) => {
  if (!validator.isUUID(id)) {
    throw createHttpError(400, "El id del torneo no es válido");
  }

  await getTournamentOrThrow(id, true);

  const { data, error } = await supabase
    .from("tournaments")
    .update({
      is_deleted: true,
      updated_at: new Date().toISOString(),
    })
    .eq("id", id)
    .select(
      "id, name, banner_url, description, rules, format, max_teams, registration_open_at, start_at, status, is_finished, is_deleted, created_by, created_at, updated_at",
    )
    .single();

  if (error) {
    throw error;
  }

  return normalizeTournament(data);
};

const getPublicTournamentView = async (id) => {
  if (!validator.isUUID(id)) {
    throw createHttpError(400, "El id del torneo no es válido");
  }

  const tournament = await getTournamentOrThrow(id, false);

  const [registrationsResult, roundsResult, matchesResult] = await Promise.all([
    supabase
      .from("registrations")
      .select("id, team_id, status")
      .eq("tournament_id", id)
      .eq("status", "APPROVED"),
    supabase
      .from("rounds")
      .select("id, name, order_index")
      .eq("tournament_id", id)
      .eq("is_deleted", false)
      .order("order_index", { ascending: true }),
    supabase
      .from("matches")
      .select(
        "id, round_id, team_a_id, team_b_id, score_a, score_b, status, winner_team_id, next_match_id, advance_slot, created_at",
      )
      .eq("tournament_id", id)
      .order("created_at", { ascending: true }),
  ]);

  if (registrationsResult.error) {
    throw registrationsResult.error;
  }
  if (roundsResult.error) {
    throw roundsResult.error;
  }
  if (matchesResult.error) {
    throw matchesResult.error;
  }

  const registrations = registrationsResult.data || [];
  const rounds = roundsResult.data || [];
  const matches = matchesResult.data || [];

  const teamIds = new Set();
  registrations.forEach((registration) => teamIds.add(registration.team_id));
  matches.forEach((match) => {
    if (match.team_a_id) teamIds.add(match.team_a_id);
    if (match.team_b_id) teamIds.add(match.team_b_id);
    if (match.winner_team_id) teamIds.add(match.winner_team_id);
  });

  let teamsMap = new Map();
  if (teamIds.size > 0) {
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, name, tag, logo_url")
      .in("id", Array.from(teamIds));

    if (teamsError) {
      throw teamsError;
    }

    teamsMap = new Map((teams || []).map((team) => [team.id, team]));
  }

  const registeredTeams = registrations.map((registration) => ({
    teamId: registration.team_id,
    name: teamsMap.get(registration.team_id)?.name || null,
    tag: teamsMap.get(registration.team_id)?.tag || null,
    logoUrl: teamsMap.get(registration.team_id)?.logo_url || null,
  }));

  const matchView = matches.map((match) => ({
    id: match.id,
    roundId: match.round_id,
    teamAId: match.team_a_id,
    teamA: match.team_a_id ? teamsMap.get(match.team_a_id)?.name || null : null,
    teamBId: match.team_b_id,
    teamB: match.team_b_id ? teamsMap.get(match.team_b_id)?.name || null : null,
    scoreA: match.score_a,
    scoreB: match.score_b,
    status: match.status,
    winnerTeamId: match.winner_team_id,
    winnerTeam: match.winner_team_id
      ? teamsMap.get(match.winner_team_id)?.name || null
      : null,
    nextMatchId: match.next_match_id,
    advanceSlot: match.advance_slot,
  }));

  const roundsWithMatches = rounds.map((round) => ({
    id: round.id,
    name: round.name,
    orderIndex: round.order_index,
    matches: matchView.filter((match) => match.roundId === round.id),
  }));

  const matchesWithoutRound = matchView.filter((match) => !match.roundId);

  return {
    tournament: normalizeTournament(tournament),
    teams: registeredTeams,
    rounds: roundsWithMatches,
    unassignedMatches: matchesWithoutRound,
  };
};

module.exports = {
  createTournament,
  getAllTournaments,
  getTournamentById,
  updateTournamentStatus,
  updateTournament,
  softDeleteTournament,
  getPublicTournamentView,
};
