// teamDetail.js – Renderiza el detalle completo de un equipo

// Agrega esta función al inicio de teamDetail.js
function fixImageUrl(url) {
    if (!url) return './assets/imgs/Characters/BChaCut_9800_Shallot_01.webp';
    
    // Si ya es una URL absoluta, devolverla
    if (url.startsWith('http://') || url.startsWith('https://')) {
        return url;
    }
    
    // Si empieza con ./ o ../ o solo el nombre, convertir a absoluta
    if (url.startsWith('./')) {
        return url.replace('./', '/');
    }
    
    // Si empieza con assets/ (sin barra inicial)
    if (url.startsWith('assets/')) {
        return '/' + url;
    }
    
    // Si no empieza con /, agregarla
    if (!url.startsWith('/')) {
        return '/' + url;
    }
    
    return url;
}




// ⭐ Obtener ID desde la ruta limpia /equipo/:id
function getTeamIdFromUrl() {
    // Opción 1: Extraer de la ruta /equipo/ID
    const pathParts = window.location.pathname.split('/').filter(part => part !== '');
    
    // Buscar el patrón: ["equipo", "ID"]
    const equipoIndex = pathParts.findIndex(part => part.toLowerCase() === 'equipo');
    if (equipoIndex !== -1 && pathParts[equipoIndex + 1]) {
        return pathParts[equipoIndex + 1];
    }
    
    // Opción 2: Fallback a query string ?id=xxx (compatibilidad)
    const urlParams = new URLSearchParams(window.location.search);
    const queryId = urlParams.get('id');
    if (queryId) return queryId;
    
    return null;
}

const teamId = getTeamIdFromUrl();

if (!teamId) {
    document.getElementById('teamDetailSection').innerHTML = `
        <div class="saved-teams-empty">
            <p>No se especificó un equipo.</p>
            <a href="/equipos">Ver equipos guardados</a>
        </div>
    `;
} else {
    console.log('ID del equipo:', teamId); // Para debug
    loadAndRenderTeamDetail(teamId);
}

async function loadAndRenderTeamDetail(teamId) {
    const container = document.getElementById('teamDetailSection');

    try {
        container.innerHTML = '<div class="loading-text">Cargando detalles del equipo...</div>';

        const result = await window.teamManager.loadTeamById(teamId);

        if (!result.success) {
            container.innerHTML = `<div class="saved-teams-empty">Error: ${result.message}</div>`;
            return;
        }

        const team = result.data;
        renderTeamDetail(team, container);

    } catch (error) {
        console.error(error);
        container.innerHTML = '<div class="saved-teams-empty">Error inesperado al cargar el equipo.</div>';
    }
}

function getEquipmentImageUrl(equipment) {
    const rawUrl = (equipment?.image_url || '').toString().trim();

    if (!rawUrl) {
        return null;
    }

    return rawUrl
        .replace('/assets/imgs/equipments/', '/assets/imgs/Equipment/')
        .replace(/\.wep$/i, '.webp');
}



function renderTeamDetail(team, container) {
    const date = new Date(team.createdAt).toLocaleDateString('en-EN', {
        year: 'numeric', month: 'numeric', day: 'numeric',
        hour: '2-digit', minute: '2-digit'
    });

    const power = team.stats?.totalPower?.toLocaleString() || '0';
    const avgPower = team.stats?.averagePower?.toLocaleString() || '0';
    const health = team.stats?.totalHealth?.toLocaleString() || '0';
    const charCount = team.characters?.length || 0;

    // Generar las cards de personajes con sus equipamientos
    const charactersHtml = team.characters.map((char, index) => {
        const equipments = char.equipments || [];
        const equipmentSlotsHtml = Array.from({ length: 3 }, (_, i) => {
            const eq = equipments[i];
            if (eq) {
                return `
                    <div class="team-equipment-slot filled">
                        <img class="team-equipment-image" 
                             src="${getEquipmentImageUrl(eq) || './assets/imgs/eq_PlaceHolder.webp'}" 
                             alt="${eq.name}">
                    </div>
                `;
            } else {
                return `<div class="team-equipment-slot empty"><span>+</span></div>`;
            }
        }).join('');

        return `
            <div class="detail-character-card">
                <div class="detail-character-image" style="background-color: ${getColorForCharacter(char)}">
                    <img src="${fixImageUrl(char.image_url)}" alt="${char.name}" 
                         onerror="this.src='./assets/imgs/Characters/BChaCut_9800_Shallot_01.webp'">
                </div>
                <div class="detail-character-info">
                    <h3>${char.name}</h3>
                    <div class="detail-character-meta">
                        <span>${char.color || 'N/D'}</span>
                    </div>
                    <div class="detail-character-equipments">
                        <p class="equipment-section-title">Equipamientos</p>
                        <div class="team-equipment-row">
                            ${equipmentSlotsHtml}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }).join('');

    const leader = team.characters?.[0] || null;
    const leaderColor = getColorForCharacter(leader) || '#2d2d2d';
    const leaderHtml = leader ? `
        <div class="team-detail-leader">
        <div class="leader-image" style="background: linear-gradient(to left, ${leaderColor}, ${leaderColor}dd 40%, transparent 90%);">
            <img src="${fixImageUrl(leader.image_url)}" 
                 alt="${leader.name}"
                 onerror="this.src='./assets/imgs/Characters/BChaCut_9800_Shallot_01.webp'">
        </div>
    </div>
    ` : '';



    const html = `
        <div class="team-detail">
            <div class="team-detail-header" style="background-image: url('${fixImageUrl(leader?.image_url) || null}'); --leader-color: ${getColorForCharacter(leader)};">
                <div class="team-detail-header-left">
                    <h1>${escapeHtml(team.name)}</h1>
                </div>
                <div class="team-detail-stats">
                    <div class="stat-box">
                        <span class="stat-label">Chracters</span>
                        <span class="stat-value">${charCount} / 6</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-label">Total Power</span>
                        <span class="stat-value">${power}</span>
                    </div>
                    <div class="stat-box">
                        <span class="stat-label">Average Power</span>
                        <span class="stat-value">${avgPower}</span>
                    </div>
                </div>
            </div>
            </div>

           

            <div class="team-detail-characters">
                <h2>Team characters</h2>
                <div class="detail-characters-grid">
                    ${charactersHtml}
                </div>
            </div>

            ${team.tags && team.tags.length ? `
            <div class="team-detail-tags">
                <h2>Tags comunes</h2>
                <div class="tags-list">
                    ${team.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
                </div>
            </div>
            ` : ''}
        </div>
    `;

    container.innerHTML = html;
}

// Helper para obtener el color de fondo según el color del personaje
function getColorForCharacter(char) {
    const colorMap = {
        RED: "#C7201E", BLU: "#0B81F6", YEL: "#DCC50B",
        PUR: "#8F12E4", GRN: "#1DC720", LGT: "#C2C1AB", DRK: "#64748b"
    };
    const color = char.color?.toString().trim().toUpperCase();
    return colorMap[color] || '#2d2d2d';
}

function escapeHtml(text) {
    const div = document.createElement('div');
    div.textContent = text;
    return div.innerHTML;
}