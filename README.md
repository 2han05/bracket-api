# Single Elimination Bracket API

## 1. API Description & Features

This project is a **Single Elimination Bracket system** that allows users to create a tournament bracket for 2, 4, 8, or 16 teams. Users can select winners for each match, and the system dynamically generates the next rounds until a champion is determined.  

**Features:**
- Create brackets for 2, 4, 8, or 16 teams.  
- Shuffle teams randomly at the start.  
- Submit match results to progress winners to the next round.  
- Freeze matches after a winner is selected.  
- Display the overall champion at the end.  
- Reset the bracket anytime.  
- Fully interactive front-end with a dynamic bracket display, including connectors between rounds.  

---

## 2. Installation / Setup

### Prerequisites:
- [Node.js](https://nodejs.org/en/) installed on your system.
- Install Visual Studio Code
- Install Git Bash

### Steps:

**Clone the repository:**
- Open your Visual Studio Code
- Go to terminal and create new terminal or ctrl + shift + `
- In terminal go to Git Bash
- Type [git clone https://github.com/2han05/bracket-api.git]

**Installing node_modules**
- cd [your_directory] / cd bracket-api
- Type [npm install] you should see node_modules in your directory

**Starting the servers**
- In Git Bash type [node server.js] you should see this [http://localhost:3000]
- After ctrl + click the localhost or copy it in the chrome

---

## 3. Example Request and Response


### 1. **Generate Bracket**
Create a new bracket with the given teams.

- **URL:** `/api/bracket`  
- **Method:** `POST`  
- **Body (JSON):**
```json
{
  "teams": ["Team A", "Team B", "Team C", "Team D"]
}
```

- **Success Response:**
```json
{
  "rounds": [
    {
      "round": 1,
      "matches": [
        {
          "matchId": 1,
          "team1": "Team C",
          "team2": "Team A",
          "winner": null
        },
        {
          "matchId": 2,
          "team1": "Team B",
          "team2": "Team D",
          "winner": null
        }
      ]
    }
  ]
}
```

- **Error Responses:**
```json
{ "error": "At least 2 teams are required" }
```
```json
{ "error": "Maximum of 16 teams allowed" }
```
```json
{ "error": "Number of teams must be 2, 4, 8, or 16" }
```

---

### 2. **Get Current Bracket**
Retrieve the full current bracket.

- **URL:** `/api/bracket`  
- **Method:** `GET`

- **Response:**
```json
{
  "rounds": [
    {
      "round": 1,
      "matches": [
        {
          "matchId": 1,
          "team1": "Team C",
          "team2": "Team A",
          "winner": "Team C"
        },
        {
          "matchId": 2,
          "team1": "Team B",
          "team2": "Team D",
          "winner": "Team B"
        }
      ]
    },
    {
      "round": 2,
      "matches": [
        {
          "matchId": 3,
          "team1": "Team C",
          "team2": "Team B",
          "winner": null
        }
      ]
    }
  ]
}
```

---

### 3. **Submit Match Result**
Record the winner of a match.

- **URL:** `/api/match`  
- **Method:** `POST`  
- **Body (JSON):**
```json
{
  "matchId": 1,
  "winner": "Team C"
}
```

- **Success Response:**
```json
{ "message": "Winner recorded: Team C" }
```

- **Error Responses:**
```json
{ "error": "Winner must be one of the teams in the match" }
```
```json
{ "error": "Match not found" }
```

---

## Notes
- Supported team counts: **2, 4, 8, 16** only.  
- Once all matches in a round are completed, the **next round** is automatically generated.  
- Final winner is highlighted as **Champion**.
