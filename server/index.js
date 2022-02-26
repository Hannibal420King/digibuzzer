require('dotenv').config()
const http = require('http')
const path = require('path')
const fs = require('fs-extra')
const { Nuxt, Builder } = require('nuxt')
const express = require('express')
const app = express()
const server = http.createServer(app)
const cors = require('cors')
const io = require('socket.io')(server, { cookie: false })
const redis = require('redis')
const session = require('express-session')
const RedisStore = require('connect-redis')(session)
let db
if (process.env.NODE_ENV === 'production') {
	db = redis.createClient({ host: process.env.DB_HOST, port: 6379, password: process.env.DB_PWD })
} else {
	db = redis.createClient()
}
const bodyParser = require('body-parser')
const helmet = require('helmet')
const multer = require('multer')
const sharp = require('sharp')
const moment = require('moment')
const cron = require('node-cron')
let storeOptions, cookie
if (process.env.NODE_ENV === 'production') {
	storeOptions = {
		host: process.env.DB_HOST,
		port: 6379,
		pass: process.env.DB_PWD,
		client: db,
		prefix: 'sessions:'
	}
	cookie = {
		sameSite: 'None',
		secure: true
	}
} else {
	storeOptions = {
		host: 'localhost',
		port: 6379,
		client: db,
		prefix: 'sessions:'
	}
	cookie = {
		secure: false
	}
}
const sessionOptions = {
	secret: process.env.SESSION_KEY,
	store: new RedisStore(storeOptions),
	name: 'digibuzzer',
	resave: false,
	rolling: true,
	saveUninitialized: false,
	cookie: cookie
}
const expressSession = session(sessionOptions)
const sharedsession = require('express-socket.io-session')
const config = require('../nuxt.config.js')

config.dev = !(process.env.NODE_ENV === 'production')
const nuxt = new Nuxt(config)
const { host, port } = nuxt.options.server

if (config.dev) {
	process.env.DEBUG = 'nuxt:*'
	const builder = new Builder(nuxt)
	builder.build()
} else {
	nuxt.ready()
}

cron.schedule('59 23 * * Saturday', () => {
	db.keys('salles:*', function (err, salles) {
		const donneesSalles = []
		for (const salle of salles) {
			const donneesSalle = new Promise(function (resolve) {
				db.exists(salle, function (err, reponse) {
					if (err) { resolve(0) }
					if (reponse === 1) {
						db.hgetall(salle, function (err, resultat) {
							if (err) { resolve(0) }
							if (moment(resultat.date).isBefore(moment().subtract(21, 'days'))) {
								db.del(salle, function (err) {
									if (err) { resolve(0) }
									resolve(1)
								})
							} else {
								resolve(0)
							}
						})
					} else {
						resolve(0)
					}
				})
			})
			donneesSalles.push(donneesSalle)
		}
		Promise.all(donneesSalles).then(function (resultats) {
			console.log(resultats)
		})
	})
})

app.set('trust proxy', true)
app.use(helmet())
app.use(bodyParser.json({ limit: '10mb' }))
app.use(expressSession)
io.use(sharedsession(expressSession, {
	autoSave: true
}))
app.use(cors())

app.get('/p/:salle', function (req) {
	if (req.session.identifiant === '' || req.session.identifiant === undefined) {
		const identifiant = 'u' + Math.random().toString(16).slice(3)
		req.session.identifiant = identifiant
		req.session.nom = ''
		req.session.avatar = ''
		req.session.langue = 'fr'
		req.session.statut = 'joueur'
		req.session.salles = []
		req.session.cookie.expires = new Date(Date.now() + (3600 * 24 * 7 * 1000))
	}
	req.next()
})

app.post('/api/creer-salle', function (req, res) {
	if (req.session.identifiant === '' || req.session.identifiant === undefined) {
		const identifiant = 'u' + Math.random().toString(16).slice(3)
		req.session.identifiant = identifiant
		req.session.salles = []
	}
	const titre = req.body.titre
	const salle = Math.random().toString(16).slice(7)
	const date = moment().format()
	db.exists('salles:' + salle, function (err, reponse) {
		if (err) { res.send('erreur'); return false }
		if (reponse === 0) {
			const donnees = {}
			donnees.indexQuestion = -1
			donnees.statutQuestion = ''
			donnees.premiereReponse = ''
			donnees.reponses = []
			donnees.resultats = []
			donnees.utilisateurs = []
			donnees.bonus = []
			db.hmset('salles:' + salle, 'identifiant', req.session.identifiant, 'titre', titre, 'statut', '', 'type', 'buzzer', 'donnees', JSON.stringify(donnees), 'date', date, function (err) {
				if (err) { res.send('erreur'); return false }
				req.session.nom = ''
				req.session.avatar = ''
				if (req.session.langue === '' || req.session.langue === undefined) {
					req.session.langue = 'fr'
				}
				req.session.statut = 'animateur'
				req.session.salles.push(salle)
				req.session.cookie.expires = new Date(Date.now() + (3600 * 24 * 7 * 1000))
				res.json({ salle: salle })
			})
		} else {
			res.send('existe_deja')
		}
	})
})

