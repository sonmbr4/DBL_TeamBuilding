const savedTeamsList = document.getElementById("savedTeamsList")
const savedTeamsStatus = document.getElementById("savedTeamsStatus")
const savedTeamsCount = document.getElementById("savedTeamsCount")
const refreshSavedTeamsBtn = document.getElementById("refreshSavedTeamsBtn")

function escapeHtml(value) {
    return String(value ?? "")
        .replace(/&/g, "&amp;")
        .replace(/</g, "&lt;")
        .replace(/>/g, "&gt;")
        .replace(/\"/g, "&quot;")
        .replace(/'/g, "&#39;")
}

function formatDate(dateValue) {
    if (!dateValue) {
        return "Sin fecha"
    }

    return new Date(dateValue).toLocaleString("es-ES", {
        year: "numeric",
        month: "short",
        day: "numeric",
        hour: "2-digit",
        minute: "2-digit"
    })
}

function renderSavedTeams(teams) {
    if (!savedTeamsList) {
        return
    }

    savedTeamsCount.textContent = `${teams.length} equipo${teams.length === 1 ? "" : "s"}`

    if (!teams.length) {
        savedTeamsList.innerHTML = `
            <div class="saved-teams-empty">
                No hay equipos guardados todavía.
                <br>
                Vuelve al builder, crea un equipo y presiona Guardar Equipo.
            </div>
        `
        return
    }

    savedTeamsList.innerHTML = teams.map((team) => {
        const characterNames = (team.characters || []).map((character) => escapeHtml(character.name)).join(" · ")
        const tags = Array.isArray(team.tags) && team.tags.length ? team.tags.join(" · ") : "Sin tags destacados"
        const totalPower = team.stats?.totalPower ?? 0
        const averagePower = team.stats?.averagePower ?? 0

        return `
            <article class="saved-team-card">
                <div class="saved-team-header">
                    <h4>${escapeHtml(team.name)}</h4>
                    <span class="saved-team-date">${formatDate(team.createdAt)}</span>
                </div>
                <div class="saved-team-meta">
                    <span class="saved-team-chip">Personajes: ${(team.characters || []).length}/6</span>
                    <span class="saved-team-chip">Power total: ${Number(totalPower).toLocaleString("es-ES")}</span>
                    <span class="saved-team-chip">Power promedio: ${Number(averagePower).toLocaleString("es-ES")}</span>
                </div>
                <p class="saved-team-character-list">${characterNames || "Sin personajes"}</p>
                <p class="saved-team-tags">Tags: ${escapeHtml(tags)}</p>
                <div class="saved-team-actions">
                    <button class="btn-small btn-delete" type="button" data-team-id="${team._id}">Eliminar</button>
                </div>
            </article>
        `
    }).join("")
}

async function loadSavedTeams() {
    if (!savedTeamsList) {
        return
    }

    savedTeamsStatus.textContent = "Actualizando equipos guardados..."
    savedTeamsList.innerHTML = '<div class="loading-text">Cargando equipos...</div>'

    const result = await teamManager.loadSavedTeams()

    if (!result.success) {
        savedTeamsStatus.textContent = "No se pudieron cargar los equipos"
        savedTeamsList.innerHTML = `<div class="saved-teams-empty">${escapeHtml(result.message)}</div>`
        return
    }

    savedTeamsStatus.textContent = "Equipos cargados correctamente"
    renderSavedTeams(result.data || [])
}

async function deleteTeam(teamId) {
    const team = teamManager.savedTeams.find((savedTeam) => savedTeam._id === teamId)
    const teamName = team?.name || "este equipo"

    if (!confirm(`¿Eliminar ${teamName}?`)) {
        return
    }

    const result = await teamManager.deleteTeam(teamId)

    if (!result.success) {
        alert(result.message)
        return
    }

    await loadSavedTeams()
}

if (refreshSavedTeamsBtn) {
    refreshSavedTeamsBtn.addEventListener("click", loadSavedTeams)
}

if (savedTeamsList) {
    savedTeamsList.addEventListener("click", async (event) => {
        const button = event.target.closest("[data-team-id]")

        if (!button) {
            return
        }

        await deleteTeam(button.dataset.teamId)
    })
}

document.addEventListener("DOMContentLoaded", loadSavedTeams)