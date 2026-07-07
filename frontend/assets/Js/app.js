const API_URL = "api/characters"
const API_TEAMS_URL = "api/teams"

//Elementos del DOM
const grid = document.getElementById("charactersGrid")
const statusText = document.getElementById("statusText")
const charactersCount = document.getElementById("charactersCount")
const characterSearchInput = document.getElementById("characterSearchInput")
const characterColorFilter = document.getElementById("characterColorFilter")
const characterRarityFilter = document.getElementById("characterRarityFilter")
const teamSlots = document.getElementById("teamSlots")
const teamSlotsCounter = document.getElementById("teamSlotsCounter")
const teamCounter = document.getElementById("teamCounter")
const teamNameInput = document.getElementById("teamNameInput")
const saveTeamBtn = document.getElementById("saveTeamBtn")
const clearTeamBtn = document.getElementById("clearTeamBtn")
const teamPower = document.getElementById("teamPower")
const equipmentModal = new EquipmentModal()

if (clearTeamBtn) {
    clearTeamBtn.addEventListener("click", clearTeam)
}

if (saveTeamBtn) {
    saveTeamBtn.addEventListener("click", saveTeam)
}

//Estado del equipo
const MAX_SLOTS = 6
let currentTeam = []
const numberFormatter = new Intl.NumberFormat("es-ES")

const COLOR_MAP = {
    RED: "#C7201E",
    BLU: "#0B81F6",
    YEL: "#DCC50B",
    PUR: "#8F12E4",
    GRN: "#1DC720",
    LGT: "#C2C1AB",
    DRK: "#64748b"
}

const RARITY_CLASS_MAP = {
    LEGEND: "rarity-legend",
    ULTRA: "rarity-ultra",
    SPARKING: "rarity-sparking",
    EXTREME: "rarity-extreme",
    HERO: "rarity-hero"
}

// Mapa de imágenes para rarezas (solo ULTRA por ahora)
const RARITY_IMAGE_MAP = {
    LEGEND: './assets/imgs/Rareza/Gas_txtRarity_LEGEND.webp',
    ULTRA: './assets/imgs/Rareza/Gas_txtRarity_ULTRA.webp',
    SPARKING: './assets/imgs/Rareza/Gas_txtRarity_SPARKING.webp',
    EXTREME: './assets/imgs/Rareza/Gas_txtRarity_EXTREME.webp',
    HERO: './assets/imgs/Rareza/Gas_txtRarity_HERO.webp'
}

const TAG_BADGE_IMAGE = 'https://dblegends.net/assets/icon_elements/MChaIco_icnTagChange.webp';


const LF_PLATE_IMAGE = './assets/imgs/CharaInfo_icnLimitedPlate.webp'

const TYPE_COLOR_ICON_MAP = {
    RED: './assets/imgs/TypeColor/Cmn_icnAttributeRED1.webp',
    BLU: './assets/imgs/TypeColor/Cmn_icnAttributeBLU1.webp',
    YEL: './assets/imgs/TypeColor/Cmn_icnAttributeYEL1.webp',
    PUR: './assets/imgs/TypeColor/Cmn_icnAttributePUR1.webp',
    GRN: './assets/imgs/TypeColor/Cmn_icnAttributeGRN1.webp',
    LGT: './assets/imgs/TypeColor/Cmn_icnAttributeLGT1.webp'
}

let searchDebounceTimer = null
let currentColorFilter = "ALL"
let currentRarityFilter = "ALL"


if (characterSearchInput) {
    characterSearchInput.addEventListener("input", () => {
        window.clearTimeout(searchDebounceTimer)

        searchDebounceTimer = window.setTimeout(() => {
            loadCharacters(
                characterSearchInput.value.trim(),
                currentColorFilter,
                currentRarityFilter
            )
        }, 150)
    })
}

if (characterColorFilter) {
    characterColorFilter.addEventListener("change", () => {
        currentColorFilter = characterColorFilter.value || "ALL"
        loadCharacters(
            characterSearchInput ? characterSearchInput.value.trim() : "",
            currentColorFilter,
            currentRarityFilter
        )
    })
}

