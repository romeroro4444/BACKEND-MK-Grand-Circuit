-- =====================================================
-- TABLA: matches
-- Descripcion: Almacena los partidos entre equipos en torneos
-- =====================================================

CREATE TABLE IF NOT EXISTS matches (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    tournament_id UUID NOT NULL,
    round_id UUID,
    team_a_id UUID,
    team_b_id UUID,
    score_a INT DEFAULT 0,
    score_b INT DEFAULT 0,
    winner_team_id UUID,
    next_match_id UUID,
    advance_slot VARCHAR(1),
    status VARCHAR(20) DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'PLAYED')),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),

    CONSTRAINT fk_match_tournament
        FOREIGN KEY (tournament_id)
        REFERENCES tournaments(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_match_round
        FOREIGN KEY (round_id)
        REFERENCES rounds(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_match_team_a
        FOREIGN KEY (team_a_id)
        REFERENCES teams(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_match_team_b
        FOREIGN KEY (team_b_id)
        REFERENCES teams(id)
        ON DELETE CASCADE,

    CONSTRAINT fk_match_winner_team
        FOREIGN KEY (winner_team_id)
        REFERENCES teams(id)
        ON DELETE SET NULL,

    CONSTRAINT fk_match_next_match
        FOREIGN KEY (next_match_id)
        REFERENCES matches(id)
        ON DELETE SET NULL,

    CONSTRAINT chk_different_teams
        CHECK (team_a_id IS NULL OR team_b_id IS NULL OR team_a_id != team_b_id),

    CONSTRAINT matches_advance_slot_check
        CHECK (advance_slot IN ('A', 'B') OR advance_slot IS NULL)
);

-- =====================================================
-- ÍNDICES PARA MEJOR RENDIMIENTO
-- INDICES PARA MEJOR RENDIMIENTO
-- =====================================================

-- Índice para buscar partidos de un torneo
CREATE INDEX idx_matches_tournament
ON matches(tournament_id);

CREATE INDEX IF NOT EXISTS idx_matches_round
ON matches(round_id);

CREATE INDEX IF NOT EXISTS idx_matches_next_match
ON matches(next_match_id);

-- =====================================================
-- NOTAS
-- =====================================================
-- status: 'PENDING' = partido no jugado, 'PLAYED' = resultado ingresado
-- score_a y score_b: puntos de cada equipo
-- winner_team_id: equipo ganador (se calcula al registrar resultado)
-- next_match_id + advance_slot: define avance manual del ganador al bracket
