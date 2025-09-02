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

  const response = await fetch("http://localhost:3000/api/bracket", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ teams }),
  });

  const data = await response.json();
  renderBracket([{ round: 1, matches: data.matches }]);
}

function renderBracket(rounds) {
  const bracketDiv = document.getElementById("bracket");
  bracketDiv.innerHTML = "";

  rounds.forEach(round => {
    const roundDiv = document.createElement("div");
    roundDiv.classList.add("round");

    round.matches.forEach(match => {
      const matchDiv = document.createElement("div");
      matchDiv.classList.add("match");

      matchDiv.innerHTML = `
        <div class="team">${match.team1}</div>
        <div class="team">vs</div>
        <div class="team">${match.team2}</div>
      `;

      roundDiv.appendChild(matchDiv);
    });

    bracketDiv.appendChild(roundDiv);
  });
}