if (characterRarityFilter) {
    characterRarityFilter.addEventListener("change", () => {
        currentRarityFilter = characterRarityFilter.value || "ALL"
        loadCharacters(
            characterSearchInput ? characterSearchInput.value.trim() : "",
            currentColorFilter,
            currentRarityFilter
        )
    })
}

// === TEAM BUILDER FUNCIONES ===

//Agregar personaje al equipo
function addToTeam(character) {
    //Validar que no este lleno
    if (currentTeam.length >= MAX_SLOTS) {
        alert("Equipo completo. No puedes agregar más personajes.")
        return
    }

    //Validar que no este duplicado
    if (currentTeam.find(p => p.id === character.id)) {
        alert("Este personaje ya está en tu equipo.")
        return
    }

    currentTeam.push(character)
    renderTeamSlots()
    updateButtons()
}

async function openEquipmentModal(teamIndex) {
    const character = currentTeam[teamIndex]

    if (!character) {
        return
    }

    await equipmentModal.open(character, teamIndex)
}

function buildCharactersUrl(searchTerm = "") {
    const normalizedSearchTerm = searchTerm.trim()

    if (!normalizedSearchTerm) {
        return API_URL
    }

    return `${API_URL}?name=${encodeURIComponent(normalizedSearchTerm)}`
}

function applyColorFilter(characters, colorFilter = "ALL") {
    const normalizedFilter = colorFilter.toString().trim().toUpperCase()

    if (normalizedFilter === "ALL" || !normalizedFilter) {
        return characters
    }

    return characters.filter((character) => {
        const normalizedCharacterColor = (character.color || "").toString().trim().toUpperCase()
        return normalizedCharacterColor === normalizedFilter
    })
}

function applyRarityFilter(characters, rarityFilter = "ALL") {
    const normalizedFilter = rarityFilter.toString().trim().toUpperCase()

    if (normalizedFilter === "ALL") {
        return characters
    }

    return characters.filter((character) => {
        const normalizedCharacterRarity = (character.rarity || "").toString().trim().toUpperCase()
        return normalizedCharacterRarity === normalizedFilter
    })
}


function getEquipmentImageUrl(equipment) {
    const rawUrl = (equipment?.image_url || '').toString().trim()

    if (!rawUrl) {
        return './assets/imgs/Equipments/eq_PlaceHolder.webp'
    }

    let url = rawUrl.replace(/\.wep$/i, '.webp')

    if (url.startsWith('/assets')) {
        url = `.${url}`
    }

    return url;
}

function renderTeamEquipmentSlots(character) {
    const equipments = Array.isArray(character?.equipments) ? character.equipments : []

    return Array.from({ length: 3 }, (_, index) => {
        const equipment = equipments[index]

        if (!equipment) {
            return `
                <div class="team-equipment-slot empty">
                    <span class="team-equipment-placeholder">+</span>
                </div>
            `
        }

        const imageUrl = getEquipmentImageUrl(equipment)
        const fallbackLabel = (equipment.name || '?').trim().charAt(0).toUpperCase()

        return `
            <div class="team-equipment-slot filled">
                ${imageUrl
                ? `<img class="team-equipment-image" src="${imageUrl}" alt="${equipment.name}">`
                : `<div class="team-equipment-image team-equipment-fallback" aria-hidden="true">${fallbackLabel}</div>`}
            </div>
        `
    }).join('')
}

//Eliminar personaje del equipo
function removeFromTeam(index) {
    currentTeam.splice(index, 1)
    renderTeamSlots()
    updateButtons()
}

//limpiar todo el equipo
function clearTeam() {
    currentTeam = []
    renderTeamSlots()
    updateButtons()

    if (teamNameInput) {
        teamNameInput.value = ""
    }
}

