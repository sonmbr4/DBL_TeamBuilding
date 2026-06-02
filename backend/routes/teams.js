// backend/routes/teams.js
const express = require('express');
const router = express.Router();
const Team = require('../models/team');

// GET - Obtener todos los equipos
router.get('/', async (req, res) => {
    try {
        const { limit = 20, page = 1, sort = '-createdAt' } = req.query;
        
        const teams = await Team.find()
            .sort(sort)
            .limit(parseInt(limit))
            .skip((parseInt(page) - 1) * parseInt(limit))
            .lean();
        
        const total = await Team.countDocuments();
        
        res.json({
            success: true,
            data: teams,
            pagination: {
                total,
                page: parseInt(page),
                pages: Math.ceil(total / parseInt(limit)),
                limit: parseInt(limit)
            }
        });
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error al obtener equipos',
            details: error.message
        });
    }
});

// GET - Obtener un equipo por ID
router.get('/:id', async (req, res) => {
    try {
        const team = await Team.findById(req.params.id);
        
        if (!team) {
            return res.status(404).json({
                success: false,
                error: 'Equipo no encontrado'
            });
        }
        
        res.json({
            success: true,
            data: team
        });
    } catch (error) {
        if (error.kind === 'ObjectId') {
            return res.status(400).json({
                success: false,
                error: 'ID de equipo inválido'
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Error al obtener el equipo',
            details: error.message
        });
    }
});

// POST - Crear un nuevo equipo
router.post('/', async (req, res) => {
    try {
        const { name, characters } = req.body;
        
        // Validaciones básicas
        if (!name || !name.trim()) {
            return res.status(400).json({
                success: false,
                error: 'El nombre del equipo es requerido'
            });
        }
        
        if (!characters || !Array.isArray(characters) || characters.length === 0) {
            return res.status(400).json({
                success: false,
                error: 'El equipo debe tener al menos 1 personaje'
            });
        }
        
        if (characters.length > 6) {
            return res.status(400).json({
                success: false,
                error: 'El equipo no puede tener más de 6 personajes'
            });
        }
        
        // Verificar duplicados
        const characterIds = characters.map(c => c.character_id);
        const uniqueIds = new Set(characterIds);
        if (uniqueIds.size !== characterIds.length) {
            return res.status(400).json({
                success: false,
                error: 'No puedes tener personajes duplicados en el equipo'
            });
        }
        
        // Calcular estadísticas (asumiendo que cada personaje tiene stats en el JSON)
        const stats = calculateTeamStats(characters);
        
        // Extraer tags comunes
        const tags = extractCommonTags(characters);
        
        // Crear el equipo
        const team = new Team({
            name: name.trim(),
            characters: characters.map((char, index) => ({
                character_id: char.character_id,
                name: char.name,
                color: char.color,
                rarity: char.rarity,
                image_url: char.image_url,
                position: char.position || index + 1,
                equipments: char.equipments || []
            })),
            stats,
            tags
        });
        
        const savedTeam = await team.save();
        
        res.status(201).json({
            success: true,
            message: 'Equipo guardado exitosamente',
            data: savedTeam
        });
        
    } catch (error) {
        // Manejar errores de validación de Mongoose
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                error: 'Error de validación',
                details: errors
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Error al guardar el equipo',
            details: error.message
        });
    }
});

// PUT - Actualizar un equipo existente
router.put('/:id', async (req, res) => {
    try {
        const { name, characters } = req.body;
        
        const team = await Team.findById(req.params.id);
        
        if (!team) {
            return res.status(404).json({
                success: false,
                error: 'Equipo no encontrado'
            });
        }
        
        if (name) team.name = name.trim();
        
        if (characters && Array.isArray(characters)) {
            if (characters.length > 6) {
                return res.status(400).json({
                    success: false,
                    error: 'El equipo no puede tener más de 6 personajes'
                });
            }
            
            team.characters = characters.map((char, index) => ({
                character_id: char.character_id,
                name: char.name,
                color: char.color,
                rarity: char.rarity,
                image_url: char.image_url,
                position: char.position || index + 1,
                equipments: char.equipments || []
            }));
            
            team.stats = calculateTeamStats(characters);
            team.tags = extractCommonTags(characters);
        }
        
        const updatedTeam = await team.save();
        
        res.json({
            success: true,
            message: 'Equipo actualizado exitosamente',
            data: updatedTeam
        });
        
    } catch (error) {
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            return res.status(400).json({
                success: false,
                error: 'Error de validación',
                details: errors
            });
        }
        
        res.status(500).json({
            success: false,
            error: 'Error al actualizar el equipo',
            details: error.message
        });
    }
});

// DELETE - Eliminar un equipo
router.delete('/:id', async (req, res) => {
    try {
        const team = await Team.findByIdAndDelete(req.params.id);
        
        if (!team) {
            return res.status(404).json({
                success: false,
                error: 'Equipo no encontrado'
            });
        }
        
        res.json({
            success: true,
            message: 'Equipo eliminado exitosamente'
        });
        
    } catch (error) {
        res.status(500).json({
            success: false,
            error: 'Error al eliminar el equipo',
            details: error.message
        });
    }
});

// Funciones helper
function calculateTeamStats(characters) {
    // Aquí deberías calcular las estadísticas reales
    // Por ahora ponemos valores de ejemplo
    const totalPower = characters.reduce((sum, char) => {
        // Asumiendo que cada personaje tiene un campo power
        return sum + (char.power || 1000);
    }, 0);
    
    return {
        totalPower,
        totalHealth: totalPower * 0.8, // Ejemplo
        averagePower: Math.round(totalPower / characters.length)
    };
}

function extractCommonTags(characters) {
    const tagCount = {};
    
    characters.forEach(char => {
        if (char.tags && Array.isArray(char.tags)) {
            char.tags.forEach(tag => {
                tagCount[tag] = (tagCount[tag] || 0) + 1;
            });
        }
    });
    
    // Devolver tags que aparecen en al menos 2 personajes
    return Object.entries(tagCount)
        .filter(([tag, count]) => count >= 2)
        .map(([tag]) => tag);
}

module.exports = router;