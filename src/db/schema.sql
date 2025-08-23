CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    name TEXT NOT NULL UNIQUE
);

CREATE TABLE IF NOT EXISTS team_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    name TEXT NOT NULL UNIQUE,
    team_id INTEGER,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin', 'manager')),
    team_id INTEGER,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
    team_member_id INTEGER DEFAULT NULL,
    FOREIGN KEY (team_member_id) REFERENCES team_members(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS topviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    first_time_approvals INTEGER NOT NULL,
    total_submissions INTEGER NOT NULL,
    team_member_id INTEGER NOT NULL,
    FOREIGN KEY (team_member_id) REFERENCES team_members(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX topviews_team_member_date_unique ON topviews(team_member_id, date);
CREATE INDEX idx_topviews_team_member_id ON topviews(team_member_id);

CREATE TABLE IF NOT EXISTS tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    tickets_awarded INTEGER NOT NULL,
    team_member_id INTEGER NOT NULL,
    FOREIGN KEY (team_member_id) REFERENCES team_members(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX tickets_team_member_date_unique ON tickets(team_member_id, date);
CREATE INDEX idx_tickets_team_member_id ON tickets(team_member_id);