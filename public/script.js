document.getElementById("setTeamsBtn").addEventListener("click", createInputs);
document.getElementById("generateBracketBtn").addEventListener("click", generateBracket);

function createInputs() {
  const count = document.getElementById("teamCount").value;
  const form = document.getElementById("teamForm");
  form.innerHTML = "";
  for (let i = 0; i < count; i++) {
    form.innerHTML += `<input class="team-input" type="text" placeholder="Team ${i + 1}" required><br>`;
  }
}

async function generateBracket() {
  const inputs = document.querySelectorAll(".team-input");
  const teams = Array.from(inputs).map(input => input.value).filter(Boolean);

  if (teams.length < 2) {
    alert("Please enter at least 2 team names.");
    return;
  }

  // Send to backend
  await fetch("http://localhost:3000/api/bracket", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ teams }),
  });

  fetchBracket();
}

async function fetchBracket() {
  const res = await fetch("http://localhost:3000/api/bracket");
  const data = await res.json();
  renderBracket(data.rounds);
}

function renderBracket(rounds) {
  const bracketDiv = document.getElementById("bracket");
  bracketDiv.innerHTML = "";

  rounds.forEach((round, roundIndex) => {
    const roundDiv = document.createElement("div");
    roundDiv.classList.add("round");

    round.matches.forEach(match => {
      const matchDiv = document.createElement("div");
      matchDiv.classList.add("match");

      const isFinal = roundIndex === rounds.length - 1;

      const winnerClass = team => match.winner === team ? (isFinal ? "winner champion" : "winner") : "";

      matchDiv.innerHTML = `
        <div class="team ${winnerClass(match.team1)}" data-id="${match.matchId}" data-team="${match.team1}">
          ${match.team1}
        </div>
        <div class="vs">vs</div>
        <div class="team ${winnerClass(match.team2)}" data-id="${match.matchId}" data-team="${match.team2}">
          ${match.team2}
        </div>
      `;

      // Click to choose winner
      matchDiv.querySelectorAll(".team").forEach(teamEl => {
        if (teamEl.innerText !== "BYE" && teamEl.innerText !== "") {
          teamEl.addEventListener("click", async () => {
            await fetch("http://localhost:3000/api/match", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                matchId: parseInt(teamEl.dataset.id),
                winner: teamEl.dataset.team,
              }),
            });
            fetchBracket();
          });
        }
      });

      roundDiv.appendChild(matchDiv);
    });

    bracketDiv.appendChild(roundDiv);
  });
}
