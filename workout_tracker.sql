-- Made DB 
CREATE DATABASE workout_tracker;

-- Using DB
USE workout_tracker;

-- Create workouts table
CREATE TABLE workouts (
	id INT auto_increment PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    date DATE DEFAULT (CURRENT_DATE)
);

-- Create exercises table
CREATE TABLE exercises (
	id INT auto_increment PRIMARY KEY,
    workout_id INT,
    sets INT,
    reps INT,
    weight INT,
    FOREIGN KEY (workout_id) REFERENCES workouts(id)
);

SHOW TABLES;

DESCRIBE workouts;
DESCRIBE exercises;
DESCRIBE workout_exercises;


-- NEW PLAN
	-- Updates exercises to table, will now hold list of exercises
ALTER TABLE exercises
ADD COLUMN name VARCHAR(255),
ADD COLUMN equipment VARCHAR(255) DEFAULT 'Barbell',
ADD COLUMN muscle_group VARCHAR(255) DEFAULT 'Full Body';

-- Deletes unneeded fields
ALTER TABLE exercises
DROP COLUMN sets,
DROP COLUMN reps,
DROP COLUMN weight;

ALTER TABLE workouts
ADD COLUMN notes TEXT;

	-- List of exercises, will add more currently just 5 barbell exercises for simplicity
INSERT INTO exercises (name, equipment, muscle_group) VALUES
('Squat', 'Barbell', 'Legs'),
('Bench Press', 'Barbell', 'Chest'),
('Bent Over Row', 'Barbell', 'Back'),
('Overhead Press', 'Barbell', 'Shoulders'),
('Deadlift', 'Barbell', 'Back');

	-- Getting all from exercises
SELECT * FROM exercises;

	-- Inserts a new workout
INSERT INTO workouts (name, date, notes)
VALUES ('Leg Day', CURDATE(), 'Felt strong today.');

	-- Inserts workout and exercise pairings (workkout 1, ex 1, workout 2, ex 2)
INSERT INTO workout_exercises (workout_id, exercise_id)
VALUES (1, 1), (1, 2);

	-- Inserts set data for exercise in workouts
INSERT INTO sets (workout_exercises_id, reps, weight)
VALUES (1, 10, 135), (1, 8, 155), (2, 10, 135);

	-- Creating table for user custom exercises
CREATE TABLE workout_exercises (
	id INT auto_increment PRIMARY KEY,
    workout_id INT NOT NULL,
    exercise_id INT NOT NULL,
    FOREIGN KEY (workout_id) REFERENCES workouts(id),
    FOREIGN KEY (exercise_id) REFERENCES exercises(id)
);

CREATE TABLE sets (
	id INT auto_increment PRIMARY KEY,
    workout_exercises_id INT NOT NULL,
    reps INT NOT NULL,
    weight FLOAT NOT NULL,
    FOREIGN KEY (workout_exercises_id) REFERENCES workout_exercises(id)
);

SELECT * FROM workouts;
SELECT * FROM exercises;
SELECT * FROM workout_exercises;
SELECT * FROM sets;


ALTER TABLE exercises DROP FOREIGN KEY exercises_ibfk_1;
ALTER TABLE exercises DROP COLUMN workout_id;
DESCRIBE exercises;







