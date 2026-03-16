CREATE TABLE IF NOT EXISTS rounds (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  tournament_id UUID NOT NULL,
  name VARCHAR(60) NOT NULL,
  order_index INT NOT NULL,
  is_deleted BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_round_tournament
    FOREIGN KEY (tournament_id)
    REFERENCES tournaments(id)
    ON DELETE CASCADE,
  CONSTRAINT rounds_order_positive_check CHECK (order_index >= 1),
  CONSTRAINT unique_round_order_per_tournament UNIQUE (tournament_id, order_index)
);

CREATE INDEX IF NOT EXISTS idx_rounds_tournament
ON rounds(tournament_id);
