const API_URL = "http://localhost:4000/characters"

//Elementos del DOM
const grid = document.getElementById("charactersGrid")
const statusText = document.getElementById("statusText")
const charactersCount = document.getElementById("charactersCount")
const teamSlots = document.getElementById("teamSlots")
const teamSlotsCounter = document.getElementById("teamSlotsCounter")
const teamCounter = document.getElementById("teamCounter")
const teamNameInput = document.getElementById("teamNameInput")
const saveTeamBtn = document.getElementById("saveTeamBtn")
const clearTeamBtn = document.getElementById("clearTeamBtn")
const teamPower = document.getElementById("teamPower")

if (clearTeamBtn) {
    clearTeamBtn.addEventListener("click", clearTeam)
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

const LF_PLATE_IMAGE = './assets/imgs/CharaInfo_icnLimitedPlate.webp'

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
            const colorHex = COLOR_MAP[character.color?.toUpperCase()] || "#666"

            html += `
                <div class="team-slot filled team-slot-tile" style="background: ${colorHex}">
                    <img class="slot-image" 
                         src="${character.image_url}" 
                         alt="${character.name}"
                         loading="lazy"
                         onerror="this.src='./assets/imgs/placeholder.webp'">
                    <button class="slot-remove slot-remove-overlay" 
                            onclick="removeFromTeam(${i})" 
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
function updateButtons(){
    if (saveTeamBtn) {
        saveTeamBtn.disabled = currentTeam.length === 0
    }
}

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

function buildCard(character) {
    const colorBg = getColorBackground(character.color)
    const rarityLabel = character.rarity ?? "N/D"
    const rarityKey = (rarityLabel || '').toString().trim().toUpperCase()
    const rarityImg = RARITY_IMAGE_MAP[rarityKey]
    const rarityClass = getRarityClass(rarityLabel)
    const colorLabel = character.color ?? "N/D"
    const rarityHtml = rarityImg
        ? `<img class="rarity-img" src="${rarityImg}" alt="${rarityKey}">`
        : `<span class="rarity-badge ${rarityClass}">${rarityLabel}</span>`
    const lfCardClass = character.is_lf ? " lf-card" : ""
    const lfPlateHtml = character.is_lf
        ? `
            <div class="lf-plate-wrap" aria-hidden="true">
                <img class="lf-plate" src="${LF_PLATE_IMAGE}" alt="Limited Fighter">
                <span class="lf-plate-label">LEGENDS LIMITED</span>
            </div>
        `
        : ""


    return `
        <article class="character-card${lfCardClass}" style="--card-accent: ${colorBg}">
            <div class="character-media" style="background: ${colorBg};">
                <img src="${character.image_url}" alt="${character.name}" loading="lazy">
            </div>

            <div class="character-info">
                <div class="name-row">
                    <h3>${character.name}</h3>
                    <span class="character-id">${character.id ?? "Sin ID"}</span>
                </div>
                <div class="meta-row">
                    <span class="color-pill">${colorLabel}</span>
                    ${rarityHtml}
                </div>
                <button class="btn-add-team" onclick='addToTeam(${JSON.stringify(character).replace(/'/g, "&#39;")})'>
                    Agregar al equipo
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
    charactersCount.textContent = `${characters.length} personaje${characters.length === 1 ? "" : "s"}`
}

async function loadCharacters() {
    try {
        statusText.textContent = "Cargando personajes..."

        const response = await fetch(API_URL)

        if (!response.ok) {
            throw new Error(`Error al consultar la API: ${response.status}`)
        }

        const characters = await response.json()

        try {
            renderCharacters(characters)
        } catch (renderError) {
            console.error(renderError)
            grid.innerHTML = `
                <div class="empty-state">
                    Se recibieron los datos, pero ocurrió un error al renderizar las cards. Revisa la consola del navegador.
                </div>
            `
            statusText.textContent = "Error al renderizar personajes"
            charactersCount.textContent = "0 personajes"
            return
        }

        statusText.textContent = "Personajes cargados correctamente"
    } catch (error) {
        console.error(error)
        grid.innerHTML = `
            <div class="empty-state">
                No se pudo cargar la API. Verifica que el backend esté corriendo en <strong>http://localhost:4000</strong>.
            </div>
        `
        statusText.textContent = "Error al cargar personajes"
        charactersCount.textContent = "0 personajes"
    }
}

loadCharacters()
renderTeamSlots()