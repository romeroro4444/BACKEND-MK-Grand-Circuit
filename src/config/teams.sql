CREATE TABLE IF NOT EXISTS teams (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(50) UNIQUE NOT NULL,
  tag VARCHAR(15) UNIQUE NOT NULL,
  logo_url TEXT,
  banner_url TEXT,
  description TEXT,
  social_links JSONB NOT NULL DEFAULT '[]'::jsonb,
  created_by UUID NOT NULL,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT teams_single_social_link_check CHECK (
    jsonb_typeof(social_links) = 'array'
    AND jsonb_array_length(social_links) <= 1
  ),
  CONSTRAINT fk_created_by
    FOREIGN KEY (created_by)
    REFERENCES users(id)
    ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS team_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  team_id UUID NOT NULL,
  user_id UUID NOT NULL,
  role VARCHAR(20) DEFAULT 'MEMBER',
  joined_at TIMESTAMP DEFAULT NOW(),
  CONSTRAINT fk_team
    FOREIGN KEY (team_id)
    REFERENCES teams(id)
    ON DELETE CASCADE,
  CONSTRAINT fk_user
    FOREIGN KEY (user_id)
    REFERENCES users(id)
    ON DELETE CASCADE,
  CONSTRAINT unique_user_team UNIQUE (user_id, team_id),
  CONSTRAINT team_members_role_check CHECK (role IN ('OWNER', 'MEMBER'))
);
