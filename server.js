const express = require("express");
const app = express();
const PORT = 3000;

// Middleware to parse JSON and form data
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(express.static("public")); // Serve frontend files from "public" folder

// In-memory storage for bracket data
let bracket = [];
let currentRound = 1;
let matchCounter = 1;

// Helper function to shuffle teams randomly
function shuffle(array) {
  return array.sort(() => Math.random() - 0.5);
}

// ======================== API ROUTES ========================

// Generate initial bracket (up to 16 teams)
app.post("/api/bracket", (req, res) => {
  const { teams } = req.body;

  // Validation: must have 2–16 teams
  if (!teams || teams.length < 2) {
    return res.status(400).json({ error: "At least 2 teams are required" });
  }
  if (teams.length > 16) {
    return res.status(400).json({ error: "Maximum of 16 teams allowed" });
  }

  // Only allow powers of 2: 2, 4, 8, 16
  const validCounts = [2, 4, 8, 16];
  if (!validCounts.includes(teams.length)) {
    return res.status(400).json({ error: "Number of teams must be 2, 4, 8, or 16" });
  }

  // Shuffle team order
  const shuffledTeams = shuffle([...teams]);

  // Reset bracket state
  bracket = [];
  currentRound = 1;
  matchCounter = 1;

  // Create first round matches
  let matches = [];
  for (let i = 0; i < shuffledTeams.length; i += 2) {
    matches.push({
      matchId: matchCounter++,
      team1: shuffledTeams[i],
      team2: shuffledTeams[i + 1] || "BYE", // Handle odd teams
      winner: null
    });
  }

  // Save round 1
  bracket.push({ round: currentRound, matches });

  res.json({ rounds: bracket });
});

// Get full bracket (including future rounds + filled winners)
app.get("/api/bracket", (req, res) => {
  if (!bracket || bracket.length === 0) {
    return res.json({ rounds: bracket });
  }

  // Deep copy so we don’t accidentally change in-memory data
  const augmented = JSON.parse(JSON.stringify(bracket));

  // Figure out total number of rounds needed
  const initialMatches = augmented[0].matches.length || 0;
  const initialTeams = initialMatches * 2;
  if (initialTeams <= 0) {
    return res.json({ rounds: augmented });
  }
  const roundsNeeded = Math.ceil(Math.log2(initialTeams));

  // Get max matchId so we don’t duplicate IDs
  let maxMatchId = 0;
  augmented.forEach(r =>
    r.matches.forEach(m => {
      if (m && typeof m.matchId === "number" && m.matchId > maxMatchId) {
        maxMatchId = m.matchId;
      }
    })
  );
  let matchIdCounter = maxMatchId + 1;

  // Create empty rounds until finals
  while (augmented.length < roundsNeeded) {
    const lastMatchesCount = augmented[augmented.length - 1].matches.length;
    const newMatches = [];

    // Each new round has half as many matches
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

  // Propagate winners into next round
  for (let r = 0; r < augmented.length - 1; r++) {
    const currentRound = augmented[r];
    const nextRound = augmented[r + 1];

    currentRound.matches.forEach((match, idx) => {
      if (match.winner) {
        // Each pair of matches feeds one next-round match
        const targetMatch = nextRound.matches[Math.floor(idx / 2)];

        if (idx % 2 === 0) {
          if (!targetMatch.team1) targetMatch.team1 = match.winner;
        } else {
          if (!targetMatch.team2) targetMatch.team2 = match.winner;
        }
      }
    });
  }

  return res.json({ rounds: augmented });
});

// Submit match result (pick winner)
app.post("/api/match", (req, res) => {
  const { matchId, winner } = req.body;

  for (let round of bracket) {
    let match = round.matches.find(m => m.matchId === matchId);
    if (match) {
      // Validation: winner must be one of the teams
      if (![match.team1, match.team2].includes(winner)) {
        return res.status(400).json({ error: "Winner must be one of the teams in the match" });
      }

      match.winner = winner;

      // If all matches in this round have winners, make next round
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

// Start server
app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
