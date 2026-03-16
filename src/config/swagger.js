const swaggerJSDoc = require("swagger-jsdoc");

const options = {
  definition: {
    openapi: "3.0.3",
    info: {
      title: "MK Grand Circuit API",
      version: "1.0.0",
      description: "Documentacion de endpoints.",
    },
    servers: [{ url: "/" }],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: "http",
          scheme: "bearer",
          bearerFormat: "JWT",
        },
        tokenHeader: {
          type: "apiKey",
          in: "header",
          name: "token",
        },
      },
      schemas: {
        ErrorResponse: {
          type: "object",
          properties: { error: { type: "string" } },
        },
        UserBasic: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            username: { type: "string" },
            email: { type: "string", format: "email" },
            role: { type: "string", enum: ["USER", "ADMIN"] },
          },
        },
        RegisterRequest: {
          type: "object",
          required: ["username", "email", "password"],
          properties: {
            username: { type: "string" },
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
        },
        RegisterAdminRequest: {
          type: "object",
          required: ["username", "email", "password"],
          properties: {
            username: { type: "string" },
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
        },
        LoginRequest: {
          type: "object",
          required: ["email", "password"],
          properties: {
            email: { type: "string", format: "email" },
            password: { type: "string" },
          },
        },
        LoginResponse: {
          type: "object",
          properties: {
            token: { type: "string" },
            user: {
              type: "object",
              properties: {
                id: { type: "string", format: "uuid" },
                username: { type: "string" },
                role: { type: "string", enum: ["USER", "ADMIN"] },
              },
            },
          },
        },
        UpdateProfileRequest: {
          type: "object",
          properties: {
            username: { type: "string" },
            email: { type: "string", format: "email" },
            currentPassword: { type: "string" },
            password: { type: "string" },
          },
        },
        TeamMember: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            username: { type: "string", nullable: true },
            role: { type: "string", enum: ["OWNER", "MEMBER"] },
          },
        },
        TeamResponse: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            tag: { type: "string", nullable: true },
            logoUrl: { type: "string", nullable: true },
            bannerUrl: { type: "string", nullable: true },
            description: { type: "string", nullable: true },
            socialLink: { type: "string", nullable: true },
            members: {
              type: "array",
              items: { $ref: "#/components/schemas/TeamMember" },
            },
          },
        },
        CreateTeamRequest: {
          type: "object",
          required: ["name", "tag"],
          properties: {
            name: { type: "string" },
            tag: { type: "string" },
            logoUrl: { type: "string", nullable: true },
            bannerUrl: { type: "string", nullable: true },
            description: { type: "string", nullable: true },
            socialLink: { type: "string", nullable: true },
          },
        },
        UpdateTeamRequest: {
          type: "object",
          properties: {
            name: { type: "string" },
            tag: { type: "string" },
            logoUrl: { type: "string", nullable: true },
            bannerUrl: { type: "string", nullable: true },
            description: { type: "string", nullable: true },
            socialLink: { type: "string", nullable: true },
          },
        },
        TeamUploadUrlRequest: {
          type: "object",
          required: ["type", "fileName"],
          properties: {
            type: { type: "string", enum: ["logo", "banner"] },
            fileName: { type: "string" },
          },
        },
        TeamUploadUrlResponse: {
          type: "object",
          properties: {
            bucket: { type: "string" },
            filePath: { type: "string" },
            signedUrl: { type: "string" },
            token: { type: "string" },
            publicUrl: { type: "string" },
          },
        },
        TeamHistoryItem: {
          type: "object",
          properties: {
            tournamentId: { type: "string", format: "uuid" },
            tournament: { type: "string" },
            tournamentStatus: { type: "string" },
            isFinished: { type: "boolean" },
            startedAt: { type: "string", format: "date-time", nullable: true },
            registrationStatus: {
              type: "string",
              enum: ["PENDING", "APPROVED", "REJECTED"],
              nullable: true,
            },
            stats: {
              type: "object",
              properties: {
                played: { type: "integer" },
                wins: { type: "integer" },
                losses: { type: "integer" },
              },
            },
          },
        },
        AddTeamMemberRequest: {
          type: "object",
          required: ["userId"],
          properties: {
            userId: { type: "string", format: "uuid" },
          },
        },
        TournamentResponse: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            banner_url: { type: "string", nullable: true },
            description: { type: "string", nullable: true },
            rules: { type: "string", nullable: true },
            format: { type: "string", nullable: true },
            max_teams: { type: "integer" },
            registration_open_at: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            start_at: { type: "string", format: "date-time", nullable: true },
            status: {
              type: "string",
              enum: ["OPEN", "CLOSED", "IN_PROGRESS", "FINISHED"],
            },
            is_finished: { type: "boolean" },
            is_deleted: { type: "boolean" },
            created_by: { type: "string", format: "uuid" },
            created_at: { type: "string", format: "date-time" },
            updated_at: { type: "string", format: "date-time", nullable: true },
          },
        },
        CreateTournamentRequest: {
          type: "object",
          required: ["name", "max_teams"],
          properties: {
            name: { type: "string" },
            banner_url: { type: "string", nullable: true },
            description: { type: "string", nullable: true },
            rules: { type: "string", nullable: true },
            format: { type: "string", nullable: true },
            max_teams: { type: "integer", minimum: 2 },
            registration_open_at: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            start_at: { type: "string", format: "date-time", nullable: true },
          },
        },
        UpdateTournamentRequest: {
          type: "object",
          properties: {
            name: { type: "string" },
            banner_url: { type: "string", nullable: true },
            description: { type: "string", nullable: true },
            rules: { type: "string", nullable: true },
            format: { type: "string", nullable: true },
            max_teams: { type: "integer", minimum: 2 },
            registration_open_at: {
              type: "string",
              format: "date-time",
              nullable: true,
            },
            start_at: { type: "string", format: "date-time", nullable: true },
          },
        },
        UpdateTournamentStatusRequest: {
          type: "object",
          required: ["status"],
          properties: {
            status: {
              type: "string",
              enum: ["OPEN", "CLOSED", "IN_PROGRESS", "FINISHED"],
            },
          },
        },
        RegisterTeamRequest: {
          type: "object",
          required: ["teamId"],
          properties: {
            teamId: { type: "string", format: "uuid" },
          },
        },
        RegistrationResponse: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            team_id: { type: "string", format: "uuid" },
            tournament_id: { type: "string", format: "uuid" },
            status: {
              type: "string",
              enum: ["PENDING", "APPROVED", "REJECTED"],
            },
            created_at: { type: "string", format: "date-time" },
          },
        },
        TournamentRegistrationView: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            teamId: { type: "string", format: "uuid" },
            team: { type: "string", nullable: true },
            status: {
              type: "string",
              enum: ["PENDING", "APPROVED", "REJECTED"],
            },
          },
        },
        MatchResponse: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            tournamentId: { type: "string", format: "uuid", nullable: true },
            roundId: { type: "string", format: "uuid", nullable: true },
            teamAId: { type: "string", format: "uuid", nullable: true },
            teamA: { type: "string", nullable: true },
            teamBId: { type: "string", format: "uuid", nullable: true },
            teamB: { type: "string", nullable: true },
            scoreA: { type: "integer" },
            scoreB: { type: "integer" },
            status: { type: "string", enum: ["PENDING", "PLAYED"] },
            winnerTeamId: { type: "string", format: "uuid", nullable: true },
            winnerTeam: { type: "string", nullable: true },
            nextMatchId: { type: "string", format: "uuid", nullable: true },
            advanceSlot: { type: "string", enum: ["A", "B"], nullable: true },
            createdAt: { type: "string", format: "date-time", nullable: true },
          },
        },
        CreateMatchRequest: {
          type: "object",
          required: ["tournamentId", "teamAId", "teamBId"],
          properties: {
            tournamentId: { type: "string", format: "uuid" },
            roundId: { type: "string", format: "uuid", nullable: true },
            teamAId: { type: "string", format: "uuid" },
            teamBId: { type: "string", format: "uuid" },
            nextMatchId: { type: "string", format: "uuid", nullable: true },
            advanceSlot: { type: "string", enum: ["A", "B"], nullable: true },
          },
        },
        UpdateMatchRequest: {
          type: "object",
          properties: {
            roundId: { type: "string", format: "uuid", nullable: true },
            teamAId: { type: "string", format: "uuid", nullable: true },
            teamBId: { type: "string", format: "uuid", nullable: true },
            nextMatchId: { type: "string", format: "uuid", nullable: true },
            advanceSlot: { type: "string", enum: ["A", "B"], nullable: true },
          },
        },
        UpdateMatchResultRequest: {
          type: "object",
          required: ["scoreA", "scoreB"],
          properties: {
            scoreA: { type: "integer", minimum: 0 },
            scoreB: { type: "integer", minimum: 0 },
          },
        },
        RoundResponse: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            tournament_id: { type: "string", format: "uuid" },
            name: { type: "string" },
            order_index: { type: "integer" },
            is_deleted: { type: "boolean" },
          },
        },
        CreateRoundRequest: {
          type: "object",
          required: ["name", "orderIndex"],
          properties: {
            name: { type: "string", example: "Semifinal" },
            orderIndex: { type: "integer", minimum: 1, example: 2 },
          },
        },
        UpdateRoundRequest: {
          type: "object",
          properties: {
            name: { type: "string" },
            orderIndex: { type: "integer", minimum: 1 },
          },
        },
        BracketRoundView: {
          type: "object",
          properties: {
            id: { type: "string", format: "uuid" },
            name: { type: "string" },
            orderIndex: { type: "integer" },
            matches: {
              type: "array",
              items: { $ref: "#/components/schemas/MatchResponse" },
            },
          },
        },
        TournamentPublicView: {
          type: "object",
          properties: {
            tournament: { $ref: "#/components/schemas/TournamentResponse" },
            teams: {
              type: "array",
              items: {
                type: "object",
                properties: {
                  teamId: { type: "string", format: "uuid" },
                  name: { type: "string", nullable: true },
                  tag: { type: "string", nullable: true },
                  logoUrl: { type: "string", nullable: true },
                },
              },
            },
            rounds: {
              type: "array",
              items: { $ref: "#/components/schemas/BracketRoundView" },
            },
            unassignedMatches: {
              type: "array",
              items: { $ref: "#/components/schemas/MatchResponse" },
            },
          },
        },
      },
    },
    paths: {
      "/": {
        get: {
          tags: ["Health"],
          summary: "Estado de API",
          responses: { 200: { description: "API activa" } },
        },
      },
      "/auth/register": {
        post: {
          tags: ["Auth"],
          summary: "Registro de usuario",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RegisterRequest" },
              },
            },
          },
          responses: {
            201: { description: "Usuario creado" },
            400: { description: "Error de validacion" },
            409: { description: "Usuario duplicado" },
          },
        },
      },
      "/auth/register-admin": {
        post: {
          tags: ["Auth"],
          summary: "Registro de administrador",
          parameters: [
            {
              name: "x-admin-setup-key",
              in: "header",
              required: true,
              schema: { type: "string" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RegisterAdminRequest" },
              },
            },
          },
          responses: {
            201: { description: "Admin creado" },
            401: { description: "Clave invalida" },
            409: { description: "Usuario duplicado (email o username)" },
          },
        },
      },
      "/auth/login": {
        post: {
          tags: ["Auth"],
          summary: "Login",
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/LoginRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "Login exitoso",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/LoginResponse" },
                },
              },
            },
            401: { description: "Credenciales invalidas" },
          },
        },
      },
      "/auth/me": {
        get: {
          tags: ["Auth"],
          summary: "Payload del token",
          security: [{ bearerAuth: [] }, { tokenHeader: [] }],
          responses: {
            200: { description: "OK" },
            401: { description: "No autorizado" },
          },
        },
      },
      "/auth/profile": {
        get: {
          tags: ["Auth"],
          summary: "Obtener perfil autenticado",
          security: [{ bearerAuth: [] }, { tokenHeader: [] }],
          responses: {
            200: { description: "Perfil" },
            401: { description: "No autorizado" },
          },
        },
      },
      "/auth/profile/{id}": {
        get: {
          tags: ["Auth"],
          summary: "Obtener perfil publico por id",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            200: { description: "Perfil" },
            400: { description: "Id invalido" },
            404: { description: "Usuario no encontrado" },
          },
        },
      },
      "/auth/profile-edit": {
        put: {
          tags: ["Auth"],
          summary: "Editar perfil",
          security: [{ bearerAuth: [] }, { tokenHeader: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateProfileRequest" },
              },
            },
          },
          responses: {
            200: { description: "Actualizado" },
            400: { description: "Error de validacion" },
            401: { description: "No autorizado" },
            409: { description: "Conflicto" },
          },
        },
      },
      "/teams": {
        post: {
          tags: ["Teams"],
          summary: "Crear equipo",
          security: [{ bearerAuth: [] }, { tokenHeader: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateTeamRequest" },
              },
            },
          },
          responses: {
            201: {
              description: "Equipo creado",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/TeamResponse" },
                },
              },
            },
            400: { description: "Datos invalidos" },
            401: { description: "No autorizado" },
            409: { description: "Conflicto" },
          },
        },
      },
      "/teams/my-team": {
        get: {
          tags: ["Teams"],
          summary: "Obtener mi equipo",
          security: [{ bearerAuth: [] }, { tokenHeader: [] }],
          responses: {
            200: {
              description: "Equipo",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/TeamResponse" },
                },
              },
            },
            401: { description: "No autorizado" },
            404: { description: "Sin equipo" },
          },
        },
      },
      "/teams/{id}": {
        get: {
          tags: ["Teams"],
          summary: "Obtener equipo por id",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            200: {
              description: "Equipo",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/TeamResponse" },
                },
              },
            },
            400: { description: "Id invalido" },
            404: { description: "No encontrado" },
          },
        },
        patch: {
          tags: ["Teams"],
          summary: "Editar equipo (OWNER o ADMIN)",
          security: [{ bearerAuth: [] }, { tokenHeader: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateTeamRequest" },
              },
            },
          },
          responses: {
            200: { description: "Equipo actualizado" },
            401: { description: "No autorizado" },
            403: { description: "Solo OWNER o ADMIN" },
            404: { description: "Equipo no encontrado" },
          },
        },
      },
      "/teams/{id}/history": {
        get: {
          tags: ["Teams"],
          summary: "Historial de torneos del equipo",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            200: {
              description: "Historial",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/TeamHistoryItem" },
                  },
                },
              },
            },
            400: { description: "Id invalido" },
            404: { description: "Equipo no encontrado" },
          },
        },
      },
      "/teams/{id}/upload-url": {
        post: {
          tags: ["Teams"],
          summary: "Generar URL firmada para subir logo/banner",
          security: [{ bearerAuth: [] }, { tokenHeader: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/TeamUploadUrlRequest" },
              },
            },
          },
          responses: {
            200: {
              description: "URL generada",
              content: {
                "application/json": {
                  schema: {
                    $ref: "#/components/schemas/TeamUploadUrlResponse",
                  },
                },
              },
            },
            401: { description: "No autorizado" },
            403: { description: "Solo OWNER o ADMIN" },
            404: { description: "Equipo no encontrado" },
          },
        },
      },
      "/teams/{id}/members": {
        post: {
          tags: ["Teams"],
          summary: "Agregar miembro",
          security: [{ bearerAuth: [] }, { tokenHeader: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/AddTeamMemberRequest" },
              },
            },
          },
          responses: {
            200: { description: "Miembro agregado" },
            401: { description: "No autorizado" },
            403: { description: "Solo OWNER" },
          },
        },
      },
      "/teams/{id}/members/{userId}": {
        delete: {
          tags: ["Teams"],
          summary: "Eliminar miembro",
          security: [{ bearerAuth: [] }, { tokenHeader: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
            {
              name: "userId",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            200: { description: "Miembro eliminado" },
            401: { description: "No autorizado" },
            403: { description: "Solo OWNER" },
          },
        },
      },
      "/tournaments": {
        post: {
          tags: ["Tournaments"],
          summary: "Crear torneo",
          security: [{ bearerAuth: [] }, { tokenHeader: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/CreateTournamentRequest",
                },
              },
            },
          },
          responses: {
            201: {
              description: "Torneo creado",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/TournamentResponse" },
                },
              },
            },
            401: { description: "No autorizado" },
            403: { description: "Solo ADMIN" },
          },
        },
        get: {
          tags: ["Tournaments"],
          summary: "Listar torneos no eliminados",
          responses: {
            200: {
              description: "Listado",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/TournamentResponse" },
                  },
                },
              },
            },
          },
        },
      },
      "/tournaments/{id}": {
        get: {
          tags: ["Tournaments"],
          summary: "Obtener torneo por id",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            200: {
              description: "Torneo",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/TournamentResponse" },
                },
              },
            },
            404: { description: "No encontrado" },
          },
        },
        patch: {
          tags: ["Tournaments"],
          summary: "Editar torneo (ADMIN)",
          security: [{ bearerAuth: [] }, { tokenHeader: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UpdateTournamentRequest",
                },
              },
            },
          },
          responses: {
            200: { description: "Actualizado" },
            401: { description: "No autorizado" },
            403: { description: "Solo ADMIN" },
          },
        },
        delete: {
          tags: ["Tournaments"],
          summary: "Eliminar logico torneo (ADMIN)",
          security: [{ bearerAuth: [] }, { tokenHeader: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            200: { description: "Marcado como eliminado" },
            401: { description: "No autorizado" },
            403: { description: "Solo ADMIN" },
          },
        },
      },
      "/tournaments/{id}/status": {
        patch: {
          tags: ["Tournaments"],
          summary: "Actualizar estado torneo (ADMIN)",
          security: [{ bearerAuth: [] }, { tokenHeader: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UpdateTournamentStatusRequest",
                },
              },
            },
          },
          responses: {
            200: { description: "Estado actualizado" },
            401: { description: "No autorizado" },
            403: { description: "Solo ADMIN" },
          },
        },
      },
      "/tournaments/{id}/public": {
        get: {
          tags: ["Tournaments"],
          summary: "Vista publica completa de torneo",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            200: {
              description: "Vista publica",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/TournamentPublicView" },
                },
              },
            },
            404: { description: "Torneo no encontrado" },
          },
        },
      },
      "/tournaments/{id}/register": {
        post: {
          tags: ["Registrations"],
          summary: "Inscribir equipo en torneo",
          security: [{ bearerAuth: [] }, { tokenHeader: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/RegisterTeamRequest" },
              },
            },
          },
          responses: {
            201: {
              description: "Inscripcion creada",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/RegistrationResponse" },
                },
              },
            },
            401: { description: "No autorizado" },
            403: { description: "Solo OWNER del equipo" },
          },
        },
      },
      "/tournaments/{id}/registrations": {
        get: {
          tags: ["Registrations"],
          summary: "Ver inscripciones del torneo",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            200: {
              description: "Listado",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: {
                      $ref: "#/components/schemas/TournamentRegistrationView",
                    },
                  },
                },
              },
            },
          },
        },
      },
      "/registrations/{id}/approve": {
        patch: {
          tags: ["Registrations"],
          summary: "Aprobar inscripcion (ADMIN)",
          security: [{ bearerAuth: [] }, { tokenHeader: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: { 200: { description: "Aprobada" } },
        },
      },
      "/registrations/{id}/reject": {
        patch: {
          tags: ["Registrations"],
          summary: "Rechazar inscripcion (ADMIN)",
          security: [{ bearerAuth: [] }, { tokenHeader: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: { 200: { description: "Rechazada" } },
        },
      },
      "/matches": {
        post: {
          tags: ["Matches"],
          summary: "Crear partido (ADMIN)",
          security: [{ bearerAuth: [] }, { tokenHeader: [] }],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateMatchRequest" },
              },
            },
          },
          responses: {
            201: {
              description: "Partido creado",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/MatchResponse" },
                },
              },
            },
          },
        },
      },
      "/matches/{id}": {
        patch: {
          tags: ["Matches"],
          summary: "Editar partido (ADMIN)",
          security: [{ bearerAuth: [] }, { tokenHeader: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateMatchRequest" },
              },
            },
          },
          responses: { 200: { description: "Partido actualizado" } },
        },
      },
      "/matches/{id}/result": {
        patch: {
          tags: ["Matches"],
          summary: "Registrar resultado (ADMIN)",
          security: [{ bearerAuth: [] }, { tokenHeader: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: {
                  $ref: "#/components/schemas/UpdateMatchResultRequest",
                },
              },
            },
          },
          responses: {
            200: {
              description: "Resultado actualizado",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/MatchResponse" },
                },
              },
            },
          },
        },
      },
      "/tournaments/{id}/matches": {
        get: {
          tags: ["Matches"],
          summary: "Listar partidos por torneo",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            200: {
              description: "Listado",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/MatchResponse" },
                  },
                },
              },
            },
          },
        },
      },
      "/tournaments/{tournamentId}/rounds": {
        post: {
          tags: ["Rounds"],
          summary: "Crear ronda manual (ADMIN)",
          security: [{ bearerAuth: [] }, { tokenHeader: [] }],
          parameters: [
            {
              name: "tournamentId",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/CreateRoundRequest" },
              },
            },
          },
          responses: {
            201: {
              description: "Ronda creada",
              content: {
                "application/json": {
                  schema: { $ref: "#/components/schemas/RoundResponse" },
                },
              },
            },
          },
        },
      },
      "/rounds/{id}": {
        patch: {
          tags: ["Rounds"],
          summary: "Editar ronda (ADMIN)",
          security: [{ bearerAuth: [] }, { tokenHeader: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          requestBody: {
            required: true,
            content: {
              "application/json": {
                schema: { $ref: "#/components/schemas/UpdateRoundRequest" },
              },
            },
          },
          responses: { 200: { description: "Ronda actualizada" } },
        },
        delete: {
          tags: ["Rounds"],
          summary: "Eliminar logico ronda (ADMIN)",
          security: [{ bearerAuth: [] }, { tokenHeader: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: { 200: { description: "Ronda eliminada" } },
        },
      },
      "/rounds/{id}/matches/{matchId}": {
        patch: {
          tags: ["Rounds"],
          summary: "Asignar partido a ronda (ADMIN)",
          security: [{ bearerAuth: [] }, { tokenHeader: [] }],
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
            {
              name: "matchId",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: { 200: { description: "Asignacion actualizada" } },
        },
      },
      "/tournaments/{id}/bracket": {
        get: {
          tags: ["Rounds"],
          summary: "Ver bracket estructurado por rondas",
          parameters: [
            {
              name: "id",
              in: "path",
              required: true,
              schema: { type: "string", format: "uuid" },
            },
          ],
          responses: {
            200: {
              description: "Bracket",
              content: {
                "application/json": {
                  schema: {
                    type: "array",
                    items: { $ref: "#/components/schemas/BracketRoundView" },
                  },
                },
              },
            },
          },
        },
      },
    },
  },
  apis: [],
};

const swaggerSpec = swaggerJSDoc(options);

module.exports = swaggerSpec;
