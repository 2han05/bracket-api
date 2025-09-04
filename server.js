const express = require("express");
const app = express();
const PORT = 3000;

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public"));

let bracket = [];
let currentRound = 1;
let matchCounter = 1;

// Shuffle helper
function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

// Generate bracket (up to 16 teams)
app.post("/api/bracket", (req, res) => {
  const { teams } = req.body;

  if (!teams || teams.length < 2) {
    return res.status(400).json({ error: "At least 2 teams are required" });
  }

  if (teams.length > 16) {
    return res.status(400).json({ error: "Maximum of 16 teams allowed" });
  }

  const shuffledTeams = shuffle([...teams]);
  bracket = [];
  currentRound = 1;
  matchCounter = 1;

  let matches = [];
  for (let i = 0; i < shuffledTeams.length; i += 2) {
    matches.push({
      matchId: matchCounter++,
      team1: shuffledTeams[i],
      team2: shuffledTeams[i + 1] || "BYE",
      winner: null
    });
  }

  bracket.push({ round: currentRound, matches });

  res.json(bracket[0]);
});

// Get full bracket
app.get("/api/bracket", (req, res) => {
  res.json({ rounds: bracket });
});

// Submit match result
app.post("/api/match", (req, res) => {
  const { matchId, winner } = req.body;

  for (let round of bracket) {
    let match = round.matches.find(m => m.matchId === matchId);
    if (match) {
      if (![match.team1, match.team2].includes(winner)) {
        return res.status(400).json({ error: "Winner must be one of the teams in the match" });
      }

      match.winner = winner;

      // If round is complete, create next round
      if (round.matches.every(m => m.winner !== null)) {
        const winners = round.matches.map(m => m.winner);
        if (winners.length > 1) {
          currentRound++;
          let newMatches = [];
          for (let i = 0; i < winners.length; i += 2) {
            newMatches.push({
              matchId: matchCounter++,
              team1: winners[i],
              team2: winners[i + 1] || "BYE",
              winner: null
            });
          }
          bracket.push({ round: currentRound, matches: newMatches });
        }
      }

      return res.json({ message: `Winner recorded: ${winner}` });
    }
  }

  res.status(404).json({ error: "Match not found" });
});

app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
