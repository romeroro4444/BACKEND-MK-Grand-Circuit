const supabase = require("../config/supabase");
const { validate: isValidUUID } = require("uuid");

const createHttpError = (statusCode, message) => {
  const error = new Error(message);
  error.statusCode = statusCode;
  return error;
};

/**
 * Crea un partido entre dos equipos en un torneo
 * Solo ADMIN puede crear partidos
 *
 * Validaciones:
 * - Torneo existe
 * - Ambos equipos existen
 * - Equipos son diferentes
 * - Ambos equipos están inscritos y aprobados en el torneo
 *
 * @param {string} tournamentId - ID del torneo
 * @param {string} teamAId - ID del primer equipo
 * @param {string} teamBId - ID del segundo equipo
 * @returns {object} - Datos del partido creado
 */
async function createMatch(tournamentId, teamAId, teamBId) {
  // Validar UUIDs
  if (!isValidUUID(tournamentId)) {
    throw new Error("ID de torneo inválido");
  }
  if (!isValidUUID(teamAId)) {
    throw new Error("ID de equipo A inválido");
  }
  if (!isValidUUID(teamBId)) {
    throw new Error("ID de equipo B inválido");
  }

  // Validar que los equipos sean diferentes
  if (teamAId === teamBId) {
    throw new Error("No se puede crear un partido entre el mismo equipo");
  }

  // Verificar que el torneo existe
  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select("id, name")
    .eq("id", tournamentId)
    .single();

  if (tournamentError || !tournament) {
    throw new Error("Torneo no encontrado");
  }

  // Verificar que el equipo A existe
  const { data: teamA, error: teamAError } = await supabase
    .from("teams")
    .select("id, name")
    .eq("id", teamAId)
    .single();

  if (teamAError || !teamA) {
    throw new Error("Equipo A no encontrado");
  }

  // Verificar que el equipo B existe
  const { data: teamB, error: teamBError } = await supabase
    .from("teams")
    .select("id, name")
    .eq("id", teamBId)
    .single();

  if (teamBError || !teamB) {
    throw new Error("Equipo B no encontrado");
  }

  // Verificar que el equipo A está inscrito y aprobado en el torneo
  const { data: registrationA, error: regErrorA } = await supabase
    .from("registrations")
    .select("id, status")
    .eq("team_id", teamAId)
    .eq("tournament_id", tournamentId)
    .eq("status", "APPROVED")
    .single();

  if (regErrorA || !registrationA) {
    throw new Error(
      `El equipo ${teamA.name} no está inscrito o aprobado en este torneo`,
    );
  }

  // Verificar que el equipo B está inscrito y aprobado en el torneo
  const { data: registrationB, error: regErrorB } = await supabase
    .from("registrations")
    .select("id, status")
    .eq("team_id", teamBId)
    .eq("tournament_id", tournamentId)
    .eq("status", "APPROVED")
    .single();

  if (regErrorB || !registrationB) {
    throw new Error(
      `El equipo ${teamB.name} no está inscrito o aprobado en este torneo`,
    );
  }

  // Crear el partido
  const { data: match, error: matchError } = await supabase
    .from("matches")
    .insert([
      {
        tournament_id: tournamentId,
        team_a_id: teamAId,
        team_b_id: teamBId,
        score_a: 0,
        score_b: 0,
        status: "PENDING",
      },
    ])
    .select()
    .single();

  if (matchError) {
    console.error("Error al crear partido:", matchError);
    throw new Error("Error al crear el partido");
  }

  return {
    id: match.id,
    tournamentId: match.tournament_id,
    teamA: teamA.name,
    teamAId: match.team_a_id,
    teamB: teamB.name,
    teamBId: match.team_b_id,
    scoreA: match.score_a,
    scoreB: match.score_b,
    status: match.status,
    createdAt: match.created_at,
  };
}

