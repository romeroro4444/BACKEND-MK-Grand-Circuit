const validator = require("validator");
const supabase = require("../config/supabase");
const TEAMS_BUCKET = process.env.SUPABASE_STORAGE_BUCKET_TEAMS || "team-assets";

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

const ensureUserExists = async (userId) => {
  const { data, error } = await supabase
    .from("users")
    .select("id")
    .eq("id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data) {
    throw createHttpError(404, "Usuario no encontrado");
  }
};

const ensureTeamExists = async (teamId) => {
  const { data, error } = await supabase
    .from("teams")
    .select(
      "id, name, tag, logo_url, banner_url, description, social_links, created_by, created_at, updated_at",
    )
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

const ensureOwner = async (teamId, requesterId) => {
  const { data, error } = await supabase
    .from("team_members")
    .select("id, role")
    .eq("team_id", teamId)
    .eq("user_id", requesterId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!data || data.role !== "OWNER") {
    throw createHttpError(403, "Solo el OWNER puede realizar esta acción");
  }
};

const ensureOwnerOrAdmin = async (teamId, requesterId, requesterRole) => {
  if (requesterRole === "ADMIN") {
    await ensureTeamExists(teamId);
    return;
  }

  await ensureOwner(teamId, requesterId);
};

const getMembershipByUser = async (userId) => {
  const { data, error } = await supabase
    .from("team_members")
    .select("id, team_id, user_id, role")
    .eq("user_id", userId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  return data || null;
};

const getTeamMembersView = async (teamId) => {
  const { data: memberships, error: membershipsError } = await supabase
    .from("team_members")
    .select("user_id, role")
    .eq("team_id", teamId);

  if (membershipsError) {
    throw membershipsError;
  }

  if (!memberships || memberships.length === 0) {
    return [];
  }

  const userIds = memberships.map((member) => member.user_id);
  const { data: users, error: usersError } = await supabase
    .from("users")
    .select("id, username")
    .in("id", userIds);

  if (usersError) {
    throw usersError;
  }

  const usersById = new Map(users.map((user) => [user.id, user]));

  return memberships.map((member) => ({
    id: member.user_id,
    username: usersById.get(member.user_id)?.username || null,
    role: member.role,
  }));
};

const createTeam = async (
  requesterId,
  { name, tag, description, logoUrl, bannerUrl, socialLink, socialLinks },
) => {
  if (!requesterId) {
    throw createHttpError(401, "Usuario no autenticado");
  }

  const normalizedName = String(name || "").trim();
  if (!normalizedName) {
    throw createHttpError(400, "El nombre del equipo es obligatorio");
  }

  if (normalizedName.length > 50) {
    throw createHttpError(
      400,
      "El nombre del equipo no puede exceder 50 caracteres",
    );
  }

  const normalizedDescription =
    typeof description === "string" ? description.trim() : null;

  const normalizedTag = String(tag || "")
    .trim()
    .toUpperCase();
  if (!normalizedTag) {
    throw createHttpError(400, "El tag del equipo es obligatorio");
  }
  if (normalizedTag.length > 15) {
    throw createHttpError(400, "El tag no puede exceder 15 caracteres");
  }

  const normalizedLogoUrl =
    typeof logoUrl === "string" && logoUrl.trim() ? logoUrl.trim() : null;

  const normalizedBannerUrl =
    typeof bannerUrl === "string" && bannerUrl.trim() ? bannerUrl.trim() : null;

  let normalizedSocialLink = null;
  if (typeof socialLink !== "undefined") {
    normalizedSocialLink =
      typeof socialLink === "string" && socialLink.trim().length > 0
        ? socialLink.trim()
        : null;
  } else if (Array.isArray(socialLinks)) {
    const firstLink = socialLinks.find(
      (link) => typeof link === "string" && link.trim().length > 0,
    );
    normalizedSocialLink = firstLink ? firstLink.trim() : null;
  }

  const [existingTeam, existingTag, existingMembership] = await Promise.all([
    supabase
      .from("teams")
      .select("id")
      .eq("name", normalizedName)
      .maybeSingle(),
    supabase.from("teams").select("id").eq("tag", normalizedTag).maybeSingle(),
    getMembershipByUser(requesterId),
  ]);

  if (existingTeam.error) {
    throw existingTeam.error;
  }

  if (existingTeam.data) {
    throw createHttpError(409, "Ya existe un equipo con ese nombre");
  }

  if (existingTag.error) {
    throw existingTag.error;
  }

  if (existingTag.data) {
    throw createHttpError(409, "Ya existe un equipo con ese tag");
  }

  if (existingMembership) {
    throw createHttpError(409, "El usuario ya pertenece a un equipo");
  }

  try {
    const { data: team, error: teamError } = await supabase
      .from("teams")
      .insert({
        name: normalizedName,
        tag: normalizedTag,
        logo_url: normalizedLogoUrl,
        banner_url: normalizedBannerUrl,
        description: normalizedDescription,
        social_links: normalizedSocialLink ? [normalizedSocialLink] : [],
        created_by: requesterId,
      })
      .select(
        "id, name, tag, logo_url, banner_url, description, social_links, created_by, created_at, updated_at",
      )
      .single();

    if (teamError) {
      throw teamError;
    }

    const { error: memberError } = await supabase.from("team_members").insert({
      team_id: team.id,
      user_id: requesterId,
      role: "OWNER",
    });

    if (memberError) {
      await supabase.from("teams").delete().eq("id", team.id);
      throw memberError;
    }

    return {
      ...team,
      members: [
        {
          id: requesterId,
          role: "OWNER",
        },
      ],
    };
  } catch (error) {
    throw mapRepositoryError(error);
  }
};

const getTeamById = async (teamId) => {
  if (!validator.isUUID(teamId)) {
    throw createHttpError(400, "El id del equipo no es válido");
  }

  const team = await ensureTeamExists(teamId);
  const members = await getTeamMembersView(team.id);

  return {
    id: team.id,
    name: team.name,
    tag: team.tag,
    logoUrl: team.logo_url,
    bannerUrl: team.banner_url,
    description: team.description,
    socialLink:
      Array.isArray(team.social_links) && team.social_links.length > 0
        ? team.social_links[0]
        : null,
    members,
  };
};

const updateTeam = async (
  teamId,
  requesterId,
  requesterRole,
  { name, tag, description, logoUrl, bannerUrl, socialLink, socialLinks },
) => {
  if (!requesterId) {
    throw createHttpError(401, "Usuario no autenticado");
  }

  if (!validator.isUUID(teamId)) {
    throw createHttpError(400, "El id del equipo no es válido");
  }

  await ensureOwnerOrAdmin(teamId, requesterId, requesterRole);

  const existingTeam = await ensureTeamExists(teamId);
  const updates = { updated_at: new Date().toISOString() };

  if (typeof name !== "undefined") {
    const normalizedName = String(name).trim();
    if (!normalizedName) {
      throw createHttpError(400, "El nombre del equipo no puede estar vacío");
    }

    const { data: duplicated, error } = await supabase
      .from("teams")
      .select("id")
      .eq("name", normalizedName)
      .neq("id", teamId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (duplicated) {
      throw createHttpError(409, "Ya existe un equipo con ese nombre");
    }

    updates.name = normalizedName;
  }

  if (typeof tag !== "undefined") {
    const normalizedTag = String(tag).trim().toUpperCase();
    if (!normalizedTag) {
      throw createHttpError(400, "El tag del equipo no puede estar vacío");
    }

    const { data: duplicatedTag, error } = await supabase
      .from("teams")
      .select("id")
      .eq("tag", normalizedTag)
      .neq("id", teamId)
      .maybeSingle();

    if (error) {
      throw error;
    }

    if (duplicatedTag) {
      throw createHttpError(409, "Ya existe un equipo con ese tag");
    }

    updates.tag = normalizedTag;
  }

  if (typeof description !== "undefined") {
    updates.description =
      typeof description === "string" ? description.trim() : null;
  }

  if (typeof logoUrl !== "undefined") {
    updates.logo_url =
      typeof logoUrl === "string" && logoUrl.trim() ? logoUrl.trim() : null;
  }

  if (typeof bannerUrl !== "undefined") {
    updates.banner_url =
      typeof bannerUrl === "string" && bannerUrl.trim()
        ? bannerUrl.trim()
        : null;
  }

  if (typeof socialLink !== "undefined") {
    updates.social_links =
      typeof socialLink === "string" && socialLink.trim().length > 0
        ? [socialLink.trim()]
        : [];
  } else if (typeof socialLinks !== "undefined") {
    if (!Array.isArray(socialLinks)) {
      throw createHttpError(400, "socialLinks debe ser un arreglo");
    }
    const firstLink = socialLinks.find(
      (link) => typeof link === "string" && link.trim().length > 0,
    );
    updates.social_links = firstLink ? [firstLink.trim()] : [];
  }

  if (Object.keys(updates).length === 1) {
    return {
      id: existingTeam.id,
      name: existingTeam.name,
      tag: existingTeam.tag,
      logoUrl: existingTeam.logo_url,
      bannerUrl: existingTeam.banner_url,
      description: existingTeam.description,
      socialLink:
        Array.isArray(existingTeam.social_links) &&
        existingTeam.social_links.length > 0
          ? existingTeam.social_links[0]
          : null,
      message: "No hay cambios para aplicar",
    };
  }

  const { data, error } = await supabase
    .from("teams")
    .update(updates)
    .eq("id", teamId)
    .select(
      "id, name, tag, logo_url, banner_url, description, social_links, updated_at",
    )
    .single();

  if (error) {
    throw mapRepositoryError(error);
  }

  return {
    id: data.id,
    name: data.name,
    tag: data.tag,
    logoUrl: data.logo_url,
    bannerUrl: data.banner_url,
    description: data.description,
    socialLink:
      Array.isArray(data.social_links) && data.social_links.length > 0
        ? data.social_links[0]
        : null,
    updatedAt: data.updated_at,
  };
};

const createTeamUploadUrl = async (
  teamId,
  requesterId,
  requesterRole,
  { type, fileName },
) => {
  if (!requesterId) {
    throw createHttpError(401, "Usuario no autenticado");
  }

  if (!validator.isUUID(teamId)) {
    throw createHttpError(400, "El id del equipo no es válido");
  }

  await ensureOwnerOrAdmin(teamId, requesterId, requesterRole);
  await ensureTeamExists(teamId);

  const normalizedType = String(type || "")
    .trim()
    .toLowerCase();
  if (!["logo", "banner"].includes(normalizedType)) {
    throw createHttpError(400, "type debe ser logo o banner");
  }

  const normalizedFileName = String(fileName || "").trim();
  if (!normalizedFileName) {
    throw createHttpError(400, "fileName es obligatorio");
  }

  const safeFileName = normalizedFileName.replace(/[^a-zA-Z0-9._-]/g, "_");
  const filePath = `${teamId}/${normalizedType}-${Date.now()}-${safeFileName}`;

  const { data, error } = await supabase.storage
    .from(TEAMS_BUCKET)
    .createSignedUploadUrl(filePath);

  if (error) {
    throw createHttpError(
      500,
      `No se pudo generar URL de subida para bucket ${TEAMS_BUCKET}`,
    );
  }

  const { data: publicData } = supabase.storage
    .from(TEAMS_BUCKET)
    .getPublicUrl(filePath);

  return {
    bucket: TEAMS_BUCKET,
    filePath,
    signedUrl: data.signedUrl,
    token: data.token,
    publicUrl: publicData.publicUrl,
  };
};

const getTeamTournamentHistory = async (teamId) => {
  if (!validator.isUUID(teamId)) {
    throw createHttpError(400, "El id del equipo no es válido");
  }

  await ensureTeamExists(teamId);

  const { data: registrations, error: regError } = await supabase
    .from("registrations")
    .select("tournament_id, status, created_at")
    .eq("team_id", teamId);

  if (regError) {
    throw regError;
  }

  if (!registrations || registrations.length === 0) {
    return [];
  }

  const tournamentIds = registrations.map(
    (registration) => registration.tournament_id,
  );
  const { data: tournaments, error: tournamentsError } = await supabase
    .from("tournaments")
    .select("id, name, status, is_finished, start_at")
    .in("id", tournamentIds)
    .eq("is_deleted", false);

  if (tournamentsError) {
    throw tournamentsError;
  }

  const { data: playedMatches, error: matchesError } = await supabase
    .from("matches")
    .select("id, tournament_id, team_a_id, team_b_id, winner_team_id, status")
    .eq("status", "PLAYED")
    .or(`team_a_id.eq.${teamId},team_b_id.eq.${teamId}`);

  if (matchesError) {
    throw matchesError;
  }

  const statsByTournament = new Map();
  (playedMatches || []).forEach((match) => {
    const current = statsByTournament.get(match.tournament_id) || {
      played: 0,
      wins: 0,
      losses: 0,
    };

    current.played += 1;
    if (match.winner_team_id === teamId) {
      current.wins += 1;
    } else {
      current.losses += 1;
    }

    statsByTournament.set(match.tournament_id, current);
  });

  const registrationMap = new Map(
    registrations.map((registration) => [
      registration.tournament_id,
      registration,
    ]),
  );

  return (tournaments || []).map((tournament) => ({
    tournamentId: tournament.id,
    tournament: tournament.name,
    tournamentStatus: tournament.status,
    isFinished: tournament.is_finished,
    startedAt: tournament.start_at,
    registrationStatus: registrationMap.get(tournament.id)?.status || null,
    stats: statsByTournament.get(tournament.id) || {
      played: 0,
      wins: 0,
      losses: 0,
    },
  }));
};

const addMember = async (teamId, requesterId, memberUserId) => {
  if (!requesterId) {
    throw createHttpError(401, "Usuario no autenticado");
  }

  if (!validator.isUUID(teamId)) {
    throw createHttpError(400, "El id del equipo no es válido");
  }

  if (!validator.isUUID(memberUserId)) {
    throw createHttpError(400, "El id del usuario no es válido");
  }

  await ensureTeamExists(teamId);
  await ensureOwner(teamId, requesterId);
  await ensureUserExists(memberUserId);

  const existingMembership = await getMembershipByUser(memberUserId);
  if (existingMembership) {
    throw createHttpError(409, "El usuario ya pertenece a un equipo");
  }

  try {
    const { error } = await supabase.from("team_members").insert({
      team_id: teamId,
      user_id: memberUserId,
      role: "MEMBER",
    });

    if (error) {
      throw error;
    }

    return { message: "Miembro agregado correctamente" };
  } catch (error) {
    throw mapRepositoryError(error);
  }
};

const removeMember = async (teamId, requesterId, memberUserId) => {
  if (!requesterId) {
    throw createHttpError(401, "Usuario no autenticado");
  }

  if (!validator.isUUID(teamId)) {
    throw createHttpError(400, "El id del equipo no es válido");
  }

  if (!validator.isUUID(memberUserId)) {
    throw createHttpError(400, "El id del usuario no es válido");
  }

  await ensureTeamExists(teamId);
  await ensureOwner(teamId, requesterId);

  const { data: membership, error } = await supabase
    .from("team_members")
    .select("id, role")
    .eq("team_id", teamId)
    .eq("user_id", memberUserId)
    .maybeSingle();

  if (error) {
    throw error;
  }

  if (!membership) {
    throw createHttpError(404, "El usuario no pertenece a este equipo");
  }

  if (membership.role === "OWNER") {
    throw createHttpError(400, "No puedes eliminar al OWNER del equipo");
  }

  const { error: deleteError } = await supabase
    .from("team_members")
    .delete()
    .eq("id", membership.id);

  if (deleteError) {
    throw deleteError;
  }

  return { message: "Miembro eliminado correctamente" };
};

const getUserTeam = async (userId) => {
  if (!userId) {
    throw createHttpError(401, "Usuario no autenticado");
  }

  const membership = await getMembershipByUser(userId);
  if (!membership) {
    throw createHttpError(404, "El usuario no pertenece a un equipo");
  }

  return getTeamById(membership.team_id);
};

module.exports = {
  createTeam,
  getTeamById,
  updateTeam,
  addMember,
  removeMember,
  getUserTeam,
  createTeamUploadUrl,
  getTeamTournamentHistory,
};