app.post('/api/modifier-titre-salle', function (req, res) {
	const identifiant = req.body.identifiant
	if (req.session.identifiant && req.session.identifiant === identifiant) {
		const salle = req.body.salle
		db.exists('salles:' + salle, function (err, reponse) {
			if (err) { res.send('erreur'); return false }
			if (reponse === 1) {
				const titre = req.body.titre
				db.hmset('salles:' + salle, 'titre', titre, function (err) {
					if (err) { res.send('erreur'); return false }
					res.send('titre_modifie')
				})
			} else {
				res.send('erreur')
			}
		})
	} else {
		res.send('non_autorise')
	}
})

app.post('/api/modifier-statut-salle', function (req, res) {
	const identifiant = req.body.identifiant
	if (req.session.identifiant && req.session.identifiant === identifiant) {
		const salle = req.body.salle
		db.exists('salles:' + salle, function (err, reponse) {
			if (err) { res.send('erreur'); return false }
			if (reponse === 1) {
				const statut = req.body.statut
				db.hmset('salles:' + salle, 'statut', statut, function (err) {
					if (err) { res.send('erreur'); return false }
					res.send('statut_modifie')
				})
			} else {
				res.send('erreur')
			}
		})
	} else {
		res.send('non_autorise')
	}
})

app.post('/api/recuperer-donnees-salle', function (req, res) {
	const salle = req.body.salle
	db.exists('salles:' + salle, function (err, reponse) {
		if (err) { res.send('erreur'); return false }
		if (reponse === 1) {
			db.hgetall('salles:' + salle, function (err, resultat) {
				if (err) { res.send('erreur'); return false }
				const titre = resultat.titre
				const statut = resultat.statut
				const donnees = JSON.parse(resultat.donnees)
				res.json({ titre: titre, statut: statut, donnees: donnees })
			})
		} else {
			res.send('erreur')
		}
	})
})

app.post('/api/modifier-informations', function (req, res) {
	const nom = req.body.nom
	const avatar = req.body.avatar
	req.session.nom = nom
	req.session.avatar = avatar
	res.send('informations_modifiees')
})

app.post('/api/modifier-langue', function (req, res) {
	const langue = req.body.langue
	req.session.langue = langue
	res.send('langue_modifiee')
})

app.post('/api/televerser-avatar', function (req, res) {
	const identifiant = req.session.identifiant
	if (!identifiant) {
		res.send('non_autorise')
	} else {
		televerser(req, res, function () {
			const fichier = req.file
			const info = path.parse(fichier.originalname)
			const extension = info.ext.toLowerCase()
			const chemin = path.join(__dirname, '..', '/static/avatars/' + fichier.filename)
			if (extension === '.jpg' || extension === '.jpeg') {
				sharp(chemin).withMetadata().rotate().jpeg().resize(300, 320).toBuffer((err, buffer) => {
					if (err) { res.send('erreur'); return false }
					fs.writeFile(chemin, buffer, function() {
						res.send(fichier.filename)
					})
				})
			} else if (extension === '.png') {
				sharp(chemin).withMetadata().resize(300, 320).toBuffer((err, buffer) => {
					if (err) { res.send('erreur'); return false }
					fs.writeFile(chemin, buffer, function() {
						res.send(fichier.filename)
					})
				})
			} else {
				res.send(fichier.filename)
			}
		})
	}
})

app.use(nuxt.render)

server.listen(port, host)

