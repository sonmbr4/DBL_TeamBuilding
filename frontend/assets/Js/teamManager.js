const TEAM_API_URL = "http://localhost:4000/api/teams"


class TeamManager {
    constructor() {
        this.savedTeams = []
        this.currentTeamId = null
    }

    //Guardar equipo en mongo
    async saveTeam(teamData) {
        try {
            const response = await fetch(TEAM_API_URL, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(teamData)
            })

            const result = await response.json()

            if (!response.ok || !result.success) {
                const errorMsg = result.details
                    ? (Array.isArray(result.details) ? result.details.join(', ') : result.details)
                    : (result.error || 'Error desconocido')
                throw new Error(errorMsg)
            }

            return {
                success: true,
                message: `Equipo "${teamData.name}" guardado exitosamente`,
                data: result.data
            }

        } catch (error) {
            console.error('Error al guardar el equipo:', error)
            return {
                success: false,
                message: error.message || 'Error de conexión al guardar el equipo'
            }
        }
    }

    //Cargar todos los equipos guardados
    async loadSavedTeams(page = 1, limit = 20) {
        try {
            const response = await fetch(`${TEAM_API_URL}?page=${page}&limit=${limit}`)
            const result = await response.json()

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Error al cargar equipos')
            }

            this.savedTeams = result.data
            return {
                success: true,
                data: result.data,
                pagination: result.pagination
            }

        } catch (error) {
            console.error('Error al cargar equipos:', error)
            return {
                success: false,
                message: error.message,
                data: []
            }
        }
    }

    //Cargar un equipo específico por ID
    async loadTeamById(teamId) {
        try {
            const response = await fetch(`${TEAM_API_URL}/${teamId}`)
            const result = await response.json()

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Equipo no encontrado')
            }

            this.currentTeamId = teamId
            return {
                success: true,
                data: result.data
            }

        } catch (error) {
            console.error('Error al cargar el equipo:', error)
            return {
                success: false,
                message: error.message
            }
        }
    }

    //Actualizar un equipo existente
    async updateTeam(teamId, teamData) {
        try {
            const response = await fetch(`${TEAM_API_URL}/${teamId}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(teamData)
            })

            const result = await response.json()

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Error al actualizar el equipo')
            }

            return {
                success: true,
                message: 'Equipo actualizado exitosamente',
                data: result.data
            }

        } catch (error) {
            console.error('Error al actualizar el equipo:', error)
            return {
                success: false,
                message: error.message
            }
        }
    }

    // Eliminar un equipo
    async deleteTeam(teamId) {
        try {
            const response = await fetch(`${TEAM_API_URL}/${teamId}`, {
                method: 'DELETE'
            })

            const result = await response.json()

            if (!response.ok || !result.success) {
                throw new Error(result.error || 'Error al eliminar el equipo')
            }

            return {
                success: true,
                message: 'Equipo eliminado exitosamente'
            }

        } catch (error) {
            console.error('Error al eliminar el equipo:', error)
            return {
                success: false,
                message: error.message
            }
        }
    }

    //Renderizar lista de equipos guardados
    async renderTeamList(containerId = 'savedTeamsList', statusId = 'savedTeamsStatus', countId = 'savedTeamsCount') {
        const container = document.getElementById(containerId)
        const statusEl = document.getElementById(statusId)
        const countEl = document.getElementById(countId)

        if (!container) return

        try {
            if (statusEl) statusEl.textContent = 'Cargando equipos. . .'
            container.innerHTML = '<div class="loading-text">Cargando equipos. . .</div>'

            const result = await this.loadSavedTeams()

            if (!result.success || result.data.length === 0) {
                container.innerHTML = '<div class="saved-teams-empty">No hay equipos guardados.</div>'

                if (statusEl) statusEl.textContent = 'Sin equipos guardados'
                if (countEl) countEl.textContent = '0 equipos'
                return
            }

            const teams = result.data
            if (statusEl) statusEl.textContent = `${teams.length} equipo(s) encontrado(s)`
            if (countEl) countEl.textContent = `${teams.length} equipo(s)`

            container.innerHTML = teams.map(team => {
                //Obtener URLL de la imagen del primer personaje (lider)
                const leaderImage = team.characters?.[0]?.image_url || ''
                const leaderName = team.characters?.[0]?.name || 'Sin líder'

                //Fondo: imagen del líder con fallback a gradiente oscuro
                const backgroundStyle = leaderImage
                    ? `background-image: url('${leaderImage}'); background-size: cover; background-position: center;`
                    : 'background: linear-gradient(135deg, #384964, #0f172a);'

                const date = new Date(team.createdAt).toLocaleDateString('es-Es', {
                    day: 'numeric', month: 'short', year: 'numeric'
                })
                const power = team.stats?.totalPower || 0
                const charCount = team.characters?.length || 0
                const characterName = team.characters?.[0]?.name || 'Sin personajes'

                return `
                    <div class="saved-team-card" style="${backgroundStyle}">
                        <div class="saved-team-card-overlay">
                            <div class="saved-team-header">
                                <h4>${team.name}</h4>
                                <span class="saved-team-date">${date}</span>
                            </div>
                            <div class="saved-team-meta">
                                <span class="saved-team-chip">👥 ${charCount}/6</span>
                                <span class="saved-team-chip">⚡ ${power.toLocaleString()}</span>
                                <span class="saved-team-chip">⭐ ${leaderName}</span>
                            </div>
                            <div class="saved-team-character-list">
                                ${characterName}
                            </div>
                            <div class="saved-team-actions">
                                <button class="btn-small btn-load" onclick="window.loadTeamById('${team._id}')">📂 Cargar</button>
                                <button class="btn-small btn-delete" onclick="window.deleteTeamById('${team._id}')">🗑️ Eliminar</button>
                            </div>
                        </div>
                    </div>
                `
            }).join('')
        } catch (error) {
            console.error(error)
            container.innerHTML = '<div class="saved-teams-empty">Error al cargar equipos. intenta de nuevo</div>'
            if (statusEl) statusEl.textContent = 'Error al cargar equipos'
        }
    }
}

//Instancia global del TeamManager
const teamManager = new TeamManager()
window.teamManager = teamManager

// Funciones globalespara botones (se llaman desde el HTML)
window.loadTeamById = async (id) => {
    const result = await teamManager.loadTeamById(id)
    if (result.success){
        alert(`Equipo "${result.data.name}" cargando. Implementa la lógica para llevarlo al builder.`)
    } else {
        alert('Error al cargar el equipo')
    }
}

window.deleteTeamById = async (id) => {
    if(!confirm('¿Estás seguro de que deseas eliminar este equipo? Esta acción no se puede deshacer.')) return
    const result = await teamManager.deleteTeam(id)
    if (result.success) {
        teamManager.renderTeamList() //Refresta la lista
    } else {
        alert('Error al eliminar el equipo')
    }
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    teamManager.renderTeamList()

    const refreshBtn = document.getElementById('refreshSavedTeamsBtn')
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => teamManager.renderTeamList())
    }
})