//Renderizar los slots del equipo
function renderTeamSlots() {
    let html = ""

    for (let i = 0; i < MAX_SLOTS; i++) {
        const character = currentTeam[i]

        if (character) {
            //Slot ocupado
            html += `
                <div class="team-slot filled team-slot-tile" onclick="openEquipmentModal(${i})" onkeydown="if(event.key==='Enter' || event.key===' '){openEquipmentModal(${i})}" tabindex="0" role="button" aria-label="Abrir equipamientos de ${character.name}">
                    <div class="team-slot-portrait">
                        <img class="slot-image" 
                             src="${character.image_url}" 
                             alt="${character.name}"
                             loading="lazy"
                             onerror="this.src='./assets/imgs/placeholder.webp'">
                    </div>
                    <div class="team-equipment-row" aria-label="Equipamientos de ${character.name}">
                        ${renderTeamEquipmentSlots(character)}
                    </div>
                    <button class="slot-remove slot-remove-overlay" 
                            onclick="event.stopPropagation(); removeFromTeam(${i})" 
                            title="Eliminar del equipo">
                        ✕
                    </button>
                </div>
            `
        } else {
            html += `
                <div class="team-slot team-slot-empty">
                    <span class="slot-placeholder">${i + 1}</span>
                </div>
            `
        }
    }

    teamSlots.innerHTML = html
    teamSlotsCounter.textContent = `${currentTeam.length} / ${MAX_SLOTS}`
    if (teamCounter) {
        teamCounter.textContent = `${currentTeam.length} / ${MAX_SLOTS}`
    }

    updateTeamPower()
}

function getCharacterPower(character) {
    const powerValue = character?.max_stats?.power ?? character?.power ?? 0
    const numericPower = Number(powerValue)

    return Number.isFinite(numericPower) ? numericPower : 0
}

function updateTeamPower() {
    if (!teamPower) {
        return
    }

    const totalPower = currentTeam.reduce(
        (accumulator, character) => accumulator + getCharacterPower(character),
        0
    )

    teamPower.textContent = numberFormatter.format(totalPower)
}

//Actualizar estado de botones
function updateButtons() {
    if (saveTeamBtn) {
        saveTeamBtn.disabled = currentTeam.length === 0
    }
}

function buildTeamPayload() {
    const teamName = teamNameInput?.value.trim()

    if (!teamName) {
        showNotification("⚠️ Por favor, asigna un nombre al equipo", "error")
        return null
    }

    return {
        name: teamName,
        characters: currentTeam.map((character, index) => ({
            character_id: String(character.id || character.character_id || index),
            name: character.name || "Desconocido",
            color: character.color || "N/D",
            rarity: character.rarity || "N/D",
            image_url: character.image_url || "",
            position: index + 1,
            power: getCharacterPower(character),
            health: Number(character?.max_stats?.health || character?.health || 0) || 0,
            tags: Array.isArray(character.tags) ? character.tags : [],
            equipments: Array.isArray(character.equipments)
                ? character.equipments.slice(0, 3).map((equipment, eqIndex) => ({
                    id: equipment.id || `eq-${index}-${eqIndex}`,
                    name: equipment.name || "Equipamiento",
                    type: equipment.type || "",
                    rarity: equipment.rarity || "",
                    image_url: equipment.image_url || "",
                    effects: equipment.effects || {}
                }))
                : []
        }))
    }
}

async function saveTeam() {
    if (!currentTeam.length) {
        showNotification("⚠️ No hay personajes en el equipo", "error")
        return
    }

    const payload = buildTeamPayload()
    if (!payload) return // Ya se mostró la notificación de error

    if (saveTeamBtn) {
        saveTeamBtn.disabled = true
        saveTeamBtn.textContent = "⏳ Guardando..."
    }

    try {
        // Si estamos editando un equipo existente
        if (teamManager.currentTeamId) {
            const result = await teamManager.updateTeam(teamManager.currentTeamId, payload)

            if (result.success) {
                showNotification(`✅ ${result.message}`, "success")
                statusText.textContent = "Equipo actualizado correctamente"
            } else {
                showNotification(`❌ ${result.message}`, "error")
            }
        } else {
            // Nuevo equipo
            const result = await teamManager.saveTeam(payload)

            if (result.success) {
                showNotification(`✅ ${result.message}`, "success")
                statusText.textContent = `Equipo "${payload.name}" guardado`

                // Mostrar ID del equipo guardado
                console.log('Equipo guardado:', result.data)

                // Opcional: limpiar el equipo después de guardar
                if (confirm("¿Quieres limpiar el equipo actual?")) {
                    clearTeam()
                }
            } else {
                showNotification(`❌ ${result.message}`, "error")
            }
        }

        // Recargar lista de equipos guardados
        await loadAndRenderSavedTeams()

    } catch (error) {
        console.error('Error:', error)
        showNotification("❌ Error inesperado al guardar", "error")
    } finally {
        if (saveTeamBtn) {
            saveTeamBtn.disabled = currentTeam.length === 0
            saveTeamBtn.textContent = "💾 Guardar Equipo"
        }
    }
}

