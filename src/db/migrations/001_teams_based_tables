CREATE TABLE IF NOT EXISTS teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    name TEXT NOT NULL UNIQUE,
    type TEXT DEFAULT 'ticket_only' CHECK(type IN ('ticket_and_total', 'ticket_only'))
);

CREATE TABLE IF NOT EXISTS team_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    name TEXT NOT NULL UNIQUE,
    team_id INTEGER,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS users_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin', 'manager')),
    team_id INTEGER,
    team_member_id INTEGER DEFAULT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
    FOREIGN KEY (team_member_id) REFERENCES team_members(id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS work_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    tickets_awarded INTEGER NOT NULL,    
    work_items INTEGER,
    team_member_id INTEGER NOT NULL,
    FOREIGN KEY (team_member_id) REFERENCES team_members(id) ON DELETE CASCADE,
    UNIQUE(team_member_id, date)
);

CREATE TABLE IF NOT EXISTS bonus_tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    tickets_awarded INTEGER NOT NULL,
    team_member_id INTEGER NOT NULL,
    manager_id INTEGER NOT NULL,
    FOREIGN KEY (team_member_id) REFERENCES team_members(id) ON DELETE CASCADE,
    FOREIGN KEY (manager_id) REFERENCES users_new(id) ON DELETE SET NULL
);

INSERT INTO teams (name, type) VALUES ('Project Management', 'ticket_and_total');

INSERT INTO team_members (name, team_id)
    SELECT name, (SELECT id FROM teams WHERE name = 'Project Management')
    FROM projectCoordinators;

INSERT INTO users_new (username, password, role, team_id, team_member_id)
SELECT 
    u.username,
    u.password,
    u.role,
    null,
    null
FROM users u;

INSERT INTO work_items (date, tickets_awarded, work_items, team_member_id)
SELECT 
    topviews.date,
    topviews.firstTimeApprovals,
    topviews.totalSubmissions,
    (SELECT team_members.id 
     FROM team_members
     JOIN projectCoordinators ON projectCoordinators.id = topviews.projectCoordinatorId
     WHERE team_members.name = projectCoordinators.name)
FROM topviews;

DROP TABLE topviews;
DROP TABLE projectCoordinators;
DROP TABLE users;

ALTER TABLE users_new RENAME TO users;