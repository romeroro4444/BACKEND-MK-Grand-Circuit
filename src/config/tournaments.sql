CREATE TABLE IF NOT EXISTS tournaments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) NOT NULL,
  banner_url TEXT,
  description TEXT,
  rules TEXT,
  format VARCHAR(30),
  max_teams INT NOT NULL,
  registration_open_at TIMESTAMP,
  start_at TIMESTAMP,
  status VARCHAR(20) DEFAULT 'OPEN',
  is_finished BOOLEAN DEFAULT FALSE,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_tournament_creator
    FOREIGN KEY (created_by)
    REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT tournaments_status_check CHECK (status IN ('OPEN', 'CLOSED', 'IN_PROGRESS', 'FINISHED')),
  CONSTRAINT tournaments_max_teams_check CHECK (max_teams >= 2)
);

CREATE INDEX IF NOT EXISTS idx_tournaments_not_deleted
ON tournaments(is_deleted);