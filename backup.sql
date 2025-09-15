PRAGMA defer_foreign_keys=TRUE;
CREATE TABLE teams (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    name TEXT NOT NULL UNIQUE,
    type TEXT DEFAULT 'ticket_only' CHECK(type IN ('ticket_and_total', 'ticket_only'))
);
INSERT INTO teams VALUES(1,'Project Management','ticket_and_total');
INSERT INTO teams VALUES(2,'Customer Support','ticket_only');
INSERT INTO teams VALUES(3,'Accounting','ticket_only');
INSERT INTO teams VALUES(4,'Renderings','ticket_only');
CREATE TABLE team_members (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    name TEXT NOT NULL UNIQUE,
    team_id INTEGER,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
);
INSERT INTO team_members VALUES(1,'Berkley',1);
INSERT INTO team_members VALUES(2,'Brandon',1);
INSERT INTO team_members VALUES(3,'Garrett',1);
INSERT INTO team_members VALUES(4,'Kevin',1);
INSERT INTO team_members VALUES(5,'Lisa',1);
INSERT INTO team_members VALUES(6,'Madi',1);
INSERT INTO team_members VALUES(7,'Rasheal',1);
INSERT INTO team_members VALUES(8,'Taylor',1);
INSERT INTO team_members VALUES(9,'Valicia',1);
INSERT INTO team_members VALUES(10,'Michaella',1);
INSERT INTO team_members VALUES(12,'Shelly',2);
INSERT INTO team_members VALUES(13,'Alyvia',2);
INSERT INTO team_members VALUES(14,'Kira',2);
INSERT INTO team_members VALUES(15,'Lynsie',3);
INSERT INTO team_members VALUES(16,'Nathan',4);
CREATE TABLE IF NOT EXISTS "users" (
    id INTEGER PRIMARY KEY AUTOINCREMENT, 
    username TEXT NOT NULL UNIQUE,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user' CHECK(role IN ('user', 'admin', 'manager')),
    team_id INTEGER,
    team_member_id INTEGER DEFAULT NULL,
    FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL,
    FOREIGN KEY (team_member_id) REFERENCES team_members(id) ON DELETE SET NULL
);
INSERT INTO users VALUES(1,'admin','$2b$10$PoF.rnvwLwVNPlwSIgbPieFGxj3V4C/kQYfehixpeq8GPDPEBj3ky','admin',NULL,NULL);
INSERT INTO users VALUES(2,'erika','$2b$10$JpX2I2uVArVJlhwcPVPy6uYriu1AkrBVPnjiBM5aKCPo.AiUm2YCi','admin',NULL,NULL);
INSERT INTO users VALUES(3,'lucas','$2b$10$vb9z/ZezFH5yNYXJaFN2duVG8v1/RjninvNMORjK3fiQQROa1hKha','manager',2,NULL);
INSERT INTO users VALUES(4,'Jenny Rogers','$2b$10$Zf2BXoX0il2iu9a/sUb65.FlVFzt0uxBZ/b5bJMenGbE6TX2hbGZe','admin',NULL,NULL);
INSERT INTO users VALUES(5,'MilisaPayne','$2b$10$2b7OQmq3VoOG5uqLJFBtaOCNKcfKYzWnWYEPpVicJKZ.y.lL4KBdW','manager',3,NULL);
INSERT INTO users VALUES(6,'RauniO','$2b$10$iHvGPo7K6HRLb8srPT.rHOHxhIlOuc5B6tOdvRu5uPm7E35diTkbC','manager',2,NULL);
INSERT INTO users VALUES(9,'Michaella2','$2b$10$bUX9XsgJGAK4gMrgQeBB1.mNL3J2FrE2TUOUiTFEnB03y6Qp97ip6','user',NULL,10);
INSERT INTO users VALUES(10,'Garrett','$2b$10$CMQRfL6UOSVha8mwT3.01OgKltJdk2E35VP1YeSvygbfR3dU9Giuq','user',NULL,3);
INSERT INTO users VALUES(11,'KiraM','$2b$10$FnLvriN9h8QLYOcO/njc0OmirbVIJLYeJusVMtWom6n6bSQe82Gq2','user',NULL,14);
INSERT INTO users VALUES(12,'Valicia@gwpark.com','$2b$10$2onBrfaIVOleWKO/SSAYq.7Jel0dHd12htifswXouSwemGknnXcRy','user',NULL,9);
CREATE TABLE work_items (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    tickets_awarded INTEGER NOT NULL,    
    work_items INTEGER,
    team_member_id INTEGER NOT NULL,
    FOREIGN KEY (team_member_id) REFERENCES team_members(id) ON DELETE CASCADE,
    UNIQUE(team_member_id, date)
);
INSERT INTO work_items VALUES(47,'2025-09-02',1,3,1);
INSERT INTO work_items VALUES(48,'2025-09-02',0,0,2);
INSERT INTO work_items VALUES(49,'2025-09-02',0,0,3);
INSERT INTO work_items VALUES(50,'2025-09-02',0,1,4);
INSERT INTO work_items VALUES(51,'2025-09-02',0,0,5);
INSERT INTO work_items VALUES(52,'2025-09-02',0,0,6);
INSERT INTO work_items VALUES(53,'2025-09-02',0,0,7);
INSERT INTO work_items VALUES(54,'2025-09-02',0,0,8);
INSERT INTO work_items VALUES(55,'2025-09-02',0,1,9);
INSERT INTO work_items VALUES(56,'2025-09-02',0,0,10);
INSERT INTO work_items VALUES(57,'2025-09-03',2,5,1);
INSERT INTO work_items VALUES(58,'2025-09-03',0,0,2);
INSERT INTO work_items VALUES(59,'2025-09-03',0,0,4);
INSERT INTO work_items VALUES(60,'2025-09-03',0,1,5);
INSERT INTO work_items VALUES(61,'2025-09-03',1,1,6);
INSERT INTO work_items VALUES(62,'2025-09-03',0,0,7);
INSERT INTO work_items VALUES(63,'2025-09-03',0,0,8);
INSERT INTO work_items VALUES(64,'2025-09-03',0,0,9);
INSERT INTO work_items VALUES(65,'2025-09-03',0,0,10);
INSERT INTO work_items VALUES(68,'2025-09-03',0,1,3);
INSERT INTO work_items VALUES(87,'2025-09-03',1,NULL,12);
INSERT INTO work_items VALUES(89,'2025-09-04',0,0,1);
INSERT INTO work_items VALUES(90,'2025-09-04',0,0,2);
INSERT INTO work_items VALUES(91,'2025-09-04',0,0,3);
INSERT INTO work_items VALUES(92,'2025-09-04',1,1,4);
INSERT INTO work_items VALUES(93,'2025-09-04',1,1,5);
INSERT INTO work_items VALUES(94,'2025-09-04',0,0,6);
INSERT INTO work_items VALUES(95,'2025-09-04',1,1,7);
INSERT INTO work_items VALUES(96,'2025-09-04',0,0,8);
INSERT INTO work_items VALUES(97,'2025-09-04',0,1,9);
INSERT INTO work_items VALUES(98,'2025-09-04',0,0,10);
INSERT INTO work_items VALUES(109,'2025-09-05',0,0,1);
INSERT INTO work_items VALUES(110,'2025-09-05',0,0,2);
INSERT INTO work_items VALUES(111,'2025-09-05',1,1,3);
INSERT INTO work_items VALUES(112,'2025-09-05',0,0,4);
INSERT INTO work_items VALUES(113,'2025-09-05',0,0,5);
INSERT INTO work_items VALUES(114,'2025-09-05',0,0,6);
INSERT INTO work_items VALUES(115,'2025-09-05',0,0,7);
INSERT INTO work_items VALUES(116,'2025-09-05',1,1,8);
INSERT INTO work_items VALUES(117,'2025-09-05',1,1,9);
INSERT INTO work_items VALUES(118,'2025-09-05',0,0,10);
INSERT INTO work_items VALUES(119,'2025-09-05',1,NULL,16);
INSERT INTO work_items VALUES(120,'2025-09-05',2,NULL,12);
INSERT INTO work_items VALUES(121,'2025-09-05',1,NULL,13);
INSERT INTO work_items VALUES(122,'2025-09-05',1,NULL,14);
INSERT INTO work_items VALUES(123,'2025-09-08',1,2,1);
INSERT INTO work_items VALUES(124,'2025-09-08',0,0,2);
INSERT INTO work_items VALUES(125,'2025-09-08',0,0,3);
INSERT INTO work_items VALUES(126,'2025-09-08',0,0,4);
INSERT INTO work_items VALUES(127,'2025-09-08',0,0,5);
INSERT INTO work_items VALUES(128,'2025-09-08',1,1,6);
INSERT INTO work_items VALUES(129,'2025-09-08',3,3,7);
INSERT INTO work_items VALUES(130,'2025-09-08',0,0,8);
INSERT INTO work_items VALUES(131,'2025-09-08',0,0,9);
INSERT INTO work_items VALUES(132,'2025-09-08',0,0,10);
INSERT INTO work_items VALUES(133,'2025-09-08',4,NULL,12);
INSERT INTO work_items VALUES(134,'2025-09-08',1,NULL,13);
INSERT INTO work_items VALUES(135,'2025-09-08',1,NULL,14);
INSERT INTO work_items VALUES(136,'2025-09-09',2,2,10);
INSERT INTO work_items VALUES(138,'2025-09-08',3,NULL,15);
INSERT INTO work_items VALUES(139,'2025-09-05',2,NULL,15);
INSERT INTO work_items VALUES(140,'2025-09-09',0,0,1);
INSERT INTO work_items VALUES(141,'2025-09-09',0,0,2);
INSERT INTO work_items VALUES(142,'2025-09-09',0,1,3);
INSERT INTO work_items VALUES(143,'2025-09-09',0,1,4);
INSERT INTO work_items VALUES(144,'2025-09-09',0,0,6);
INSERT INTO work_items VALUES(145,'2025-09-09',0,0,7);
INSERT INTO work_items VALUES(146,'2025-09-09',1,2,8);
INSERT INTO work_items VALUES(147,'2025-09-09',0,0,9);
INSERT INTO work_items VALUES(149,'2025-09-09',1,NULL,16);
INSERT INTO work_items VALUES(154,'2025-09-09',0,1,5);
INSERT INTO work_items VALUES(160,'2025-09-09',2,NULL,12);
INSERT INTO work_items VALUES(161,'2025-09-09',1,NULL,13);
INSERT INTO work_items VALUES(162,'2025-09-09',1,NULL,14);
INSERT INTO work_items VALUES(163,'2025-09-10',0,0,1);
INSERT INTO work_items VALUES(164,'2025-09-10',0,1,2);
INSERT INTO work_items VALUES(165,'2025-09-10',0,0,3);
INSERT INTO work_items VALUES(166,'2025-09-10',0,1,4);
INSERT INTO work_items VALUES(167,'2025-09-10',0,0,5);
INSERT INTO work_items VALUES(168,'2025-09-10',1,1,6);
INSERT INTO work_items VALUES(169,'2025-09-10',0,0,7);
INSERT INTO work_items VALUES(170,'2025-09-10',2,5,8);
INSERT INTO work_items VALUES(171,'2025-09-10',1,1,9);
INSERT INTO work_items VALUES(172,'2025-09-10',0,0,10);
INSERT INTO work_items VALUES(183,'2025-09-10',2,NULL,12);
INSERT INTO work_items VALUES(184,'2025-09-10',1,NULL,13);
INSERT INTO work_items VALUES(185,'2025-09-10',1,NULL,14);
INSERT INTO work_items VALUES(186,'2025-09-04',2,NULL,12);
INSERT INTO work_items VALUES(187,'2025-09-10',1,NULL,16);
INSERT INTO work_items VALUES(188,'2025-09-11',0,0,1);
INSERT INTO work_items VALUES(189,'2025-09-11',0,0,2);
INSERT INTO work_items VALUES(190,'2025-09-11',0,0,3);
INSERT INTO work_items VALUES(191,'2025-09-11',0,1,4);
INSERT INTO work_items VALUES(192,'2025-09-11',0,1,5);
INSERT INTO work_items VALUES(193,'2025-09-11',0,0,6);
INSERT INTO work_items VALUES(194,'2025-09-11',0,1,7);
INSERT INTO work_items VALUES(195,'2025-09-11',0,0,8);
INSERT INTO work_items VALUES(196,'2025-09-11',0,0,9);
INSERT INTO work_items VALUES(197,'2025-09-11',1,2,10);
INSERT INTO work_items VALUES(198,'2025-09-11',1,NULL,12);
INSERT INTO work_items VALUES(199,'2025-09-11',1,NULL,13);
INSERT INTO work_items VALUES(200,'2025-09-11',2,NULL,14);
INSERT INTO work_items VALUES(201,'2025-09-12',4,NULL,12);
INSERT INTO work_items VALUES(202,'2025-09-12',1,NULL,13);
INSERT INTO work_items VALUES(203,'2025-09-12',0,0,1);
INSERT INTO work_items VALUES(204,'2025-09-12',1,3,2);
INSERT INTO work_items VALUES(205,'2025-09-12',0,0,3);
INSERT INTO work_items VALUES(206,'2025-09-12',0,5,4);
INSERT INTO work_items VALUES(207,'2025-09-12',0,1,5);
INSERT INTO work_items VALUES(208,'2025-09-12',0,0,6);
INSERT INTO work_items VALUES(209,'2025-09-12',0,1,7);
INSERT INTO work_items VALUES(210,'2025-09-12',0,0,8);
INSERT INTO work_items VALUES(211,'2025-09-12',0,1,9);
INSERT INTO work_items VALUES(212,'2025-09-12',0,0,10);
CREATE TABLE bonus_tickets (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    date DATE NOT NULL,
    description TEXT NOT NULL,
    tickets_awarded INTEGER NOT NULL,
    team_member_id INTEGER NOT NULL,
    manager_id INTEGER NOT NULL,
    FOREIGN KEY (team_member_id) REFERENCES team_members(id) ON DELETE CASCADE,
    FOREIGN KEY (manager_id) REFERENCES "users"(id) ON DELETE SET NULL
);
INSERT INTO bonus_tickets VALUES(2,'2025-09-02','Password Reset',1,2,2);
INSERT INTO bonus_tickets VALUES(3,'2025-09-02','Password Reset',1,3,2);
INSERT INTO bonus_tickets VALUES(4,'2025-09-02','Password Resert',1,9,2);
INSERT INTO bonus_tickets VALUES(5,'2025-09-02','Password Resert',1,15,2);
INSERT INTO bonus_tickets VALUES(6,'2025-09-02','Password Reset',1,7,2);
INSERT INTO bonus_tickets VALUES(7,'2025-09-02','Password Reset',1,12,2);
INSERT INTO bonus_tickets VALUES(8,'2025-09-02','Password Reset',1,14,2);
INSERT INTO bonus_tickets VALUES(9,'2025-09-02','Password Reset',1,8,2);
INSERT INTO bonus_tickets VALUES(10,'2025-09-02','Password Reset',1,1,2);
INSERT INTO bonus_tickets VALUES(11,'2025-09-02','Password Reset',1,4,2);
INSERT INTO bonus_tickets VALUES(12,'2025-09-02','Password Reset',1,5,2);
INSERT INTO bonus_tickets VALUES(13,'2025-09-02','Password Reset',1,16,2);
INSERT INTO bonus_tickets VALUES(14,'2025-09-02','Password Reset',1,6,2);
INSERT INTO bonus_tickets VALUES(15,'2025-09-12','Accounting Help',2,8,2);
DELETE FROM sqlite_sequence;
INSERT INTO sqlite_sequence VALUES('teams',5);
INSERT INTO sqlite_sequence VALUES('team_members',16);
INSERT INTO sqlite_sequence VALUES('users',12);
INSERT INTO sqlite_sequence VALUES('work_items',212);
INSERT INTO sqlite_sequence VALUES('bonus_tickets',15);
