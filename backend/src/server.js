require('dotenv').config();
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

//Middleware
app.use(cors())
app.use(express.json())

//Archivos estaticos desde frontend
app.use(express.static(path.join(__dirname, '../../frontend')));

//Servir assest con ruta /static
app.use('/static', express.static(path.join(__dirname, '../../frontend/assets')));

//Rutas limpias
app.get('/', (req, res) => {
	res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'index.html'))
});

app.get('/equipos', (req, res) =>{
	res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'index.html'))
})


app.get('/builder', (req, res) =>{
	res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'createTeam.html'))
})

app.get('/equipo/:id', (req, res) => {
	res.sendFile(path.join(__dirname, '..', '..', 'frontend', 'teamDetail.html'))
})




//Obtener personajes
app.get("/api", (req, res) => {
	res.json({
		message: "API de Dragon Ball legends para consultar personajes.",
		version: "1.0.0",
		endpoints: {
			characters: ["GET /api/characters", "GET /api/characters/:id"],
			equipments: ["GET /api/equipment"],
			teams: [
				"GET /api/teams",
                "GET /api/teams/:id",
                "POST /api/teams",
                "PUT /api/teams/:id",
                "DELETE /api/teams/:id"
			],
			pages:[
				"GET /",
				"GET /builder",
				"GET /equipos/:id"
			],
			"health": "GET /health"
		}
	})
})


//Health check
app.get("/health", (req, res) => {
	res.json({ 
		status: "ok",
		mongodb: mongoose.connection.readyState === 1 ? "connected" : "disconnected",
		timestamp: new Date().toISOString()
	});
});

//API - Rutas de personajes
app.get("/api/characters", (req, res) => {
	const name = req.query.name

	if (name) {
		const filtered = characters.filter((character) =>
			character.name.toLowerCase().includes(String(name).toLowerCase())
		)

		return res.json(filtered);
	}

	res.json(characters);
})

app.get("/api/characters/:id", (req, res) => {
	const characterId = Number(req.params.id)
	const character = characters.find((item) => item.id === characterId)

	if (!character) {
		return res.status(404).json({ message: "Personaje no encontrado" })
	}

	res.json(character);
})

//API - Equipamiento
app.get("/api/equipment", (req, res) => {
	const name = req.query.name

	if (name) {
		const filtered = equipments.filter((equipment) =>
			equipment.name.toLowerCase().includes(String(name).toLowerCase())
		)

		return res.json(filtered)
	}

	res.json(equipments)
})

//API - Equipos(MongoDB)
app.use('/api/teams', require('../routes/teams'));



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