// Cargar un equipo guardado al builder
async function loadTeamToBuilder(teamId) {
    const result = await teamManager.loadTeamById(teamId)

    if (!result.success) {
        showNotification(`❌ ${result.message}`, "error")
        return
    }

    const team = result.data

    // Convertir personajes del equipo al formato del builder
    currentTeam = team.characters.map(char => ({
        id: char.character_id,
        name: char.name,
        color: char.color,
        rarity: char.rarity,
        image_url: char.image_url,
        power: char.power || 0,
        health: char.health || 0,
        tags: char.tags || [],
        equipments: char.equipments || [],
        max_stats: {
            power: char.power || 0,
            health: char.health || 0
        }
    }))

    // Actualizar UI
    if (teamNameInput) {
        teamNameInput.value = team.name || ""
    }

    teamManager.currentTeamId = team._id
    renderTeamSlots()
    updateButtons()

    // Cambiar texto del botón
    if (saveTeamBtn) {
        saveTeamBtn.textContent = "📝 Actualizar Equipo"
    }

    showNotification(`✅ Equipo "${team.name}" cargado`, "success")
    statusText.textContent = `Editando: ${team.name}`
}

// Eliminar un equipo guardado
async function deleteSavedTeam(teamId, teamName) {
    if (!confirm(`¿Estás seguro de eliminar el equipo "${teamName}"?`)) return

    const result = await teamManager.deleteTeam(teamId)

    if (result.success) {
        showNotification(`🗑️ ${result.message}`, "info")

        // Si estamos editando este equipo, limpiar el builder
        if (teamManager.currentTeamId === teamId) {
            clearTeam()
            teamManager.currentTeamId = null
            if (saveTeamBtn) {
                saveTeamBtn.textContent = "💾 Guardar Equipo"
            }
            statusText.textContent = "Personajes cargados"
        }

        await loadAndRenderSavedTeams()
    } else {
        showNotification(`❌ ${result.message}`, "error")
    }
}

// Cargar y renderizar equipos guardados
async function loadAndRenderSavedTeams() {
    const container = document.getElementById("savedTeamsList")
    if (!container) return

    container.innerHTML = '<p class="loading-text">Cargando equipos...</p>'

    const result = await teamManager.loadSavedTeams()

    if (!result.success) {
        container.innerHTML = `<p class="empty-state">Error al cargar equipos: ${result.message}</p>`
        return
    }

    renderSavedTeams(result.data)
}

// Renderizar lista de equipos guardados
function renderSavedTeams(teams) {
    const container = document.getElementById("savedTeamsList")
    if (!container) return

    if (!teams || teams.length === 0) {
        container.innerHTML = `
            <div class="empty-state">
                <p>📭 No hay equipos guardados aún</p>
                <p style="font-size: 0.85rem;">Crea tu primer equipo y guárdalo aquí</p>
            </div>
        `
        return
    }

    container.innerHTML = teams.map(team => {
        const date = new Date(team.createdAt).toLocaleDateString('es-ES', {
            year: 'numeric',
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit'
        })

        const characterNames = team.characters
            .slice(0, 3)
            .map(c => c.name)
            .join(', ')

        const moreCount = team.characters.length > 3
            ? ` +${team.characters.length - 3} más`
            : ''

        return `
            <div class="saved-team-card ${teamManager.currentTeamId === team._id ? 'active' : ''}">
                <div class="saved-team-header">
                    <h4>${escapeHtml(team.name)}</h4>
                    <span class="saved-team-date">${date}</span>
                </div>
                <div class="saved-team-characters">
                    ${characterNames}${moreCount}
                </div>
                <div class="saved-team-info">
                    <span class="team-stat">
                        <span class="stats-label">Personajes:</span> 
                        <span class="stats-value">${team.characters.length}/6</span>
                    </span>
                    <span class="team-stat">
                        <span class="stats-label">Power:</span> 
                        <span class="stats-value">${team.stats?.totalPower?.toLocaleString() || 'N/A'}</span>
                    </span>
                </div>
                <div class="saved-team-actions">
                    <button onclick="loadTeamToBuilder('${team._id}')" class="btn-small btn-load">
                        📂 Cargar
                    </button>
                    <button onclick="deleteSavedTeam('${team._id}', '${escapeHtml(team.name)}')" class="btn-small btn-delete">
                        🗑️ Eliminar
                    </button>
                </div>
            </div>
        `
    }).join('')
}

