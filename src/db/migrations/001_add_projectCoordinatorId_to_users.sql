ALTER TABLE users
    ADD COLUMN projectCoordinatorId INTEGER DEFAULT NULL
        REFERENCES projectCoordinators(id)
        ON DELETE SET NULL;