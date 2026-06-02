// backend/models/Team.js
const mongoose = require('mongoose');

const equipmentSchema = new mongoose.Schema({
    id: { type: String, required: true },
    name: { type: String, required: true },
    type: { type: String },
    rarity: { type: String },
    image_url: { type: String },
    effects: { type: mongoose.Schema.Types.Mixed }
}, { _id: false });

const characterSchema = new mongoose.Schema({
    character_id: { type: String, required: true },
    name: { type: String, required: true },
    color: { type: String },
    rarity: { type: String },
    image_url: { type: String },
    position: { type: Number, required: true },
    equipments: [equipmentSchema]
}, { _id: false });

const teamSchema = new mongoose.Schema({
    name: { 
        type: String, 
        required: [true, 'El equipo necesita un nombre'],
        trim: true,
        maxlength: [50, 'El nombre no puede exceder 50 caracteres']
    },
    characters: {
        type: [characterSchema],
        validate: {
            validator: function(arr) {
                return arr.length >= 1 && arr.length <= 6;
            },
            message: 'El equipo debe tener entre 1 y 6 personajes'
        }
    },
    stats: {
        totalPower: { type: Number, default: 0 },
        totalHealth: { type: Number, default: 0 },
        averagePower: { type: Number, default: 0 }
    },
    tags: [String],
    createdBy: {
        type: String,
        default: 'anonymous'
    },
    isPublic: {
        type: Boolean,
        default: false
    }
}, {
    timestamps: true, // Agrega createdAt y updatedAt automáticamente
    toJSON: { virtuals: true },
    toObject: { virtuals: true }
});

// Virtual para calcular la cantidad de personajes
teamSchema.virtual('characterCount').get(function() {
    return this.characters.length;
});

// Índice para búsquedas rápidas
teamSchema.index({ name: 'text', 'characters.name': 'text' });
teamSchema.index({ createdAt: -1 });

const Team = mongoose.model('Team', teamSchema);

module.exports = Team;