// Sistema de notificaciones mejorado
function showNotification(message, type = "info") {
    // Eliminar notificación anterior si existe
    const existingNotification = document.querySelector('.notification-toast')
    if (existingNotification) {
        existingNotification.remove()
    }

    const notification = document.createElement("div")
    notification.className = `notification-toast notification-${type}`

    const icons = {
        success: '✅',
        error: '❌',
        info: 'ℹ️',
        warning: '⚠️'
    }

    notification.innerHTML = `
        <span class="notification-icon">${icons[type] || ''}</span>
        <span class="notification-message">${message}</span>
    `

    // Agregar estilos si no existen
    if (!document.getElementById('notification-toast-styles')) {
        const style = document.createElement('style')
        style.id = 'notification-toast-styles'
        style.textContent = `
            .notification-toast {
                position: fixed;
                bottom: 24px;
                right: 24px;
                padding: 14px 20px;
                border-radius: 12px;
                font-weight: 600;
                font-size: 0.9rem;
                z-index: 9999;
                display: flex;
                align-items: center;
                gap: 10px;
                min-width: 280px;
                max-width: 420px;
                box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4);
                animation: slideInRight 0.3s ease;
                backdrop-filter: blur(10px);
            }
            .notification-success {
                background: rgba(34, 197, 94, 0.95);
                color: #fff;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            .notification-error {
                background: rgba(239, 68, 68, 0.95);
                color: #fff;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            .notification-info {
                background: rgba(59, 130, 246, 0.95);
                color: #fff;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            .notification-warning {
                background: rgba(234, 179, 8, 0.95);
                color: #000;
                border: 1px solid rgba(255, 255, 255, 0.2);
            }
            .notification-icon {
                font-size: 1.2rem;
                flex-shrink: 0;
            }
            .notification-message {
                flex: 1;
                line-height: 1.4;
            }
            @keyframes slideInRight {
                from {
                    transform: translateX(120%);
                    opacity: 0;
                }
                to {
                    transform: translateX(0);
                    opacity: 1;
                }
            }
            @keyframes slideOutRight {
                from {
                    transform: translateX(0);
                    opacity: 1;
                }
                to {
                    transform: translateX(120%);
                    opacity: 0;
                }
            }
        `
        document.head.appendChild(style)
    }

    document.body.appendChild(notification)

    // Auto-eliminar después de 3.5 segundos
    setTimeout(() => {
        notification.style.animation = 'slideOutRight 0.3s ease forwards'
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove()
            }
        }, 300)
    }, 3500)

    // Cerrar al hacer click
    notification.addEventListener('click', () => {
        notification.style.animation = 'slideOutRight 0.3s ease forwards'
        setTimeout(() => {
            if (notification.parentNode) {
                notification.remove()
            }
        }, 300)
    })
}

// Inicializar cuando el DOM esté listo
document.addEventListener('DOMContentLoaded', () => {
    loadCharacters()
    loadAndRenderSavedTeams()
    renderTeamSlots()
})









// === FUNCIONES DE RENDERIZACION DE CARDS ===


function getColorBackground(colorType) {
    if (!colorType) {
        return "rgba(255, 255, 255, 0.12)"
    }

    const normalizedColor = colorType.toString().trim().toUpperCase()
    return COLOR_MAP[normalizedColor] || "rgba(255, 255, 255, 0.12)"
}

//funcion para obtener un gradiente más intenso
function getRarityClass(rarity) {
    const normalizedRarity = (rarity || "").toString().trim().toUpperCase()
    return RARITY_CLASS_MAP[normalizedRarity] || "rarity-default"
}

