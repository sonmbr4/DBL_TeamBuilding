const express = require("express")
const cors = require("cors")
const path = require("path")
const characters = require("../data/characters.json")

const app = express()
const port = process.env.PORT || 4000

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
app.use('/static', express.static(path.join(__dirname, 'assests')));




app.get("/", (req, res) => {
	res.json({
		message: "API de Dragon Ball lista para consultar personajes.",
		endpoints: ["GET /characters", "GET /characters/:id", "GET /health"],
	})
})

app.get("/health", (req, res) => {
	res.json({ status: "ok" })
})

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

app.listen(port, () => {
	console.log(`API escuchando en http://localhost:${port}`)
})