async function createMatchExtended({
  tournamentId,
  teamAId,
  teamBId,
  roundId,
  nextMatchId,
  advanceSlot,
}) {
  if (!isValidUUID(tournamentId)) {
    throw createHttpError(400, "ID de torneo inválido");
  }

  if (!isValidUUID(teamAId || "") || !isValidUUID(teamBId || "")) {
    throw createHttpError(400, "IDs de equipos inválidos");
  }

  if (teamAId === teamBId) {
    throw createHttpError(
      400,
      "No se puede crear un partido entre el mismo equipo",
    );
  }

  if (roundId && !isValidUUID(roundId)) {
    throw createHttpError(400, "ID de ronda inválido");
  }

  if (nextMatchId && !isValidUUID(nextMatchId)) {
    throw createHttpError(400, "ID de nextMatch inválido");
  }

  const normalizedAdvanceSlot = advanceSlot
    ? String(advanceSlot).trim().toUpperCase()
    : null;

  if (normalizedAdvanceSlot && !["A", "B"].includes(normalizedAdvanceSlot)) {
    throw createHttpError(400, "advanceSlot debe ser A o B");
  }

  if (
    (normalizedAdvanceSlot && !nextMatchId) ||
    (!normalizedAdvanceSlot && nextMatchId)
  ) {
    throw createHttpError(
      400,
      "nextMatchId y advanceSlot deben enviarse juntos",
    );
  }

  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select("id, is_deleted")
    .eq("id", tournamentId)
    .maybeSingle();

  if (tournamentError) {
    throw tournamentError;
  }

  if (!tournament || tournament.is_deleted) {
    throw createHttpError(404, "Torneo no encontrado");
  }

  if (roundId) {
    const { data: round, error: roundError } = await supabase
      .from("rounds")
      .select("id, tournament_id, is_deleted")
      .eq("id", roundId)
      .maybeSingle();

    if (roundError) {
      throw roundError;
    }

    if (!round || round.is_deleted) {
      throw createHttpError(404, "Ronda no encontrada");
    }

    if (round.tournament_id !== tournamentId) {
      throw createHttpError(409, "La ronda debe pertenecer al mismo torneo");
    }
  }

  if (nextMatchId) {
    const { data: nextMatch, error: nextMatchError } = await supabase
      .from("matches")
      .select("id, tournament_id")
      .eq("id", nextMatchId)
      .maybeSingle();

    if (nextMatchError) {
      throw nextMatchError;
    }

    if (!nextMatch) {
      throw createHttpError(404, "Partido de avance no encontrado");
    }

    if (nextMatch.tournament_id !== tournamentId) {
      throw createHttpError(409, "nextMatch debe pertenecer al mismo torneo");
    }
  }

  const [teamAResult, teamBResult] = await Promise.all([
    supabase.from("teams").select("id, name").eq("id", teamAId).maybeSingle(),
    supabase.from("teams").select("id, name").eq("id", teamBId).maybeSingle(),
  ]);

  if (teamAResult.error || teamBResult.error) {
    throw teamAResult.error || teamBResult.error;
  }

  if (!teamAResult.data || !teamBResult.data) {
    throw createHttpError(404, "Los equipos del partido no fueron encontrados");
  }

  const [registrationA, registrationB] = await Promise.all([
    supabase
      .from("registrations")
      .select("id")
      .eq("team_id", teamAId)
      .eq("tournament_id", tournamentId)
      .eq("status", "APPROVED")
      .maybeSingle(),
    supabase
      .from("registrations")
      .select("id")
      .eq("team_id", teamBId)
      .eq("tournament_id", tournamentId)
      .eq("status", "APPROVED")
      .maybeSingle(),
  ]);

  if (registrationA.error || registrationB.error) {
    throw registrationA.error || registrationB.error;
  }

  if (!registrationA.data || !registrationB.data) {
    throw createHttpError(
      409,
      "Ambos equipos deben tener inscripción APPROVED en el torneo",
    );
  }

  const { data: match, error: createError } = await supabase
    .from("matches")
    .insert({
      tournament_id: tournamentId,
      round_id: roundId || null,
      team_a_id: teamAId,
      team_b_id: teamBId,
      next_match_id: nextMatchId || null,
      advance_slot: normalizedAdvanceSlot,
      score_a: 0,
      score_b: 0,
      status: "PENDING",
    })
    .select(
      "id, tournament_id, round_id, team_a_id, team_b_id, score_a, score_b, status, winner_team_id, next_match_id, advance_slot, created_at",
    )
    .single();

  if (createError) {
    throw createError;
  }

  return {
    id: match.id,
    tournamentId: match.tournament_id,
    roundId: match.round_id,
    teamAId: match.team_a_id,
    teamA: teamAResult.data.name,
    teamBId: match.team_b_id,
    teamB: teamBResult.data.name,
    scoreA: match.score_a,
    scoreB: match.score_b,
    status: match.status,
    winnerTeamId: match.winner_team_id,
    nextMatchId: match.next_match_id,
    advanceSlot: match.advance_slot,
    createdAt: match.created_at,
  };
}

