import "./style.css";

const APP = document.querySelector("#app");
const CLUBS_API_URL =
	"https://www.thesportsdb.com/api/v1/json/123/lookup_all_teams.php?id=4328";

const state = {
	teams: [],
	filteredTeams: [],
	selectedTeam: null,
	dropdownOpen: false,
};

APP.innerHTML = `
	<main class="onboarding-shell">
		<section class="onboarding-card" aria-label="Club Selection">
			<h1>Choose Your Club</h1>
			<p class="subtitle">Select your favorite team to personalize your dashboard.</p>

			<div class="search-control" id="search-control">
				<label for="club-search" class="sr-only">Search football clubs</label>
				<input
					id="club-search"
					type="text"
					placeholder="Search clubs..."
					autocomplete="off"
					disabled
				/>
				<div id="club-dropdown" class="dropdown hidden" role="listbox" aria-label="Football clubs"></div>
			</div>

			<button id="continue-btn" type="button">Continue</button>
			<p id="status-message" class="status" role="status" aria-live="polite"></p>
		</section>
	</main>
`;

const searchControl = document.querySelector("#search-control");
const searchInput = document.querySelector("#club-search");
const dropdown = document.querySelector("#club-dropdown");
const continueButton = document.querySelector("#continue-btn");
const statusMessage = document.querySelector("#status-message");

function setStatus(message, tone = "info") {
	statusMessage.textContent = message;
	statusMessage.className = `status ${tone}`;
}

function toggleDropdown(open) {
	state.dropdownOpen = open;
	dropdown.classList.toggle("hidden", !open);
}

function renderDropdownItems() {
	dropdown.innerHTML = "";

	if (state.filteredTeams.length === 0) {
		const empty = document.createElement("p");
		empty.className = "dropdown-empty";
		empty.textContent = "No clubs found.";
		dropdown.appendChild(empty);
		return;
	}

	const fragment = document.createDocumentFragment();

	state.filteredTeams.forEach((team) => {
		const option = document.createElement("button");
		option.type = "button";
		option.className = "dropdown-option";
		option.setAttribute("role", "option");

		if (team.badge) {
			const badge = document.createElement("img");
			badge.src = team.badge;
			badge.alt = `${team.name} badge`;
			badge.loading = "lazy";
			option.appendChild(badge);
		} else {
			const badgeFallback = document.createElement("span");
			badgeFallback.className = "badge-fallback";
			badgeFallback.setAttribute("aria-hidden", "true");
			option.appendChild(badgeFallback);
		}

		const name = document.createElement("span");
		name.textContent = team.name;
		option.appendChild(name);

		option.addEventListener("click", () => {
			state.selectedTeam = team;
			searchInput.value = team.name;
			toggleDropdown(false);
			setStatus("", "info");
		});

		fragment.appendChild(option);
	});

	dropdown.appendChild(fragment);
}

function filterTeams(query) {
	const term = query.trim().toLowerCase();

	if (!term) {
		state.filteredTeams = [...state.teams];
		return;
	}

	state.filteredTeams = state.teams.filter((team) =>
		team.name.toLowerCase().includes(term),
	);
}

function bindEvents() {
	searchInput.addEventListener("focus", () => {
		if (!searchInput.disabled) {
			filterTeams(searchInput.value);
			renderDropdownItems();
			toggleDropdown(true);
		}
	});

	searchInput.addEventListener("input", (event) => {
		filterTeams(event.target.value);
		renderDropdownItems();
		toggleDropdown(true);

		if (
			state.selectedTeam &&
			event.target.value.trim().toLowerCase() !==
				state.selectedTeam.name.toLowerCase()
		) {
			state.selectedTeam = null;
		}
	});

	document.addEventListener("click", (event) => {
		if (!searchControl.contains(event.target)) {
			toggleDropdown(false);
		}
	});

	continueButton.addEventListener("click", () => {
		if (!state.selectedTeam) {
			setStatus("Please select a club before continuing.", "error");
			return;
		}

		localStorage.setItem("footyhub_team_id", state.selectedTeam.id);
		localStorage.setItem("footyhub_team_name", state.selectedTeam.name);

		console.log("Selected team:", {
			id: state.selectedTeam.id,
			name: state.selectedTeam.name,
		});

		setStatus("Club selected successfully.", "success");
	});
}

async function loadTeams() {
	setStatus("Loading clubs...", "info");

	try {
		const response = await fetch(CLUBS_API_URL);

		if (!response.ok) {
			throw new Error("Failed to fetch club data.");
		}

		const payload = await response.json();

		if (!Array.isArray(payload.teams)) {
			throw new Error("Invalid response format.");
		}

		state.teams = payload.teams
			.map((team) => ({
				id: team.idTeam,
				name: team.strTeam,
				badge: team.strBadge || team.strLogo || "",
			}))
			.filter((team) => team.id && team.name)
			.sort((a, b) => a.name.localeCompare(b.name));

		state.filteredTeams = [...state.teams];
		searchInput.disabled = false;
		setStatus("Type to search and pick a club.", "info");
	} catch (error) {
		setStatus(`Could not load clubs. ${error.message}`, "error");
	}
}

bindEvents();
loadTeams();
