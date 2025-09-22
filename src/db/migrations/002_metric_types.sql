-- Make Metrics Table
CREATE TABLE metrics (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    type TEXT NOT NULL CHECK(type IN ('ticket_only', 'ticket_and_total')),
    qualified_work_label TEXT NOT NULL,
    total_work_label TEXT,
    is_legacy BOOLEAN DEFAULT 0,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    UNIQUE(team_id, qualified_work_label)
);

INSERT INTO metrics (team_id, type, qualified_work_label, total_work_label, is_legacy) VALUES
    (1,'ticket_and_total','First Time Approvals','Topview Submissions', 0),
    (2,'ticket_only','Work Tickets',NULL, 1),
    (2,'ticket_only','Orders Placed',NULL, 0),
    (2,'ticket_only','Replacement Parts',NULL, 0),
    (3,'ticket_only','Payments',NULL, 0),
    (4,'ticket_only','Renderings',NULL, 0);

-- Migrate Work Items to Work Tickets
CREATE TABLE logs (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    team_member_id INTEGER NOT NULL,
    metric_id INTEGER NOT NULL,
    qualified_work_items INTEGER NOT NULL,
    total_work_items INTEGER,
    FOREIGN KEY (team_member_id) REFERENCES team_members(id) ON DELETE CASCADE,
    FOREIGN KEY (metric_id) REFERENCES metrics(id) ON DELETE CASCADE,
    UNIQUE(date, team_member_id, metric_id)
);

INSERT INTO logs (date, team_member_id, metric_id, qualified_work_items, total_work_items)
SELECT 
    work_items.date,
    work_items.team_member_id,
    CASE 
        WHEN teams.id = 2 THEN (
            SELECT id FROM metrics 
            WHERE team_id = 2 AND qualified_work_label = 'Work Tickets'
        )
        ELSE (
            SELECT id FROM metrics 
            WHERE team_id = teams.id
            LIMIT 1
        )
    END,
    work_items.tickets_awarded,
    work_items.work_items
FROM work_items
JOIN team_members ON work_items.team_member_id = team_members.id
JOIN teams ON team_members.team_id = teams.id;

DROP TABLE work_items;

-- Remove Team Types (can't delete drop column in SQLite, can't remake table due to foreign keys)
UPDATE teams
    SET type = NULL