/**
 * Obtiene todos los partidos de un torneo con nombres de equipos
 *
 * @param {string} tournamentId - ID del torneo
 * @returns {array} - Lista de partidos con información de equipos
 */
async function getTournamentMatches(tournamentId) {
  // Validar UUID
  if (!isValidUUID(tournamentId)) {
    throw new Error("ID de torneo inválido");
  }

  // Verificar que el torneo existe
  const { data: tournament, error: tournamentError } = await supabase
    .from("tournaments")
    .select("id, is_deleted")
    .eq("id", tournamentId)
    .single();

  if (tournamentError || !tournament || tournament.is_deleted) {
    throw new Error("Torneo no encontrado");
  }

  // Obtener partidos con nombres de equipos usando JOIN manual
  const { data: matches, error: matchesError } = await supabase
    .from("matches")
    .select(
      `
      id,
      tournament_id,
      round_id,
      team_a_id,
      team_b_id,
      score_a,
      score_b,
      status,
      winner_team_id,
      next_match_id,
      advance_slot,
      created_at
    `,
    )
    .eq("tournament_id", tournamentId)
    .order("created_at", { ascending: false });

  if (matchesError) {
    console.error("Error al obtener partidos:", matchesError);
    throw new Error("Error al obtener los partidos");
  }

  // Si no hay partidos, retornar array vacío
  if (!matches || matches.length === 0) {
    return [];
  }

  // Obtener información de todos los equipos involucrados
  const teamIds = new Set();
  matches.forEach((match) => {
    teamIds.add(match.team_a_id);
    teamIds.add(match.team_b_id);
    if (match.winner_team_id) {
      teamIds.add(match.winner_team_id);
    }
  });

  const { data: teams, error: teamsError } = await supabase
    .from("teams")
    .select("id, name")
    .in("id", Array.from(teamIds));

  if (teamsError) {
    console.error("Error al obtener equipos:", teamsError);
    throw new Error("Error al obtener información de los equipos");
  }

  // Crear un mapa de equipos para acceso rápido
  const teamsMap = {};
  teams.forEach((team) => {
    teamsMap[team.id] = team.name;
  });

  // Formatear respuesta con nombres de equipos
  return matches.map((match) => ({
    id: match.id,
    roundId: match.round_id,
    teamA: teamsMap[match.team_a_id] || "Equipo desconocido",
    teamAId: match.team_a_id,
    teamB: teamsMap[match.team_b_id] || "Equipo desconocido",
    teamBId: match.team_b_id,
    scoreA: match.score_a,
    scoreB: match.score_b,
    status: match.status,
    winnerTeamId: match.winner_team_id,
    winnerTeam: match.winner_team_id
      ? teamsMap[match.winner_team_id] || "Equipo desconocido"
      : null,
    nextMatchId: match.next_match_id,
    advanceSlot: match.advance_slot,
    createdAt: match.created_at,
  }));
}

