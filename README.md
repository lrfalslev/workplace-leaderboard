# Workplace Leaderboard

A Svelte-powered leaderboard app for small businesses to run workplace competitions and reward employees for outstanding work.

## Overview

This app enables managers to assign tickets to employees for meeting work standards or for exceptional achievements (bonus tickets). Tickets are linked to specific metrics for each team, allowing for flexible tracking of both standard and bonus accomplishments.

Employees earn tickets by completing work that meets or exceeds defined metrics. The leaderboard displays the current standings, showing how many tickets each employee has earned. At the end of the challenge period, tickets serve as entries in a prize drawing.

## Features

- **Team-based metrics:** Each business unit can have its own set of metrics.
- **Role-based Ticket assignment:** Managers can award tickets to their team's members for meeting standards. Admins can award work tickets or bonus tickets at their discretion.
- **Leaderboard:** Real-time standings of all employees, showing ticket counts.
- **Drawing entries:** Tickets act as entries for prize drawings at the end of the competition.

## Getting Started

### 1. Install dependencies

```bash
npm install
```

### 2. Start the development server

```bash
npm run dev
```

Visit [localhost:5173](http://localhost:5173) (or the port shown in your terminal) to view the app.

### 3. Build for production

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

## Usage

- Admin sets up teams, and team metrics, and assigns team members.
- Managers log in and assign tickets to team members based on completed work and bonus achievements.
- Employees can view their standings on the leaderboard. And if their account is linked to a team member can view specific metrics on how well they're doing.
- At the end of the challenge, tickets are used as entries in a random prize drawing.
