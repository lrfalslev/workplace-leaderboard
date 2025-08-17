CREATE TABLE IF NOT EXISTS projectCoordinators (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    name TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS topviews (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    projectCoordinatorId INTEGER NOT NULL,
    date DATE NOT NULL,
    firstTimeApprovals INTEGER NOT NULL,
    totalSubmissions INTEGER NOT NULL,
    FOREIGN KEY (projectCoordinatorId) REFERENCES projectCoordinators(id) ON DELETE CASCADE
);
CREATE UNIQUE INDEX topviews_unique ON topviews(projectCoordinatorId, date);

CREATE TABLE IF NOT EXISTS users (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user'
);