async function updateMatch(matchId, payload) {
  if (!isValidUUID(matchId)) {
    throw createHttpError(400, "ID de partido inválido");
  }

  const { data: existingMatch, error: existingError } = await supabase
    .from("matches")
    .select("id, tournament_id, team_a_id, team_b_id, status")
    .eq("id", matchId)
    .maybeSingle();

  if (existingError) {
    throw existingError;
  }

  if (!existingMatch) {
    throw createHttpError(404, "Partido no encontrado");
  }

  const updates = { updated_at: new Date().toISOString() };

  if (Object.prototype.hasOwnProperty.call(payload, "teamAId")) {
    if (payload.teamAId && !isValidUUID(payload.teamAId)) {
      throw createHttpError(400, "ID de equipo A inválido");
    }
    updates.team_a_id = payload.teamAId || null;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "teamBId")) {
    if (payload.teamBId && !isValidUUID(payload.teamBId)) {
      throw createHttpError(400, "ID de equipo B inválido");
    }
    updates.team_b_id = payload.teamBId || null;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "roundId")) {
    if (payload.roundId && !isValidUUID(payload.roundId)) {
      throw createHttpError(400, "ID de ronda inválido");
    }
    updates.round_id = payload.roundId || null;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "nextMatchId")) {
    if (payload.nextMatchId && !isValidUUID(payload.nextMatchId)) {
      throw createHttpError(400, "ID de nextMatch inválido");
    }
    updates.next_match_id = payload.nextMatchId || null;
  }

  if (Object.prototype.hasOwnProperty.call(payload, "advanceSlot")) {
    if (payload.advanceSlot === null || payload.advanceSlot === "") {
      updates.advance_slot = null;
    } else {
      const normalizedSlot = String(payload.advanceSlot).trim().toUpperCase();
      if (!["A", "B"].includes(normalizedSlot)) {
        throw createHttpError(400, "advanceSlot debe ser A o B");
      }
      updates.advance_slot = normalizedSlot;
    }
  }

  const teamA = updates.team_a_id ?? existingMatch.team_a_id;
  const teamB = updates.team_b_id ?? existingMatch.team_b_id;

  if (teamA && teamB && teamA === teamB) {
    throw createHttpError(400, "Los equipos del partido deben ser distintos");
  }

  if (updates.next_match_id && !updates.advance_slot) {
    throw createHttpError(
      400,
      "advanceSlot es requerido cuando nextMatchId está presente",
    );
  }

  if (!updates.next_match_id && updates.advance_slot) {
    throw createHttpError(
      400,
      "nextMatchId es requerido cuando advanceSlot está presente",
    );
  }

  if (updates.round_id) {
    const { data: round, error: roundError } = await supabase
      .from("rounds")
      .select("id, tournament_id, is_deleted")
      .eq("id", updates.round_id)
      .maybeSingle();

    if (roundError) {
      throw roundError;
    }

    if (
      !round ||
      round.is_deleted ||
      round.tournament_id !== existingMatch.tournament_id
    ) {
      throw createHttpError(409, "La ronda no es válida para este torneo");
    }
  }

  if (updates.next_match_id) {
    const { data: nextMatch, error: nextMatchError } = await supabase
      .from("matches")
      .select("id, tournament_id")
      .eq("id", updates.next_match_id)
      .maybeSingle();

    if (nextMatchError) {
      throw nextMatchError;
    }

    if (!nextMatch || nextMatch.tournament_id !== existingMatch.tournament_id) {
      throw createHttpError(409, "nextMatch debe pertenecer al mismo torneo");
    }
  }

  if (Object.keys(updates).length === 1) {
    throw createHttpError(400, "No hay cambios para actualizar");
  }

  const { data, error } = await supabase
    .from("matches")
    .update(updates)
    .eq("id", matchId)
    .select(
      "id, tournament_id, round_id, team_a_id, team_b_id, score_a, score_b, status, winner_team_id, next_match_id, advance_slot, updated_at",
    )
    .single();

  if (error) {
    throw error;
  }

  return data;
}

