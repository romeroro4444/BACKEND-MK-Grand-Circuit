CREATE TABLE IF NOT EXISTS registrations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  tournament_id UUID NOT NULL,
  status VARCHAR(20) DEFAULT 'PENDING',
  created_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_registration_team
    FOREIGN KEY (team_id)
    REFERENCES teams(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_registration_tournament
    FOREIGN KEY (tournament_id)
    REFERENCES tournaments(id)
    ON DELETE CASCADE,
  CONSTRAINT unique_team_tournament UNIQUE (team_id, tournament_id),
  CONSTRAINT registrations_status_check CHECK (status IN ('PENDING', 'APPROVED', 'REJECTED'))
);

CREATE INDEX IF NOT EXISTS idx_registrations_tournament
ON registrations(tournament_id);