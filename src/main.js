import "./style.css";

const app = document.querySelector("#app");
const leagues = [
	{ id: "English Premier League", name: "Premier League" },
	{ id: "Spanish La Liga", name: "La Liga" },
	{ id: "Italian Serie A", name: "Serie A" },
	{ id: "German Bundesliga", name: "Bundesliga" },
	{ id: "French Ligue 1", name: "Ligue 1" },
];

let teams = [];
let selectedTeam = null;

app.innerHTML = `
	<main class="page">
		<section class="club-box">
			<p class="logo">Footy Hub</p>
			<h1>Pick a club</h1>
			<p class="hint">Choose one team.</p>

			<select id="league-select"></select>
			<input id="club-search" type="text" placeholder="Search clubs" autocomplete="off" disabled />
			<div id="club-list" class="club-list"></div>

			<button id="start-button" type="button">Start</button>
			<p id="message" class="message">Loading clubs...</p>
		</section>
	</main>
`;

const leagueSelect = document.querySelector("#league-select");
const searchInput = document.querySelector("#club-search");
const clubList = document.querySelector("#club-list");
const startButton = document.querySelector("#start-button");
const message = document.querySelector("#message");

leagues.forEach((league) => {
	const option = document.createElement("option");
	option.value = league.id;
	option.textContent = league.name;
	leagueSelect.appendChild(option);
});

function showMessage(text, type = "") {
	message.textContent = text;
	message.className = `message ${type}`;
}

function showTeams(list) {
	clubList.innerHTML = "";

	if (list.length === 0) {
		clubList.innerHTML = `<p class="empty">No clubs found.</p>`;
		return;
	}

	list.forEach((team) => {
		const button = document.createElement("button");
		button.type = "button";
		button.className = "club";
		button.innerHTML = `
			<img src="${team.badge}" alt="${team.name} badge" />
			<span>${team.name}</span>
		`;

		button.addEventListener("click", () => {
			selectedTeam = team;
			searchInput.value = team.name;
			document
				.querySelectorAll(".club")
				.forEach((club) => club.classList.remove("selected"));
			button.classList.add("selected");
			showMessage("Good pick.");
		});

		clubList.appendChild(button);
	});
}

function searchClubs() {
	const searchText = searchInput.value.toLowerCase();
	const matches = teams.filter((team) =>
		team.name.toLowerCase().includes(searchText),
	);

	selectedTeam = null;
	showTeams(matches);
}

searchInput.addEventListener("input", searchClubs);

leagueSelect.addEventListener("change", () => {
	loadTeams();
});

startButton.addEventListener("click", () => {
	if (!selectedTeam) {
		showMessage("Pick a club first.", "error");
		return;
	}

	localStorage.setItem("footyhub_team_id", selectedTeam.id);
	localStorage.setItem("footyhub_team_name", selectedTeam.name);
	localStorage.setItem("footyhub_league", leagueSelect.value);
	showDashboard(selectedTeam);
});

function showDashboard(team) {
	app.innerHTML = `
		<main class="page">
			<section class="club-box dashboard">
				<button id="back-button" class="back-button" type="button">Back</button>

				<div class="team-top">
					<img src="${team.badge}" alt="${team.name} badge" />
					<div>
						<p class="logo">${team.league}</p>
						<h1>${team.name}</h1>
					</div>
				</div>

				<div class="stats">
					<p><b>Country</b><span>${team.country}</span></p>
					<p><b>Founded</b><span>${team.founded}</span></p>
					<p><b>Stadium</b><span>${team.stadium}</span></p>
					<p><b>Location</b><span>${team.location}</span></p>
					<p><b>Capacity</b><span>${team.capacity}</span></p>
				</div>

				<p class="team-info">${team.description}</p>
			</section>
		</main>
	`;

	document.querySelector("#back-button").addEventListener("click", () => {
		location.reload();
	});
}

async function loadTeams() {
	selectedTeam = null;
	teams = [];
	searchInput.value = "";
	searchInput.disabled = true;
	clubList.innerHTML = "";
	showMessage("Loading clubs...");

	try {
		const response = await fetch(
			`https://www.thesportsdb.com/api/v1/json/123/search_all_teams.php?l=${encodeURIComponent(leagueSelect.value)}`,
		);
		const payload = await response.json();

		if (!payload.teams) {
			throw new Error("No teams found.");
		}

		teams = payload.teams
			.map((team) => ({
				id: team.idTeam,
				name: team.strTeam,
				badge: team.strBadge,
				capacity: team.intStadiumCapacity || "Unknown",
				country: team.strCountry || "Unknown",
				description: team.strDescriptionEN || "No description yet.",
				founded: team.intFormedYear || "Unknown",
				league: team.strLeague || leagueSelect.value,
				location: team.strLocation || "Unknown",
				stadium: team.strStadium || "Unknown",
			}))
			.filter((team) => team.id && team.name && team.badge)
			.sort((a, b) => a.name.localeCompare(b.name));

		searchInput.disabled = false;
		showTeams(teams);
		showMessage("Pick your club.");
	} catch (error) {
		showMessage("Could not load clubs.", "error");
	}
}

loadTeams();