/**
 * Actualiza el resultado de un partido
 * Solo ADMIN puede actualizar resultados
 *
 * @param {string} matchId - ID del partido
 * @param {number} scoreA - Puntos del equipo A
 * @param {number} scoreB - Puntos del equipo B
 * @returns {object} - Datos del partido actualizado
 */
async function updateMatchResult(matchId, scoreA, scoreB) {
  // Validar UUID
  if (!isValidUUID(matchId)) {
    throw new Error("ID de partido inválido");
  }

  // Validar que los puntajes sean números válidos
  if (typeof scoreA !== "number" || scoreA < 0) {
    throw new Error("Puntaje del equipo A inválido");
  }
  if (typeof scoreB !== "number" || scoreB < 0) {
    throw new Error("Puntaje del equipo B inválido");
  }

  // Verificar que el partido existe
  const { data: existingMatch, error: matchError } = await supabase
    .from("matches")
    .select("id, team_a_id, team_b_id, status, next_match_id, advance_slot")
    .eq("id", matchId)
    .single();

  if (matchError || !existingMatch) {
    throw new Error("Partido no encontrado");
  }

  if (!existingMatch.team_a_id || !existingMatch.team_b_id) {
    throw createHttpError(
      409,
      "El partido debe tener ambos equipos asignados antes de registrar resultado",
    );
  }

  if (scoreA === scoreB) {
    throw createHttpError(400, "No se permiten empates para definir avance");
  }

  const winnerTeamId =
    scoreA > scoreB ? existingMatch.team_a_id : existingMatch.team_b_id;

  // Actualizar el resultado y cambiar status a PLAYED
  const { data: updatedMatch, error: updateError } = await supabase
    .from("matches")
    .update({
      score_a: scoreA,
      score_b: scoreB,
      winner_team_id: winnerTeamId,
      status: "PLAYED",
      updated_at: new Date().toISOString(),
    })
    .eq("id", matchId)
    .select()
    .single();

  if (updateError) {
    console.error("Error al actualizar resultado:", updateError);
    throw new Error("Error al actualizar el resultado del partido");
  }

  if (existingMatch.next_match_id && existingMatch.advance_slot) {
    const slotField =
      existingMatch.advance_slot === "A" ? "team_a_id" : "team_b_id";

    const { error: advanceError } = await supabase
      .from("matches")
      .update({
        [slotField]: winnerTeamId,
        updated_at: new Date().toISOString(),
      })
      .eq("id", existingMatch.next_match_id);

    if (advanceError) {
      throw createHttpError(
        500,
        "No se pudo avanzar el ganador al siguiente partido",
      );
    }
  }

  // Obtener nombres de equipos para respuesta completa
  const { data: teamA } = await supabase
    .from("teams")
    .select("name")
    .eq("id", updatedMatch.team_a_id)
    .single();

  const { data: teamB } = await supabase
    .from("teams")
    .select("name")
    .eq("id", updatedMatch.team_b_id)
    .single();

  return {
    id: updatedMatch.id,
    teamA: teamA?.name || "Equipo desconocido",
    teamAId: updatedMatch.team_a_id,
    teamB: teamB?.name || "Equipo desconocido",
    teamBId: updatedMatch.team_b_id,
    scoreA: updatedMatch.score_a,
    scoreB: updatedMatch.score_b,
    status: updatedMatch.status,
    winnerTeamId: updatedMatch.winner_team_id,
    nextMatchId: updatedMatch.next_match_id,
    advanceSlot: updatedMatch.advance_slot,
  };
}

module.exports = {
  createMatch,
  createMatchExtended,
  getTournamentMatches,
  updateMatch,
  updateMatchResult,
};
