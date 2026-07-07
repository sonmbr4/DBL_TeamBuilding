class EquipmentModal {
    constructor() {
        this.currentCharacter = null;
        this.currentTeamIndex = null;
        this.allEquipments = [];
        this.modal = null;
        this.maxEquipments = 3;
        this.isLoaded = false;
        this.boundHandleKeyDown = this.handleKeyDown.bind(this);
    }

    //Cargar equipamientos desde el backend
    async loadEquipments() {
        try {
            const response = await fetch('api/equipment');
            if (response.ok) {
                this.allEquipments = await response.json();
            } else {
                //Si no hay backend usar datos de ejemplo
                this.allEquipments = this.getDefaultEquipments();
            }
        } catch (error) {
            console.warn('Usando equipamientos de ejemplo: ', error);
            this.allEquipments = this.getDefaultEquipments();
        }

        this.isLoaded = true;
        return this.allEquipments;
    }

    async ensureEquipmentsLoaded() {
        if (!this.isLoaded) {
            await this.loadEquipments();
        }

        return this.allEquipments;
    }

    //Datos de ejemplo por si no hay backend
    getDefaultEquipments() {
        return [
            {
                id: "EQ001",
                name: "This Is the Kaioken!",
                type: "Melee",
                rarity: "Gold",
                image_url: "./assets/imgs/Equipment/eq001.webp",
                effects: { base: "Strike Attack +15%" }
            },
            {
                id: "EQ002",
                name: "You Stay Here!",
                type: "Ranged",
                rarity: "Gold",
                image_url: "./assets/imgs/Equipment/eq002.webp",
                effects: { base: "Blast Attack +15%" }
            },
            {
                id: "EQ003",
                name: "Awakened Hybrids",
                type: "Defense",
                rarity: "Platinum",
                image_url: "./assets/imgs/Equipment/eq003.webp",
                effects: { base: "Base Health +10%" }
            },
            {
                id: "EQ004",
                name: "Universal Survival Saga",
                type: "Support",
                rarity: "Gold",
                image_url: "./assets/imgs/Equipment/eq004.webp",
                effects: { base: "Ki Recovery +10%" }
            }
        ];
    }

    getEquipmentImageUrl(equipment) {
        const rawUrl = (equipment?.image_url || '').toString().trim();
        if (!rawUrl) {
            return null;
        }
        return rawUrl
            .replace('/assets/imgs/equipments/', '/assets/imgs/Equipment/')
            .replace(/\.wep$/i, '.webp');
    }

    getEquipmentFallbackLabel(equipment) {
        return (equipment?.name || '?').trim().charAt(0).toUpperCase();
    }

    renderEquipmentVisual(equipment, className) {
        const imageUrl = this.getEquipmentImageUrl(equipment);
        if (imageUrl) {
            return `<img class="${className}" src="${imageUrl}" alt="${equipment.name}">`;
        }
        return `
            <div class="${className} equipment-fallback" aria-hidden="true" >
                <span>${this.getEquipmentFallbackLabel(equipment)}</span>
            </div>
        `;
    }

    getColorForCharacter(character) {
        const colorMap = {
            RED: '#C7201E',
            BLU: '#0B81F6',
            YEL: '#DCC50B',
            PUR: '#8F12E4',
            GRN: '#1DC720',
            LGT: '#C2C1AB',
            DRK: '#64748b'
        };

        const normalizedColor = character?.color?.toString().trim().toUpperCase();
        return colorMap[normalizedColor] || '#7dd3fc';
    }

    //Abrir modal para un personaje específico
    async open(character, teamIndex) {
        this.currentCharacter = character;
        this.currentTeamIndex = teamIndex;

        //Inicializar equipamientos del personaje si no existen
        if (!this.currentCharacter.equipments) {
            this.currentCharacter.equipments = [];
        }

        await this.ensureEquipmentsLoaded();

        this.render();

    }

    //Cerrar modal
    close() {
        if (this.modal) {
            document.removeEventListener('keydown', this.boundHandleKeyDown);
            this.modal.remove();
            this.modal = null;
        }
    }

    filterAndRenderEquipments() {
        if (!this.modal) return;

        const searchInput = this.modal.querySelector('#equipmentSearchInput');
        const rarityFilter = this.modal.querySelector('#equipmentRarityFilter');
        const equipmentList = this.modal.querySelector('#equipmentList');

        if (!equipmentList) return;

        const searchTerm = searchInput?.value?.trim().toLowerCase() || '';
        const rarityValue = rarityFilter?.value || 'ALL';

        let filtered = [...this.allEquipments];

        // Filtrar por búsqueda
        if (searchTerm) {
            filtered = filtered.filter(eq =>
                eq.name.toLowerCase().includes(searchTerm)
            );
        }

        // Filtrar por rareza
        if (rarityValue !== 'ALL') {
            filtered = filtered.filter(eq =>
                eq.rarity?.toLowerCase() === rarityValue.toLowerCase()
            );
        }

        // Re-renderizar la lista
        equipmentList.innerHTML = filtered.length === 0
            ? '<div class="empty-state">No se encontraron equipamientos.</div>'
            : filtered.map(equipment => {
                const equipped = this.currentCharacter.equipments.some(
                    item => item.id === equipment.id
                );
                const effectText = this.getEquipmentEffectText(equipment);

                return `
                <button class="equipment-list-item${equipped ? ' selected' : ''}" 
                        type="button" 
                        data-equipment-id="${equipment.id}">
                    ${this.renderEquipmentVisual(equipment, 'equipment-list-img')}
                    <div class="equipment-list-info">
                        <p class="equipment-list-name">${equipment.name}</p>
                        <p class="equipment-list-effect">${effectText}</p>
                    </div>
                </button>
            `;
            }).join('');
    }






    // Renderizar el modal completo
    render() {
        this.close(); //Cerrar modal existente si hay uno

        const overlay = document.createElement('div');
        overlay.className = 'modal-overlay';

        const colorBg = this.getColorForCharacter(this.currentCharacter);

        overlay.innerHTML = `
            <div class="modal" style="--card-accent: ${colorBg}">
                <div class="modal-header">
                    <div class="modal-character-info">
                        <img class="modal-character-img" 
                             src="${this.currentCharacter.image_url}" 
                             alt="${this.currentCharacter.name}"
                             style="border-color: ${colorBg}"
                             onerror="this.onerror=null;this.src='./assets/imgs/Equipment/eq_PlaceHolder.webp';">
                        <div>
                            <h2 class="modal-character-name">${this.currentCharacter.name}</h2>
                            <p class="modal-character-meta">
                                ${this.currentCharacter.rarity || 'N/D'} • 
                                ${this.currentCharacter.color || 'N/D'} • 
                                Equipment: ${this.currentCharacter.equipments.length}/${this.maxEquipments}
                            </p>
                        </div>
                    </div>
                    <button class="modal-close" id="closeModal">✕</button>
                </div>

                <div class="equipment-slots" id="equipmentSlots">
                    ${this.renderEquipmentSlots()}
                </div>

                <div class="equipment-list">
                    <h3 class="equipment-list-title">Available Equipment</h3>
                    <div class="equipment-list-grid" id="equipmentList">
                        ${this.renderEquipmentList()}
                    </div>
                </div>
            </div>
        `;

        this.modal = overlay;
        document.body.appendChild(overlay);

        overlay.addEventListener('click', (event) => {
            if (event.target === overlay) {
                this.close();
            }
        });

        // event Listeners
        this.attachEvents();
        this.filterAndRenderEquipments();
    }

    renderEquipmentSlots() {
        return Array.from({ length: this.maxEquipments }, (_, index) => {
            const equipment = this.currentCharacter.equipments[index];

            if (!equipment) {
                return `
                    <div class="equipment-slot" data-slot-index="${index}">
                        <span class="slot-label">Slot ${index + 1}</span>
                        <span class="equipment-empty-text">Vacío</span>
                    </div>
                `;
            }

            return `
                <div class="equipment-slot filled" data-slot-index="${index}">
                    <span class="slot-label">Slot ${index + 1}</span>
                    <button class="equipment-remove" type="button" data-remove-index="${index}" aria-label="Quitar equipamiento">✕</button>
                    <div class="equipment-item">
                        ${this.renderEquipmentVisual(equipment, 'equipment-img')}
                        <p class="equipment-name">${equipment.name}</p>
                    </div>
                </div>
            `;
        }).join('');
    }

    renderEquipmentList() {
        if (!this.allEquipments.length) {
            return '<div class="empty-state">No hay equipamientos disponibles.</div>';
        }

        return this.allEquipments.map((equipment) => {
            const equipped = this.currentCharacter.equipments.some((item) => item.id === equipment.id);
            const effectText = this.getEquipmentEffectText(equipment);

            return `
                <button class="equipment-list-item${equipped ? ' selected' : ''}" type="button" data-equipment-id="${equipment.id}">
                        ${this.renderEquipmentVisual(equipment, 'equipment-list-img')}
                    <div class="equipment-list-info">
                        <p class="equipment-list-name">${equipment.name}</p>
                        <p class="equipment-list-effect">${effectText}</p>
                    </div>
                    </button>
            `;
        }).join('');
    }

    getEquipmentEffectText(equipment) {
        if (equipment?.effects?.base) {
            return equipment.effects.base;
        }

        if (equipment?.Slots?.slot_1) {
            return equipment.Slots.slot_1;
        }

        if (equipment?.type) {
            return equipment.type;
        }

        return 'Sin efecto';
    }

    attachEvents() {
        if (!this.modal) {
            return;
        }

        const closeButton = this.modal.querySelector('#closeModal');

        if (closeButton) {
            closeButton.addEventListener('click', () => this.close());
        }

        // ⭐ Delegación de eventos: escuchar clicks en todo el modal
        const modalContent = this.modal.querySelector('.modal');
        if (modalContent) {
            modalContent.addEventListener('click', (event) => {
                const target = event.target;

                // Click en botón de equipamiento
                const equipButton = target.closest('[data-equipment-id]');
                if (equipButton) {
                    event.preventDefault();
                    this.equipEquipment(equipButton.dataset.equipmentId);
                    return;
                }

                // Click en botón de eliminar equipamiento
                const removeButton = target.closest('[data-remove-index]');
                if (removeButton) {
                    event.preventDefault();
                    event.stopPropagation();
                    this.removeEquipment(Number(removeButton.dataset.removeIndex));
                    return;
                }
            });
        }

        document.addEventListener('keydown', this.boundHandleKeyDown);
    }

    handleKeyDown(event) {
        if (event.key === 'Escape') {
            this.close();
        }
    }

    equipEquipment(equipmentId) {
        const equipment = this.allEquipments.find((item) => String(item.id) === String(equipmentId));

        if (!equipment) {
            return;
        }

        if (this.currentCharacter.equipments.some((item) => item.id === equipment.id)) {
            return;
        }

        if (this.currentCharacter.equipments.length >= this.maxEquipments) {
            alert('No hay espacio para más equipamientos.');
            return;
        }

        this.currentCharacter.equipments.push(equipment);
        this.render();
        if (typeof renderTeamSlots === 'function') {
            renderTeamSlots();
        }
    }

    removeEquipment(slotIndex) {
        this.currentCharacter.equipments.splice(slotIndex, 1);
        this.render();
        if (typeof renderTeamSlots === 'function') {
            renderTeamSlots();
        }
    }
}