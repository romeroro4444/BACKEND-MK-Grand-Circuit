const validator = require("validator");
const supabase = require("../config/supabase");

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

const getTournamentOrThrow = async (tournamentId) => {
  const { data, error } = await supabase
    .from("tournaments")
    .select("id, is_deleted")
    .eq("id", tournamentId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data || data.is_deleted) {
    throw createHttpError(404, "Torneo no encontrado");
  }

  return data;
};

const getRoundOrThrow = async (roundId) => {
  const { data, error } = await supabase
    .from("rounds")
    .select("id, tournament_id, name, order_index, is_deleted")
    .eq("id", roundId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data || data.is_deleted) {
    throw createHttpError(404, "Ronda no encontrada");
  }

  return data;
};

const createRound = async (tournamentId, { name, orderIndex }) => {
  if (!validator.isUUID(tournamentId)) {
    throw createHttpError(400, "El id del torneo no es válido");
  }

  const normalizedName = String(name || "").trim();
  const parsedOrder = Number(orderIndex);

  if (!normalizedName) {
    throw createHttpError(400, "El nombre de la ronda es obligatorio");
  }

  if (!Number.isInteger(parsedOrder) || parsedOrder < 1) {
    throw createHttpError(
      400,
      "orderIndex debe ser un entero mayor o igual a 1",
    );
  }

  await getTournamentOrThrow(tournamentId);

  const { data, error } = await supabase
    .from("rounds")
    .insert({
      tournament_id: tournamentId,
      name: normalizedName,
      order_index: parsedOrder,
      is_deleted: false,
    })
    .select("id, tournament_id, name, order_index, is_deleted, created_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw createHttpError(
        409,
        "Ya existe una ronda con ese orderIndex para el torneo",
      );
    }
    throw error;
  }

  return data;
};

const updateRound = async (roundId, { name, orderIndex }) => {
  if (!validator.isUUID(roundId)) {
    throw createHttpError(400, "El id de la ronda no es válido");
  }

  const round = await getRoundOrThrow(roundId);
  const updates = { updated_at: new Date().toISOString() };

  if (typeof name !== "undefined") {
    const normalizedName = String(name).trim();
    if (!normalizedName) {
      throw createHttpError(400, "El nombre de la ronda no puede estar vacío");
    }
    updates.name = normalizedName;
  }

  if (typeof orderIndex !== "undefined") {
    const parsedOrder = Number(orderIndex);
    if (!Number.isInteger(parsedOrder) || parsedOrder < 1) {
      throw createHttpError(
        400,
        "orderIndex debe ser un entero mayor o igual a 1",
      );
    }
    updates.order_index = parsedOrder;
  }

  if (Object.keys(updates).length === 1) {
    throw createHttpError(400, "No hay campos para actualizar");
  }

  const { data, error } = await supabase
    .from("rounds")
    .update(updates)
    .eq("id", round.id)
    .select("id, tournament_id, name, order_index, is_deleted, updated_at")
    .single();

  if (error) {
    if (error.code === "23505") {
      throw createHttpError(
        409,
        "Ya existe una ronda con ese orderIndex para el torneo",
      );
    }
    throw error;
  }

  return data;
};

const deleteRound = async (roundId) => {
  if (!validator.isUUID(roundId)) {
    throw createHttpError(400, "El id de la ronda no es válido");
  }

  await getRoundOrThrow(roundId);

  const { data, error } = await supabase
    .from("rounds")
    .update({ is_deleted: true, updated_at: new Date().toISOString() })
    .eq("id", roundId)
    .select("id, tournament_id, name, order_index, is_deleted")
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const assignMatchToRound = async (roundId, matchId) => {
  if (!validator.isUUID(roundId)) {
    throw createHttpError(400, "El id de la ronda no es válido");
  }

  if (!validator.isUUID(matchId)) {
    throw createHttpError(400, "El id del partido no es válido");
  }

  const round = await getRoundOrThrow(roundId);

  const { data: match, error: matchError } = await supabase
    .from("matches")
    .select("id, tournament_id")
    .eq("id", matchId)
    .maybeSingle();

  if (matchError) {
    throw matchError;
  }

  if (!match) {
    throw createHttpError(404, "Partido no encontrado");
  }

  if (match.tournament_id !== round.tournament_id) {
    throw createHttpError(
      409,
      "La ronda y el partido deben pertenecer al mismo torneo",
    );
  }

  const { data, error } = await supabase
    .from("matches")
    .update({ round_id: roundId, updated_at: new Date().toISOString() })
    .eq("id", matchId)
    .select("id, tournament_id, round_id")
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const getTournamentBracket = async (tournamentId) => {
  if (!validator.isUUID(tournamentId)) {
    throw createHttpError(400, "El id del torneo no es válido");
  }

  await getTournamentOrThrow(tournamentId);

  const [roundsResult, matchesResult] = await Promise.all([
    supabase
      .from("rounds")
      .select("id, name, order_index")
      .eq("tournament_id", tournamentId)
      .eq("is_deleted", false)
      .order("order_index", { ascending: true }),
    supabase
      .from("matches")
      .select(
        "id, round_id, team_a_id, team_b_id, score_a, score_b, status, winner_team_id, next_match_id, advance_slot, created_at",
      )
      .eq("tournament_id", tournamentId)
      .order("created_at", { ascending: true }),
  ]);

  if (roundsResult.error) {
    throw roundsResult.error;
  }

  if (matchesResult.error) {
    throw matchesResult.error;
  }

  const rounds = roundsResult.data || [];
  const matches = matchesResult.data || [];

  const teamIds = new Set();
  matches.forEach((match) => {
    if (match.team_a_id) teamIds.add(match.team_a_id);
    if (match.team_b_id) teamIds.add(match.team_b_id);
    if (match.winner_team_id) teamIds.add(match.winner_team_id);
  });

  let teamsMap = new Map();
  if (teamIds.size > 0) {
    const { data: teams, error: teamsError } = await supabase
      .from("teams")
      .select("id, name")
      .in("id", Array.from(teamIds));

    if (teamsError) {
      throw teamsError;
    }

    teamsMap = new Map((teams || []).map((team) => [team.id, team.name]));
  }

  const matchViews = matches.map((match) => ({
    id: match.id,
    roundId: match.round_id,
    teamAId: match.team_a_id,
    teamA: match.team_a_id ? teamsMap.get(match.team_a_id) || null : null,
    teamBId: match.team_b_id,
    teamB: match.team_b_id ? teamsMap.get(match.team_b_id) || null : null,
    scoreA: match.score_a,
    scoreB: match.score_b,
    status: match.status,
    winnerTeamId: match.winner_team_id,
    winnerTeam: match.winner_team_id
      ? teamsMap.get(match.winner_team_id) || null
      : null,
    nextMatchId: match.next_match_id,
    advanceSlot: match.advance_slot,
  }));

  return rounds.map((round) => ({
    id: round.id,
    name: round.name,
    orderIndex: round.order_index,
    matches: matchViews.filter((match) => match.roundId === round.id),
  }));
};

module.exports = {
  createRound,
  updateRound,
  deleteRound,
  assignMatchToRound,
  getTournamentBracket,
};
