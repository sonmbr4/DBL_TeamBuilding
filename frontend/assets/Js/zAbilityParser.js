class ZAbilityParser {
    constructor() {
        //Mapeo de condiciones comunes a tags/atributos
        this.conditionMap = {
            //TAGS
            'saiyan': 'Saiyan',
            'Hybrid saiyan': 'Hybrid Saiyan',
            'Super saiyan': 'Super Saiyan',
            'Super saiyan': 'Super Saiyan 2',
            'Super saiyan': 'Super Saiyan 3',
            'Super saiyan': 'Super Saiyan 4',
            'Super saiyan': 'Super Saiyan God',
            'Super Saiyan God SS': 'Super Saiyan God SS',
            'Super Saiyan Rosé': 'Super Saiyan Rosé',
            'Namekian': 'Namekian',
            'Android': 'Android',
            'Shadow Dragons': 'Shadow Dragons',
            'God of Destruction': 'God of Destruction',
            'Angel': 'Angel',
            'Kid': 'Kid',
            'Girl': 'Girl',
            'regeneration': 'Regeneration',
            'powerful opponent': 'Powerful Opponent',
            'Transforming Warrior': 'Transforming Warrior',
            'lineage of evil': 'Lineage of Evil',
            'Twins': 'Twins',
            'Otherworld Warrior': 'Otherworld Warrior',
            'fusion warrior': 'Fusion Warrior',
            'god ki': 'God Ki',
            'Son Family': 'Son Family',
            'vegeta family': 'Vegeta Family',
            'Super Warrior': 'Super Warrior',
            'Frieza Force': 'Frieza Force',
            'Ginyu Force': 'Ginyu Force',
            'Team Bardock': 'Team Bardock',
            'Hera Clan': 'Hera Clan',
            'Turles Crusher Corps': 'Turles Crusher Corps',
            'future': 'Future',
            'gt': 'GT',
            'DAIMA': 'DAIMA',
            'Merging': 'Merging',
            'Absorption': 'Absorption',
            'fusion': 'Fusion',
            'potara': 'Potara',
            'waipon warrior': 'Waipon Warrior',
            'rival Universe': 'Rival Universe',
            'universe 2': 'Universe 2',
            'universe 4': 'Universe 4',
            'universe 6': 'Universe 6',
            'universe 9': 'Universe 9',
            'universe 11': 'Universe 11',
            'universe rep': 'Universe Rep',
            'dragon ball': 'Dragon Ball',
            'event exclusive': 'Event Exclusive',
            'legends road': 'Legends Road',
            '1°': '1°',
            '2°': '2°',
            '3°': '3°',
            '4°': '4°',
            '5°': '5°',
            '6°': '6°',
            '7°': '7°',
            '8°': '8°',


            //Sagas
            'game originals': 'Game Originals',
            'Dragon Ball Saga': 'Dragon Ball Saga',
            'Saiyan Saga (Z)': 'Saiyan Saga (Z)',
            'Frieza Saga (Z)': 'Frieza Saga (Z)',
            'Android Saga (Z)': 'Android Saga (Z)',
            'cell saga': 'Cell Saga (Z)',
            'Majin Buu Saga(Z)': 'Majin Buu Saga(Z)',
            'Black Star Dragon Ball Saga (GT)': 'Black Star Dragon Ball Saga (GT)',
            'super baby saga (GT)': 'Super Baby Saga (GT)',
            'Super #17 Saga (GT)': 'Super #17 Saga (GT)',
            'Shadow Dragon Saga (GT)': 'Shadow Dragon Saga (GT)',
            'God of Destruction Beerus Saga (S)': 'God of Destruction Beerus Saga (S)',
            'sagas from the movies': 'Sagas From the Movies',
            'universe survival saga': 'Universe Survival Saga',
            'potara': 'Potara',
            'android': 'Android',
            'goku': 'Goku',

            //Colores
            'element red': 'RED',
            'element yellow': 'YEL',
            'element purple': 'PUR',
            'element green': 'GRN',
            'element blue': 'BLU',
            'element light': 'LGT',
            'element dark': 'DRK',
            
            // Rarezas
            'legend': 'LEGEND',
            'ultra': 'ULTRA',
            'sparking': 'SPARKING',
            'extreme': 'EXTREME',
            'hero': 'HERO',
            
            // Episodios/Sagas
            'dragon ball super': 'Dragon Ball Super',
            'dragon ball z': 'Dragon Ball Z',
            'dragon ball gt': 'GT',
        }

        //Patrones de porcentaje
        this.percentPattern = /(\d+(?:\.\d+)?)\s*%/g;

        //Patrones de stat
        this.statPatterns = {
            strikeAttack: /strike\s*(attack|atk)/i,
            blastAttack: /blast\s*(attack|atk)/i,
            strikeDefense: /strike\s*(defense|def)/i,
            blastDefense: /blast\s*(defense|def)/i,
            health: /(base\s*)?health/i,
            kiRecovery: /ki\s*recovery/i,
            critical: /critical/i,
            specialMove: /special\s*move/i,
            ultimate: /ultimate/i
        }
    }

    //Extraer condiciones de texto
    extractConditions(text){
        if (!text) return [];

        const conditions = [];
        const lowerText = text.toLowerCase();

        //Buscar patrones
        const conditionPatterns = [
            /if\s+(.+?)(?:,|\.|\s*\+)/gi,
            /when\s+(.+?)(?:,|\.|\s*\+)/gi,
            /for\s+(.+?)(?:,|\.|\s*\+)/gi,
        ];

        conditionPatterns.forEach(pattern => {
            let match;
            while ((match = pattern.exec(text)) !== null) {
                const condition = match[1].trim();
                if (condition && !conditions.includes(condition)) {
                    conditions.push(condition)
                }
            }
        });

        //Buscar condiciones implicitas
        for (const [key, value] of Object.entries(this.conditionMap)) {
            if (lowerText.includes(key) && !conditions.includes(value)) {
                conditions.push(value);
            }
        }

        return conditions;
    }

    //Extraer efectos/bonus numéricos
    extractEffects(text){
        if (!text) return {};

        const effects = {};
        const lowerText = text.toLowerCase();

        //Extraer porcentajes
        const percentages = [];
        let match;
        while ((match = this.percentPattern.exec(text)) !== null) {
            percentages.push(parseFloat(match[1]));
        }

        //Detectar tipo de stat y asiignar porcentaje
        let percentIndex = 0;
        for (const [stat, pattern] of Object.entries(this.statPatterns)) {
            if (pattern.test(lowerText) && percentIndex < percentages.length) {
                effects[stat] = percentages[percentIndex];
                percentIndex++;
            }
        }

        //Si hay pocentajes sin asignar, agregarlos como bonus
        if (percentIndex < percentages.length) {
            effects.genericBonus = percentages.slice(percentIndex).reduce((a,b) => a + b, 0);
        }

        return effects;
    }

    // Verificar si un personaje cumple una condición
    characterMatchesCondition(character, condition) {
        if (!character || !condition) return false;
        
        const lowerCondition = condition.toLowerCase().trim();
        
        // Verificar tags
        if (character.tags && Array.isArray(character.tags)) {
            const hasTag = character.tags.some(tag => 
                lowerCondition.includes(tag.toLowerCase()) || 
                tag.toLowerCase().includes(lowerCondition)
            );
            if (hasTag) return true;
        }
        
        // Verificar color/elemento
        if (character.color) {
            const colorMap = {
                'red': 'RED', 'blue': 'BLU', 'yellow': 'YEL',
                'purple': 'PUR', 'green': 'GRN', 'light': 'LGT', 'dark': 'DRK'
            };
            
            if (colorMap[lowerCondition]) {
                return character.color === colorMap[lowerCondition];
            }
            
            if (lowerCondition.includes(character.color.toLowerCase())) {
                return true;
            }
        }
        
        // Verificar rareza
        if (character.rarity && lowerCondition.includes(character.rarity.toLowerCase())) {
            return true;
        }
        
        // Verificar nombre
        if (character.name && lowerCondition.includes(character.name.toLowerCase())) {
            return true;
        }
        
        return false;
    }

    // Analizar Z-Ability de un personaje
    analyzeZAbility(character) {
        if (!character?.z_ability) return { conditions: [], effects: {}, text: '' };
        
        const zAbility = character.z_ability;
        const results = {
            conditions: [],
            effects: {},
            text: ''
        };
        
        // Analizar cada nivel (one, two, three, four)
        const levels = ['one', 'two', 'three', 'four'];
        
        levels.forEach(level => {
            const levelData = zAbility[level];
            if (!levelData) return;
            
            const condition = levelData.condition || '';
            const effect = levelData.effect || '';
            
            // Extraer condiciones
            const conditions = this.extractConditions(condition);
            results.conditions.push(...conditions);
            
            // Extraer efectos
            const effects = this.extractEffects(effect);
            Object.entries(effects).forEach(([key, value]) => {
                results.effects[key] = (results.effects[key] || 0) + value;
            });
            
            results.text += `${condition}: ${effect}\n`;
        });
        
        // Eliminar duplicados
        results.conditions = [...new Set(results.conditions)];
        
        return results;
    }

    // Calcular sinergia total del equipo
    calculateTeamSynergy(teamCharacters) {
        if (!teamCharacters || teamCharacters.length === 0) {
            return { bonus: {}, activeConditions: [], totalBonusPercent: 0 };
        }
        
        const allConditions = new Map();
        const activeConditions = [];
        const totalBonus = {};
        
        // Analizar Z-Ability de cada personaje
        teamCharacters.forEach(character => {
            const analysis = this.analyzeZAbility(character);
            
            analysis.conditions.forEach(condition => {
                if (!allConditions.has(condition)) {
                    allConditions.set(condition, {
                        condition,
                        provider: character.name,
                        effects: analysis.effects,
                        beneficiaries: []
                    });
                }
                
                // Verificar qué personajes se benefician
                const conditionData = allConditions.get(condition);
                teamCharacters.forEach(otherChar => {
                    if (this.characterMatchesCondition(otherChar, condition)) {
                        if (!conditionData.beneficiaries.includes(otherChar.name)) {
                            conditionData.beneficiaries.push(otherChar.name);
                        }
                    }
                });
            });
        });
        
        // Filtrar condiciones activas (al menos 2 beneficiarios)
        allConditions.forEach((data, condition) => {
            if (data.beneficiaries.length >= 2) {
                activeConditions.push({
                    condition: data.condition,
                    provider: data.provider,
                    beneficiaries: data.beneficiaries,
                    effects: data.effects,
                    beneficiaryCount: data.beneficiaries.length
                });
                
                // Sumar bonus
                Object.entries(data.effects).forEach(([stat, value]) => {
                    totalBonus[stat] = (totalBonus[stat] || 0) + (value * data.beneficiaries.length);
                });
            }
        });
        
        // Calcular porcentaje total de bonus
        const totalBonusPercent = Object.values(totalBonus).reduce((a, b) => a + b, 0);
        
        return {
            bonus: totalBonus,
            activeConditions,
            totalBonusPercent
        };
    }

}

window.zAbilityParser = new ZAbilityParser();