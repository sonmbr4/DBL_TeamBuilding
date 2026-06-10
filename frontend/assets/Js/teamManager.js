const TEAM_API_URL = "/api/teams";

const TEAM_LEADER_COLOR_MAP = {
    RED: "#C7201E",
    BLU: "#0B81F6",
    YEL: "#DCC50B",
    PUR: "#8F12E4",
    GRN: "#1DC720",
    LGT: "#C2C1AB",
    DRK: "#64748b"
}

let currentTeamNameFilter = '';
let currentTeamColorFilter = 'ALL';
let allLoadedTeams = []; //Cache de todos los equipos






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

    //Aplicar filtros a los equipos
    filterTeams(teams, nameFilter = '', colorFilter = 'ALL') {
        let filtered = [...teams];

        //filtrar por nombre
        if (nameFilter && nameFilter.trim()) {
            const term = nameFilter.trim().toLowerCase();
            filtered = filtered.filter(team =>
                team.name.toLowerCase().includes(term)
            );
        }

        //Filtrar por color del líder
        if (colorFilter !== 'ALL') {
            filtered = filtered.filter(team => {
                const leader = team.characters?.[0];
                const leaderColor = leader?.color?.toString().trim().toUpperCase() || '';
                return leaderColor === colorFilter.toUpperCase();
            });
        }

        return filtered;
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

            //Guardar en caché
            allLoadedTeams = result.data;

            //Aplicar filtros actuales
            const filteredTeams = this.filterTeams(
                allLoadedTeams,
                currentTeamNameFilter,
                currentTeamColorFilter
            );

            this.renderFilteredTeams(filteredTeams, container, statusEl, countEl);

        } catch (error) {
            console.error(error)
            container.innerHTML = '<div class="saved-teams-empty">Error al cargar equipos. intenta de nuevo</div>'
            if (statusEl) statusEl.textContent = 'Error al cargar equipos'
        }
    }

    //Nuevo metodo de renterizado
    renderFilteredTeams(teams, container, statusEl, countEl) {
        if (teams.length === 0) {
            container.innerHTML = '<div class="saved-teams-empty">No se encontraron equipos.</div>';
            if (statusEl) statusEl.textContent = 'Sin resultados';
            if (countEl) countEl.textContent = '0 equipos';
            return;
        }

        if (statusEl) statusEl.textContent = `${teams.length} equipo(s) encontrado(s)`;
        if (countEl) countEl.textContent = `${teams.length} equipo(s)`;

        container.innerHTML = teams.map(team => {
            //Obtener URLL de la imagen del primer personaje (lider)
            const leader = team.characters?.[0];
            const leaderImage = leader?.image_url || '';
            const leaderColor = leader?.color?.toString().trim().toUpperCase() || '';
            const cssColor = TEAM_LEADER_COLOR_MAP[leaderColor] || '#888';

            //Fondo: imagen del líder con fallback a gradiente oscuro
            const backgroundStyle = leaderImage
                ? `background-image: url('${leaderImage}'); background-size: cover; background-position: center;`
                : 'background: linear-gradient(135deg, #1e293b, #0f172a);';

            const date = new Date(team.createdAt).toLocaleDateString('es-Es', {
                day: 'numeric', month: 'short', year: 'numeric'
            })
            const power = team.stats?.totalPower || 0
            const charCount = team.characters?.map(c=> c.name)

            return `
                    <div class="saved-team-card" style="${backgroundStyle} --leader-color: ${cssColor};">
                        <div class="saved-team-card-overlay">
                            <div class="saved-team-header">
                                <h4>${team.name}</h4>
                            </div>
                            <div class="saved-team-meta">
                                <span class="saved-team-chip">⚡ ${power.toLocaleString()}</span>
                            </div>
                            <div class="saved-team-actions">
                                <button class="btn-small btn-view" onclick="window.openTeamDetail('${team._id}')"> Ver Equipo completo</button>
                            </div>
                        </div>
                    </div>
                `
        }).join('');
    }

    //Helper para escapar HTML
    escapeHtml(text){
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }
}

//Instancia global del TeamManager
const teamManager = new TeamManager()
window.teamManager = teamManager

// Funciones globalespara botones (se llaman desde el HTML)
window.loadTeamById = async (id) => {
    const result = await teamManager.loadTeamById(id)
    if (result.success) {
        alert(`Equipo "${result.data.name}" cargando. Implementa la lógica para llevarlo al builder.`)
    } else {
        alert('Error al cargar el equipo')
    }
}

/*
window.deleteTeamById = async (id) => {
    if(!confirm('¿Estás seguro de que deseas eliminar este equipo? Esta acción no se puede deshacer.')) return
    const result = await teamManager.deleteTeam(id)
    if (result.success) {
        teamManager.renderTeamList() //Refresta la lista
    } else {
        alert('Error al eliminar el equipo')
    }
}
*/

window.openTeamDetail = (teamId) => {
    const cleanId = String(teamId).trim();
    window.location.href = `/equipo/${cleanId}`;
}

// Inicializar al cargar la página
document.addEventListener('DOMContentLoaded', () => {
    teamManager.renderTeamList();

    const refreshBtn = document.getElementById('refreshSavedTeamsBtn');
    if (refreshBtn) {
        refreshBtn.addEventListener('click', () => teamManager.renderTeamList());
    }

    // ⭐ Filtro por nombre de equipo
    const teamSearchInput = document.getElementById('teamSearchInput');
    let searchDebounceTimer = null;
    
    if (teamSearchInput) {
        teamSearchInput.addEventListener('input', () => {
            clearTimeout(searchDebounceTimer);
            searchDebounceTimer = setTimeout(() => {
                currentTeamNameFilter = teamSearchInput.value.trim();
                const filteredTeams = teamManager.filterTeams(
                    allLoadedTeams,
                    currentTeamNameFilter,
                    currentTeamColorFilter
                );
                teamManager.renderFilteredTeams(
                    filteredTeams,
                    document.getElementById('savedTeamsList'),
                    document.getElementById('savedTeamsStatus'),
                    document.getElementById('savedTeamsCount')
                );
            }, 150);
        });
    }

    // ⭐ Filtro por color del líder
    const teamColorFilter = document.getElementById('teamColorFilter');
    if (teamColorFilter) {
        teamColorFilter.addEventListener('change', () => {
            currentTeamColorFilter = teamColorFilter.value || 'ALL';
            const filteredTeams = teamManager.filterTeams(
                allLoadedTeams,
                currentTeamNameFilter,
                currentTeamColorFilter
            );
            teamManager.renderFilteredTeams(
                filteredTeams,
                document.getElementById('savedTeamsList'),
                document.getElementById('savedTeamsStatus'),
                document.getElementById('savedTeamsCount')
            );
        });
    }
});