function getTypeColorIcon(color) {
    const normalizedColor = (color || "").toString().trim().toUpperCase()
    return TYPE_COLOR_ICON_MAP[normalizedColor] || null
}

function buildCard(character) {
    const colorBg = getColorBackground(character.color)
    const rarityLabel = character.rarity ?? "N/D"
    const rarityKey = (rarityLabel || '').toString().trim().toUpperCase()
    const rarityImg = RARITY_IMAGE_MAP[rarityKey]
    const rarityClass = getRarityClass(rarityLabel)
    const colorLabel = character.color ?? "N/D"



    //Si es personaje TAG
    const isTag = character.is_tag === true;
    const hasMultipleImages = isTag && Array.isArray(character.image_url) && character.image_url.length >= 2;



    const rarityHtml = rarityImg
        ? `<img class="rarity-img" src="${rarityImg}" alt="${rarityKey}">`
        : `<span class="rarity-badge ${rarityClass}">${rarityLabel}</span>`



    //Tag al lado de la rareza
    const tagBadgeHtml = isTag
        ? `<img class="tag-badge-img" src="${TAG_BADGE_IMAGE}" alt="TAG" title="Personaje TAG">`
        : "";



    const lfCardClass = character.is_lf ? " lf-card" : ""
    const tagClass = isTag ? " tag-mode" : "";


    const typeColorIcon = getTypeColorIcon(character.color)
    const typeColorHtml = typeColorIcon
        ? `<img class="character-type-icon" src="${typeColorIcon}" alt="${character.color || 'Attribute'}">`
        : `<span class="character-type-icon character-type-icon-fallback">${character.color || ''}</span>`


    const lfPlateHtml = character.is_lf
        ? `
            <div class="lf-plate-wrap" aria-hidden="true">
                <img class="lf-plate" src="${LF_PLATE_IMAGE}" alt="Limited Fighter">
                <span class="lf-plate-label">LEGENDS LIMITED</span>
            </div>
        `
        : ""



    let imageHtml;



    if (hasMultipleImages) {
        //Carousel de imagenes para personajes Tag
        const images = character.image_url;
        imageHtml = `
            <div class="tag-image-container" data-tag-images='${JSON.stringify(images)}'>
                <img class="tag-image active" 
                     src="${images[0]}" 
                     alt="${character.name}"
                     loading="lazy"
                     onerror="this.src='./assets/imgs/placeholder.webp'">
                <img class="tag-image inactive" 
                     src="${images[1]}" 
                     alt="${character.name} (Alternativo)"
                     loading="lazy"
                     onerror="this.src='./assets/imgs/placeholder.webp'">
                <div class="tag-indicator">
                    <span class="tag-dot active" data-index="0"></span>
                    <span class="tag-dot" data-index="1"></span>
                </div>
                <span class="tag-label">TAG</span>
            </div>
        `
    } else {
        //Imagen unica normal
        const imageUrl = Array.isArray(character.image_url)
            ? character.image_url[0]
            : character.image_url;
        imageHtml = `
            <img src="${imageUrl}"
                 alt="${character.name}">
        `
    }



    return `
        <article class="character-card${lfCardClass}" style="--card-accent: ${colorBg}">
            <div class="character-type-badge" aria-hidden="true">
                ${typeColorHtml}
            </div>
            <div class="character-media" style="background: ${colorBg};">
                ${imageHtml}
            </div>

            <div class="character-info">
                <div class="name-row">
                    <h3>${character.name}</h3>
                    <span class="character-id">${character.id ?? "Sin ID"}</span>
                </div>
                <div class="meta-row">
                    ${rarityHtml}
                    ${tagBadgeHtml}
                </div>
                <button class="btn-add-team" onclick='addToTeam(${JSON.stringify(character).replace(/'/g, "&#39;")})'>
                    Add to team
                </button>
            </div>

            ${lfPlateHtml}
        </article>
    `
}





function renderCharacters(characters) {
    if (!characters.length) {
        grid.innerHTML = '<div class="empty-state">No se encontraron personajes para mostrar.</div>'
        charactersCount.textContent = "0 personajes"
        return
    }

    grid.innerHTML = characters.map(buildCard).join("")
}

