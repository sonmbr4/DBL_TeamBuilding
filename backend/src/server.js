const express = require("express")
const cors = require("cors")
const path = require("path")
const mongoose = require("mongoose")
const connectDB = require("../config/database")
const characters = require("../data/characters.json")
const equipments = require("../data/equipment.json")

const app = express()
const port = process.env.PORT || 4000

connectDB();

/*const characters = [
	{
		id: 1,
		name: "Goku",
		race: "Saiyan",
		role: "Protagonista",
		powerLevel: "Muy alto",
	},
	{
		id: 2,
		name: "Vegeta",
		race: "Saiyan",
		role: "Principe Saiyan",
		powerLevel: "Muy alto",
	},
	{
		id: 3,
		name: "Gohan",
		race: "Saiyan-Humano",
		role: "Hijo de Goku",
		powerLevel: "Alto",
	},
]*/

//Middleware
app.use(cors())
app.use(express.json())
app.use(express.static(path.join(__dirname, '../../frontend')));
app.use('/static', express.static(path.join(__dirname, '../../frontend/assets')));



//Obtener personajes
app.get("/", (req, res) => {
	res.json({
		message: "API de Dragon Ball lista para consultar personajes.",
		version: "1.0.0",
		endpoints: {
			characters: ["GET /characters", "GET /characters/:id"],
			equipments: ["GET /equipment"],
			teams: [
				"GET /api/teams",
                "GET /api/teams/:id",
                "POST /api/teams",
                "PUT /api/teams/:id",
                "DELETE /api/teams/:id"
			],
			"health": "GET /health"
		},
	})
})

app.get("/health", (req, res) => {
	res.json({ 
		status: "ok",
		mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
		timestamp: new Date().toISOString()
	});
});

//Rutas de personajes
app.get("/characters", (req, res) => {
	const name = req.query.name

	if (name) {
		const filtered = characters.filter((character) =>
			character.name.toLowerCase().includes(String(name).toLowerCase())
		)

		return res.json(filtered)
	}

	res.json(characters)
})

app.get("/characters/:id", (req, res) => {
	const characterId = Number(req.params.id)
	const character = characters.find((item) => item.id === characterId)

	if (!character) {
		return res.status(404).json({ message: "Personaje no encontrado" })
	}

	res.json(character)
})

//Obtener equipamiento
app.get("/equipment", (req, res) => {
	const name = req.query.name

	if (name) {
		const filtered = equipments.filter((equipment) =>
			equipment.name.toLowerCase().includes(String(name).toLowerCase())
		)

		return res.json(filtered)
	}

	res.json(equipments)
})

//Rutas de equipos(MongoDB)
app.use('/api/teams', require('../routes/teams'));

//Middleware 404
app.use((req, res) => {
	res.status(404).json({
		error:"Ruta no encontrada",
		message: `La ruta ${req.originalUrl} no existe en esta API.`
	});
});

//Middleware de errores
app.use((err, req, res, next) => {
	console.error(err.stack);
	res.status(500).json({
		error: "Error interno del servidor",
		message: process.env.NODE_ENV === 'development' ? err.message :  'Algo salió mal'
	})
})



app.listen(port, () => {
	console.log(`API escuchando en http://localhost:${port}`);
	console.log(`📊 Endpoints disponibles:`);
    console.log(`   - Personajes: http://localhost:${port}/characters`);
    console.log(`   - Equipamientos: http://localhost:${port}/equipment`);
    console.log(`   - Equipos: http://localhost:${port}/api/teams`);
})