-- Make Work Item Types Table
CREATE TABLE work_item_types (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    team_id INTEGER NOT NULL,
    ticket_name TEXT NOT NULL,
    work_item_name TEXT,
    type TEXT NOT NULL CHECK(type IN ('ticket_only', 'ticket_and_total')),
    is_legacy BOOLEAN DEFAULT 0,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE CASCADE,
    UNIQUE(team_id, ticket_name)
);

INSERT INTO work_item_types (team_id, ticket_name, work_item_name, type, is_legacy) VALUES
    (1,'First Time Approvals','Topview Submissions','ticket_and_total', 0),
    (2,'Work Tickets',NULL,'ticket_only', 1),
    (2,'Orders Placed',NULL,'ticket_only', 0),
    (2,'Replacement Parts',NULL,'ticket_only', 0),
    (3,'Payments',NULL,'ticket_only', 0),
    (4,'Renderings',NULL,'ticket_only', 0);

-- Migrate Work Items
CREATE TABLE work_items_new (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    tickets_awarded INTEGER NOT NULL,
    work_items INTEGER,
    team_member_id INTEGER NOT NULL,
    work_item_type_id INTEGER NOT NULL,
    FOREIGN KEY (team_member_id) REFERENCES team_members(id) ON DELETE CASCADE,
    FOREIGN KEY (work_item_type_id) REFERENCES work_item_types(id) ON DELETE CASCADE,
    UNIQUE(team_member_id, work_item_type_id, date)
);

INSERT INTO work_items_new (date, tickets_awarded, work_items, team_member_id, work_item_type_id)
SELECT 
    work_items.date,
    work_items.tickets_awarded,
    work_items.work_items,
    work_items.team_member_id,
    CASE 
        WHEN teams.id = 2 THEN (
            SELECT id FROM work_item_types 
            WHERE team_id = 2 AND ticket_name = 'Work Tickets'
        )
        ELSE (
            SELECT id FROM work_item_types 
            WHERE team_id = teams.id
            LIMIT 1
        )
    END
FROM work_items
JOIN team_members ON work_items.team_member_id = team_members.id
JOIN teams ON team_members.team_id = teams.id;

-- Rename Table
ALTER TABLE work_items RENAME TO work_items_old;
ALTER TABLE work_items_new RENAME TO work_items;
DROP TABLE work_items_old;

-- Null Team Types
UPDATE teams
    SET type = NULL