io.on('connection', function (socket) {
	socket.on('connexion', function (donnees) {
		const salle = donnees.salle
		const identifiant = donnees.identifiant
		const nom = donnees.nom
		const avatar = donnees.avatar
		socket.join(salle)
		socket.identifiant = identifiant
		socket.nom = nom
		socket.avatar = avatar
		const clients = Object.keys(io.sockets.adapter.rooms[salle].sockets)
		const utilisateurs = []
		for (let client of clients) {
			client = io.sockets.connected[client]
			utilisateurs.push({ identifiant: client.identifiant, nom: client.nom, avatar: client.avatar })
		}
		io.in(salle).emit('connexion', { utilisateurs: utilisateurs, utilisateur: { identifiant: identifiant, nom: nom, avatar: avatar } })
	})

	socket.on('deconnexion', function (salle) {
		socket.to(salle).emit('deconnexion', socket.handshake.session.identifiant)
	})

	socket.on('salleouverte', function (donnees) {
		socket.to(donnees.salle).emit('salleouverte', donnees)
	})

	socket.on('sallefermee', function (salle) {
		socket.to(salle).emit('sallefermee')
	})

	socket.on('utilisateurs', function (donnees) {
		const salle = donnees.salle
		const utilisateurs = donnees.utilisateurs
		db.exists('salles:' + salle, function (err, resultat) {
			if (resultat === 1) {
				db.hgetall('salles:' + salle, function (err, reponse) {
					if (err) { socket.emit('erreur'); return false }
					const donnees = JSON.parse(reponse.donnees)
					donnees.utilisateurs = utilisateurs
					db.hmset('salles:' + salle, 'donnees', JSON.stringify(donnees))
				})
			} else {
				socket.emit('erreursalle'); return false
			}
		})
	})

	socket.on('informations', function (donnees) {
		const salle = donnees.salle
		const identifiant = donnees.identifiant
		const nom = donnees.nom
		const avatar = donnees.avatar
		db.exists('salles:' + salle, function (err, resultat) {
			if (err) { socket.emit('erreur'); return false }
			if (resultat === 1) {
				db.hgetall('salles:' + salle, function (err, reponse) {
					if (err) { socket.emit('erreur'); return false }
					const donnees = JSON.parse(reponse.donnees)
					donnees.utilisateurs.forEach(function (utilisateur, indexUtilisateur) {
						if (utilisateur.identifiant === identifiant) {
							donnees.utilisateurs[indexUtilisateur].nom = nom
							donnees.utilisateurs[indexUtilisateur].avatar = avatar
						}
					})
					db.hmset('salles:' + salle, 'donnees', JSON.stringify(donnees), function (err) {
						if (err) { socket.emit('erreur'); return false }
						socket.to(salle).emit('informations', { identifiant: identifiant, nom: nom, avatar: avatar })
						socket.handshake.session.nom = nom
						socket.handshake.session.avatar = avatar
						socket.handshake.session.cookie.expires = new Date(Date.now() + (3600 * 24 * 7 * 1000))
						socket.handshake.session.save()
					})
				})
			} else {
				socket.emit('erreursalle'); return false
			}
		})
	})

	socket.on('question', function ({ salle, indexQuestion }) {
		db.exists('salles:' + salle, function (err, resultat) {
			if (err) { socket.emit('erreur'); return false }
			if (resultat === 1) {
				db.hgetall('salles:' + salle, function (err, reponse) {
					if (err) { socket.emit('erreur'); return false }
					const donnees = JSON.parse(reponse.donnees)
					donnees.indexQuestion = indexQuestion
					donnees.statutQuestion = 'question'
					donnees.premiereReponse = ''
					donnees.reponses.push([])
					donnees.resultats.push([])
					db.hmset('salles:' + salle, 'donnees', JSON.stringify(donnees), function (err) {
						if (err) { socket.emit('erreur'); return false }
						io.in(salle).emit('question', indexQuestion)
						socket.handshake.session.cookie.expires = new Date(Date.now() + (3600 * 24 * 7 * 1000))
						socket.handshake.session.save()
					})
				})
			} else {
				socket.emit('erreursalle'); return false
			}
		})
	})

	socket.on('reponses', function (salle) {
		db.exists('salles:' + salle, function (err, resultat) {
			if (err) { socket.emit('erreur'); return false }
			if (resultat === 1) {
				db.hgetall('salles:' + salle, function (err, reponse) {
					if (err) { socket.emit('erreur'); return false }
					const donnees = JSON.parse(reponse.donnees)
					donnees.statutQuestion = 'reponses'
					db.hmset('salles:' + salle, 'donnees', JSON.stringify(donnees), function (err) {
						if (err) { socket.emit('erreur'); return false }
						io.in(salle).emit('reponses')
						socket.handshake.session.cookie.expires = new Date(Date.now() + (3600 * 24 * 7 * 1000))
						socket.handshake.session.save()
					})
				})
			} else {
				socket.emit('erreursalle'); return false
			}
		})
	})

	socket.on('reponse', function (reponse) {
		io.in(reponse.salle).emit('reponse', reponse)
	})

	socket.on('premierereponse', function ({ salle, identifiant, indexQuestion }) {
		db.exists('salles:' + salle, function (err, resultat) {
			if (err) { socket.emit('erreur'); return false }
			if (resultat === 1) {
				db.hgetall('salles:' + salle, function (err, reponse) {
					if (err) { socket.emit('erreur'); return false }
					const donnees = JSON.parse(reponse.donnees)
					donnees.premiereReponse = identifiant
					donnees.reponses[indexQuestion].push(identifiant)
					db.hmset('salles:' + salle, 'donnees', JSON.stringify(donnees), function (err) {
						if (err) { socket.emit('erreur'); return false }
						io.in(salle).emit('premierereponse', identifiant)
						socket.handshake.session.cookie.expires = new Date(Date.now() + (3600 * 24 * 7 * 1000))
						socket.handshake.session.save()
					})
				})
			} else {
				socket.emit('erreursalle'); return false
			}
		})
	})

	socket.on('reponseannulee', function ({ salle, identifiant }) {
		db.exists('salles:' + salle, function (err, resultat) {
			if (err) { socket.emit('erreur'); return false }
			if (resultat === 1) {
				db.hgetall('salles:' + salle, function (err, reponse) {
					if (err) { socket.emit('erreur'); return false }
					const donnees = JSON.parse(reponse.donnees)
					donnees.premiereReponse = ''
					db.hmset('salles:' + salle, 'donnees', JSON.stringify(donnees), function (err) {
						if (err) { socket.emit('erreur'); return false }
						io.in(salle).emit('reponseannulee', identifiant)
						socket.handshake.session.cookie.expires = new Date(Date.now() + (3600 * 24 * 7 * 1000))
						socket.handshake.session.save()
					})
				})
			} else {
				socket.emit('erreursalle'); return false
			}
		})
	})

	socket.on('reponsevalidee', function ({ salle, identifiant, indexQuestion, points }) {
		db.exists('salles:' + salle, function (err, resultat) {
			if (err) { socket.emit('erreur'); return false }
			if (resultat === 1) {
				db.hgetall('salles:' + salle, function (err, reponse) {
					if (err) { socket.emit('erreur'); return false }
					const donnees = JSON.parse(reponse.donnees)
					donnees.statutQuestion = ''
					donnees.resultats[indexQuestion].push({ identifiant: identifiant, points: parseInt(points) })
					db.hmset('salles:' + salle, 'donnees', JSON.stringify(donnees), function (err) {
						if (err) { socket.emit('erreur'); return false }
						io.in(salle).emit('reponsevalidee', { identifiant: identifiant, points: parseInt(points), indexQuestion: indexQuestion })
						socket.handshake.session.cookie.expires = new Date(Date.now() + (3600 * 24 * 7 * 1000))
						socket.handshake.session.save()
					})
				})
			} else {
				socket.emit('erreursalle'); return false
			}
		})
	})

	socket.on('score', function ({ salle, identifiant, bonus }) {
		db.exists('salles:' + salle, function (err, resultat) {
			if (err) { socket.emit('erreur'); return false }
			if (resultat === 1) {
				db.hgetall('salles:' + salle, function (err, reponse) {
					if (err) { socket.emit('erreur'); return false }
					const donnees = JSON.parse(reponse.donnees)
					if (donnees.bonus.map(function (e) { return e.identifiant }).includes(identifiant) === true) {
						donnees.bonus.forEach(function (u, index) {
							if (u.identifiant === identifiant) {
								donnees.bonus[index].points = parseInt(bonus)
							}
						})
					} else {
						donnees.bonus.push({ identifiant: identifiant, points: parseInt(bonus) })
					}
					db.hmset('salles:' + salle, 'donnees', JSON.stringify(donnees), function (err) {
						if (err) { socket.emit('erreur'); return false }
						io.in(salle).emit('score', { identifiant: identifiant, bonus: parseInt(bonus) })
						socket.handshake.session.cookie.expires = new Date(Date.now() + (3600 * 24 * 7 * 1000))
						socket.handshake.session.save()
					})
				})
			} else {
				socket.emit('erreursalle'); return false
			}
		})
	})

	socket.on('modifierlangue', function (langue) {
		socket.handshake.session.langue = langue
		socket.handshake.session.save()
	})
})

const televerser = multer({
	storage: multer.diskStorage({
		destination: function (req, fichier, callback) {
			const chemin = path.join(__dirname, '..', '/static/avatars/')
			callback(null, chemin)
		},
		filename: function (req, fichier, callback) {
			const info = path.parse(fichier.originalname)
			const extension = info.ext.toLowerCase()
			const nom = 'avatar_' + Math.random().toString(36).substring(2) + extension
			callback(null, nom)
		}
	})
}).single('fichier')