async function loadCharacters(searchTerm = "", colorFilter = "ALL", rarityFilter = "ALL") {
    try {
        statusText.textContent = "Cargando personajes..."

        const response = await fetch(buildCharactersUrl(searchTerm))

        if (!response.ok) {
            throw new Error(`Error al consultar la API: ${response.status}`)
        }

        const characters = await response.json()

        try {
            const colorFilteredCharacters = applyColorFilter(characters, colorFilter)
            const filteredCharacters = applyRarityFilter(colorFilteredCharacters, rarityFilter)
            renderCharacters(filteredCharacters)
        } catch (renderError) {
            console.error(renderError)
            grid.innerHTML = `
                <div class="empty-state">
                    Se recibieron los datos, pero ocurrió un error al renderizar las cards. Revisa la consola del navegador.
                </div>
            `
            statusText.textContent = "Error al renderizar personajes"
            return
        }

        const hasSearch = Boolean(searchTerm)
        const hasColorFilter = colorFilter !== "ALL"
        const hasRarityFilter = rarityFilter !== "ALL"

        if (hasSearch && hasColorFilter && hasRarityFilter) {
            statusText.textContent = `Results for "${searchTerm}", color ${colorFilter} and rarity ${rarityFilter}`
        } else if (hasSearch && hasColorFilter) {
            statusText.textContent = `Results for "${searchTerm}" and color ${colorFilter}`
        } else if (hasSearch && hasRarityFilter) {
            statusText.textContent = `Results for "${searchTerm}" and rarity ${rarityFilter}`
        } else if (hasSearch) {
            statusText.textContent = `Resultados para "${searchTerm}"`
        } else if (hasColorFilter && hasRarityFilter) {
            statusText.textContent = `Filtered by color ${colorFilter} and rarity ${rarityFilter}`
        } else if (hasColorFilter) {
            statusText.textContent = `Filtered by color ${colorFilter}`
        } else if (hasRarityFilter) {
            statusText.textContent = `Filtered by rarity ${rarityFilter}`
        } else {
            statusText.textContent = "Loaded characters"
        }
    } catch (error) {
        console.error(error)
        grid.innerHTML = `
            <div class="empty-state">
                No se pudo cargar la API. Verifica que el backend esté corriendo en <strong>http://localhost:4000</strong>.
            </div>
        `
        statusText.textContent = "Error al cargar personajes"
    }
}



// === Funcion transicon de imagenes para personajes Tag ===
function initTagImageCarousels() {
    const tagContainers = document.querySelectorAll('.tag-image-container');

    tagContainers.forEach(container => {
        //Evitar inicializar multiples veces
        if (container.dataset.initialized === 'true') return;
        container.dataset.initialized = 'true';

        const images = container.querySelectorAll('.tag-image');
        const dots = container.querySelectorAll('.tag-dot');

        if (images.length < 2) return;

        let currentIndex = 0;
        let intervalId;

        function switchImage(newIndex) {
            // Remover clases actuales
            images[currentIndex].classList.remove('active');
            images[currentIndex].classList.add('inactive');
            dots[currentIndex].classList.remove('active');

            // Activar nueva imagen
            currentIndex = newIndex;
            images[currentIndex].classList.remove('inactive');
            images[currentIndex].classList.add('active');
            dots[currentIndex].classList.add('active');
        }

        function nextImage() {
            const nextIndex = (currentIndex + 1) % images.length;
            switchImage(nextIndex);
        }

        //Cambiar cada 5 segundos
        intervalId = setInterval(nextImage, 5000);
        
        // Guardar referencia para limpieza
        container.dataset.intervalId = intervalId;
    })
}


// Llamar después de renderizar personajes
function renderCharacters(characters) {
    if (!characters.length) {
        grid.innerHTML = '<div class="empty-state">No se encontraron personajes para mostrar.</div>';
        charactersCount.textContent = "0 personajes";
        return;
    }

    grid.innerHTML = characters.map(buildCard).join("");
    
    // ⭐ Inicializar carousels TAG después de renderizar
    setTimeout(initTagImageCarousels, 100);
}