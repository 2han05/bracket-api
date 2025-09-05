document.getElementById("setTeamsBtn").addEventListener("click", createInputs);
document.getElementById("generateBracketBtn").addEventListener("click", generateBracket);

// Add Reset Bracket button dynamically
const resetBtn = document.createElement("button");
resetBtn.innerText = "Reset Bracket";
resetBtn.style.marginLeft = "10px";
resetBtn.addEventListener("click", resetBracket);
document.getElementById("generateBracketBtn").after(resetBtn);

function createInputs() {
  const count = parseInt(document.getElementById("teamCount").value, 10);
  if (![2,4,8,16].includes(count)) {
    alert("Please select number of teams: 2, 4, 8, or 16");
    return;
  }
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

  if (![2,4,8,16].includes(teams.length)) {
    alert("Teams count must be 2, 4, 8, or 16");
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

      // Click to choose winner, only if not already selected
      matchDiv.querySelectorAll(".team").forEach(teamEl => {
        if (teamEl.innerText !== "BYE" && teamEl.innerText !== "" && !match.winner) {
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

  // AFTER appending rounds, add margin-top to matches in rounds > 1 for vertical centering
  const roundsDivs = bracketDiv.querySelectorAll(".round");
  for (let i = 1; i < roundsDivs.length; i++) {
    const matches = roundsDivs[i].querySelectorAll(".match");
    matches.forEach((matchEl, idx) => {
      const prevRoundMatches = roundsDivs[i - 1].querySelectorAll(".match");
      if (prevRoundMatches.length >= (idx * 2 + 2)) {
        const firstParent = prevRoundMatches[idx * 2];
        const secondParent = prevRoundMatches[idx * 2 + 1];
        const firstRect = firstParent.getBoundingClientRect();
        const secondRect = secondParent.getBoundingClientRect();

        const bracketRect = bracketDiv.getBoundingClientRect();
        const firstCenter = firstRect.top + firstRect.height / 2 - bracketRect.top + bracketDiv.scrollTop;
        const secondCenter = secondRect.top + secondRect.height / 2 - bracketRect.top + bracketDiv.scrollTop;
        const midY = (firstCenter + secondCenter) / 2;

        const currentMatchRect = matchEl.getBoundingClientRect();
        const currentTop = currentMatchRect.top - bracketRect.top + bracketDiv.scrollTop;

        const neededMarginTop = midY - currentTop - matchEl.offsetHeight / 2;

        if (neededMarginTop > 0) {
          matchEl.style.marginTop = neededMarginTop + "px";
        }
      }
    });
  }

  drawConnectors(rounds);

  // Show champion text below bracket
  const championText = document.getElementById("championText");
  const lastRound = rounds[rounds.length - 1];
  if (lastRound && lastRound.matches.length === 1 && lastRound.matches[0].winner) {
    championText.innerText = `Champion: ${lastRound.matches[0].winner}`;
  } else {
    championText.innerText = "";
  }
}

function drawConnectors(rounds) {
  const bracketDiv = document.getElementById("bracket");

  // Remove old connectors
  document.querySelectorAll(".connector").forEach(conn => conn.remove());

  for (let i = 0; i < rounds.length - 1; i++) {
    const currentRoundMatches = bracketDiv.children[i].querySelectorAll(".match");
    const nextRoundMatches = bracketDiv.children[i + 1].querySelectorAll(".match");

    for (let j = 0; j < nextRoundMatches.length; j++) {
      const matchEl = nextRoundMatches[j];
      const parent1 = currentRoundMatches[2 * j];
      const parent2 = currentRoundMatches[2 * j + 1];
      if (!parent1 || !parent2) continue;

      const bracketRect = bracketDiv.getBoundingClientRect();
      const p1Rect = parent1.getBoundingClientRect();
      const p2Rect = parent2.getBoundingClientRect();
      const cRect = matchEl.getBoundingClientRect();

      const p1CenterY = p1Rect.top + p1Rect.height / 2 - bracketRect.top + bracketDiv.scrollTop;
      const p2CenterY = p2Rect.top + p2Rect.height / 2 - bracketRect.top + bracketDiv.scrollTop;
      const cCenterY = cRect.top + cRect.height / 2 - bracketRect.top + bracketDiv.scrollTop;

      const pRightX = p1Rect.right - bracketRect.left + bracketDiv.scrollLeft;
      const cLeftX = cRect.left - bracketRect.left + bracketDiv.scrollLeft;

      const midY = (p1CenterY + p2CenterY) / 2;

      const vertLine1 = document.createElement("div");
      vertLine1.className = "connector vertical";
      vertLine1.style.top = `${p1CenterY}px`;
      vertLine1.style.left = `${pRightX}px`;
      vertLine1.style.height = `${midY - p1CenterY}px`;
      bracketDiv.appendChild(vertLine1);

      const vertLine2 = document.createElement("div");
      vertLine2.className = "connector vertical";
      vertLine2.style.top = `${midY}px`;
      vertLine2.style.left = `${pRightX}px`;
      vertLine2.style.height = `${p2CenterY - midY}px`;
      bracketDiv.appendChild(vertLine2);

      const horizLine1 = document.createElement("div");
      horizLine1.className = "connector horizontal";
      horizLine1.style.top = `${midY}px`;
      horizLine1.style.left = `${pRightX}px`;
      horizLine1.style.width = `20px`;
      bracketDiv.appendChild(horizLine1);

      const horizLine2 = document.createElement("div");
      horizLine2.className = "connector horizontal";
      horizLine2.style.top = `${cCenterY}px`;
      horizLine2.style.left = `${pRightX + 20}px`;
      horizLine2.style.width = `${cLeftX - (pRightX + 20)}px`;
      bracketDiv.appendChild(horizLine2);

      const vertLineMidToChild = document.createElement("div");
      vertLineMidToChild.className = "connector vertical";
      vertLineMidToChild.style.top = `${midY}px`;
      vertLineMidToChild.style.left = `${pRightX + 20}px`;
      vertLineMidToChild.style.height = `${cCenterY - midY}px`;
      bracketDiv.appendChild(vertLineMidToChild);
    }
  }
}

// Reset bracket function
function resetBracket() {
  document.getElementById("teamForm").innerHTML = "";
  document.getElementById("bracket").innerHTML = "";
  document.getElementById("championText").innerText = "";
  fetch("http://localhost:3000/api/bracket", { 
    method: "POST", 
    headers: { "Content-Type": "application/json" }, 
    body: JSON.stringify({ teams: [] }) 
  });
  createInputs();
}

// Initialize with 4 teams input
createInputs();
