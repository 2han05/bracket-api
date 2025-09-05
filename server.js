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

  const validCounts = [2, 4, 8, 16];
  if (!validCounts.includes(teams.length)) {
    return res.status(400).json({ error: "Number of teams must be 2, 4, 8, or 16" });
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

  res.json({ rounds: bracket });
});

// Get full bracket (augmented with future rounds + fill winners into null slots)
app.get("/api/bracket", (req, res) => {
  if (!bracket || bracket.length === 0) {
    return res.json({ rounds: bracket });
  }

  // Deep copy so we don't mutate in-memory data
  const augmented = JSON.parse(JSON.stringify(bracket));

  // Determine initial teams
  const initialMatches = augmented[0].matches.length || 0;
  const initialTeams = initialMatches * 2;
  if (initialTeams <= 0) {
    return res.json({ rounds: augmented });
  }

  const roundsNeeded = Math.ceil(Math.log2(initialTeams));

  // Find max matchId for safe numbering
  let maxMatchId = 0;
  augmented.forEach(r =>
    r.matches.forEach(m => {
      if (m && typeof m.matchId === "number" && m.matchId > maxMatchId) {
        maxMatchId = m.matchId;
      }
    })
  );
  let matchIdCounter = maxMatchId + 1;

  // Ensure all rounds exist up to finals
  while (augmented.length < roundsNeeded) {
    const lastMatchesCount = augmented[augmented.length - 1].matches.length;
    const newMatches = [];

    for (let i = 0; i < lastMatchesCount; i += 2) {
      newMatches.push({
        matchId: matchIdCounter++,
        team1: null,
        team2: null,
        winner: null
      });
    }

    augmented.push({
      round: augmented.length + 1,
      matches: newMatches
    });
  }

  // Fill winners into the next round slots
  for (let r = 0; r < augmented.length - 1; r++) {
    const currentRound = augmented[r];
    const nextRound = augmented[r + 1];

    currentRound.matches.forEach((match, idx) => {
      if (match.winner) {
        // Each pair of matches feeds into one next-round match
        const targetMatch = nextRound.matches[Math.floor(idx / 2)];

        if (idx % 2 === 0) {
          // First child slot
          if (!targetMatch.team1) targetMatch.team1 = match.winner;
        } else {
          // Second child slot
          if (!targetMatch.team2) targetMatch.team2 = match.winner;
        }
      }
    });
  }

  return res.json({ rounds: augmented });
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
