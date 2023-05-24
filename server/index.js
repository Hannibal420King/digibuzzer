require('dotenv').config()
const path = require('path')
const fs = require('fs-extra')
const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
const session = require('express-session')
const compression = require('compression')
const cors = require('cors')
const redis = require('redis')
const bodyParser = require('body-parser')
const helmet = require('helmet')
const multer = require('multer')
const sharp = require('sharp')
const dayjs = require('dayjs')
const cron = require('node-cron')
const { renderPage } = require('vite-plugin-ssr/server')

const production = process.env.NODE_ENV === 'production'
const root = `${__dirname}/..`

demarrerServeur()

async function demarrerServeur () {
	const app = express()
	const httpServer = createServer(app)
	const RedisStore = require('connect-redis')(session)

	let db
	let db_port = 6379
	if (process.env.DB_PORT) {
		db_port = process.env.DB_PORT
	}
	if (production) {
		db = redis.createClient({ host: process.env.DB_HOST, port: db_port, password: process.env.DB_PWD })
	} else {
		db = redis.createClient({ port: db_port })
	}
	let storeOptions, cookie, dureeSession
	if (production) {
		storeOptions = {
			host: process.env.DB_HOST,
			port: db_port,
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
			port: db_port,
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
	if (process.env.SESSION_DURATION) {
		dureeSession = parseInt(process.env.SESSION_DURATION)
	} else {
		dureeSession = 864000000 //3600 * 24 * 10 * 1000
	}
	const sessionMiddleware = session(sessionOptions)

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
								if (dayjs(new Date(resultat.date)).isBefore(dayjs().subtract(14, 'days'))) {
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
	app.use(compression())
	app.use('/avatars', express.static(path.join(__dirname, 'avatars')))
	app.use(
		helmet.contentSecurityPolicy({
			directives: {
				"default-src": ["'self'", "https:", "ws:"],
				"script-src": ["'self'", "'unsafe-inline'", "'unsafe-eval'"],
				"media-src": ["'self'", "data:"],
				"frame-ancestors": ["'self'", 'https://ladigitale.dev', 'https://digipad.app', 'https://digiwall.app']
			}
		})
	)
	app.use(bodyParser.json({ limit: '10mb' }))
	app.use(sessionMiddleware)
	app.use(cors())

	if (production) {
		const sirv = require('sirv')
		app.use(sirv(`${root}/dist/client`))
	} else {
    	const vite = require('vite')
    	const viteDevMiddleware = (
      		await vite.createServer({
        		root,
        		server: { middlewareMode: true }
     		 })
    	).middlewares
    	app.use(viteDevMiddleware)
  	}

	app.post('/api/creer-salle', function (req, res) {
		if (req.session.identifiant === '' || req.session.identifiant === undefined) {
			const identifiant = 'u' + Math.random().toString(16).slice(3)
			req.session.identifiant = identifiant
		}
		if (!req.session.hasOwnProperty('salles')) {
			req.session.salles = []
		}
		const titre = req.body.titre
		const salle = Math.random().toString(16).slice(7)
		const date = dayjs().format()
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
				db.hmset('salles:' + salle, 'identifiant', req.session.identifiant, 'titre', titre, 'statut', '', 'donnees', JSON.stringify(donnees), 'date', date, function (err) {
					if (err) { res.send('erreur'); return false }
					req.session.nom = ''
					req.session.avatar = ''
					if (req.session.langue === '' || req.session.langue === undefined) {
						req.session.langue = 'fr'
					}
					req.session.role = 'animateur'
					req.session.salles.push(salle)
					req.session.cookie.expires = new Date(Date.now() + dureeSession)
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
					db.hset('salles:' + salle, 'titre', titre, function (err) {
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
					db.hset('salles:' + salle, 'statut', statut, function (err) {
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
				const chemin = path.join(__dirname, '..', '/avatars/' + fichier.filename)
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

  	app.get('*', async (req, res, next) => {
		let hote = 'http://localhost:3000'
		if (process.env.PORT) {
			hote = 'http://localhost:' + process.env.PORT
		}
		if (process.env.NODE_ENV === 'production') {
			hote = process.env.DOMAIN
		}
		if (req.session.identifiant === '' || req.session.identifiant === undefined) {
			const identifiant = 'u' + Math.random().toString(16).slice(3)
			req.session.identifiant = identifiant
			req.session.nom = ''
			req.session.avatar = ''
			req.session.langue = 'fr'
			req.session.role = 'joueur'
			req.session.salles = []
			req.session.cookie.expires = new Date(Date.now() + dureeSession)
		}	
		const pageContextInit = {
			urlOriginal: req.originalUrl,
			hote: hote,
			langues: ['fr', 'en'],
			identifiant: req.session.identifiant,
			nom: req.session.nom,
			avatar: req.session.avatar,
			langue: req.session.langue,
			role: req.session.role,
			salles: req.session.salles
		}
		const pageContext = await renderPage(pageContextInit)
		const { httpResponse } = pageContext
		if (!httpResponse) return next()
		const { body, statusCode, contentType, earlyHints } = httpResponse
		if (res.writeEarlyHints) res.writeEarlyHints({ link: earlyHints.map((e) => e.earlyHintLink) })
		res.status(statusCode).type(contentType).send(body)
  	})

	const port = process.env.PORT || 3000
	httpServer.listen(port)

	const io = new Server(httpServer, { cookie: false })
	const wrap = middleware => (socket, next) => middleware(socket.request, {}, next)
	io.use(wrap(sessionMiddleware))
	
	io.on('connection', function (socket) {
		socket.on('connexion', async function (donnees) {
			const salle = donnees.salle
			const identifiant = donnees.identifiant
			const nom = donnees.nom
			const avatar = donnees.avatar
			socket.identifiant = identifiant
			socket.nom = nom
			socket.avatar = avatar
			socket.join(salle)
			const clients = await io.in(salle).fetchSockets()
			let utilisateurs = []
			for (let i = 0; i < clients.length; i++) {
				utilisateurs.push({ identifiant: clients[i].identifiant, nom: clients[i].nom, avatar: clients[i].avatar })
			}
			utilisateurs = utilisateurs.filter((valeur, index, self) =>
				index === self.findIndex((t) => (
					t.identifiant === valeur.identifiant && t.nom === valeur.nom && t.avatar === valeur.avatar
				))
			)
			io.in(salle).emit('connexion', { utilisateurs: utilisateurs, utilisateur: { identifiant: identifiant, nom: nom, avatar: avatar } })
		})
	
		socket.on('deconnexion', function (salle) {
			socket.leave(salle)
			socket.to(salle).emit('deconnexion', socket.request.session.identifiant)
		})
	
		socket.on('donnees', function (donnees) {
			const salle = donnees.salle
			const identifiant = donnees.identifiant
			const nom = donnees.nom
			const avatar = donnees.avatar
			db.exists('salles:' + salle, function (err, reponse) {
				if (err) { socket.emit('erreur'); return false }
				if (reponse === 1) {
					db.hgetall('salles:' + salle, async function (err, resultat) {
						if (err) { socket.emit('erreur'); return false }
						socket.join(salle)
						socket.identifiant = identifiant
						socket.nom = nom
						socket.avatar = avatar
						socket.emit('donnees', { titre: resultat.titre, statut: resultat.statut, donnees: JSON.parse(resultat.donnees) })
						const clients = await io.in(salle).fetchSockets()
						let utilisateurs = []
						for (let i = 0; i < clients.length; i++) {
							utilisateurs.push({ identifiant: clients[i].identifiant, nom: clients[i].nom, avatar: clients[i].avatar })
						}
						utilisateurs = utilisateurs.filter((valeur, index, self) =>
							index === self.findIndex((t) => (
								t.identifiant === valeur.identifiant && t.nom === valeur.nom && t.avatar === valeur.avatar
							))
						)
						io.in(salle).emit('connexion', { utilisateurs: utilisateurs, utilisateur: { identifiant: identifiant, nom: nom, avatar: avatar } })
					})
				} else {
					socket.emit('erreursalle')
				}
			})
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
				if (err) { socket.emit('erreur'); return false }
				if (resultat === 1) {
					db.hgetall('salles:' + salle, function (err, reponse) {
						if (err || !reponse || !reponse.hasOwnProperty('donnees')) { socket.emit('erreur'); return false }
						const donneesReponse = JSON.parse(reponse.donnees)
						donneesReponse.utilisateurs = utilisateurs
						db.hset('salles:' + salle, 'donnees', JSON.stringify(donneesReponse))
					})
				} else {
					socket.emit('erreursalle')
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
						if (err || !reponse || !reponse.hasOwnProperty('donnees')) { socket.emit('erreur'); return false }
						const donneesReponse = JSON.parse(reponse.donnees)
						donneesReponse.utilisateurs.forEach(function (utilisateur, indexUtilisateur) {
							if (utilisateur.identifiant === identifiant) {
								donneesReponse.utilisateurs[indexUtilisateur].nom = nom
								donneesReponse.utilisateurs[indexUtilisateur].avatar = avatar
							}
						})
						db.hset('salles:' + salle, 'donnees', JSON.stringify(donneesReponse), function (err) {
							if (err) { socket.emit('erreur'); return false }
							socket.to(salle).emit('informations', { identifiant: identifiant, nom: nom, avatar: avatar })
							socket.identifiant = identifiant
							socket.nom = nom
							socket.avatar = avatar
							socket.request.session.nom = nom
							socket.request.session.avatar = avatar
							socket.request.session.cookie.expires = new Date(Date.now() + dureeSession)
							socket.request.session.save()
						})
					})
				} else {
					socket.emit('erreursalle')
				}
			})
		})
	
		socket.on('question', function ({ salle, indexQuestion }) {
			db.exists('salles:' + salle, function (err, resultat) {
				if (err) { socket.emit('erreur'); return false }
				if (resultat === 1) {
					db.hgetall('salles:' + salle, function (err, reponse) {
						if (err || !reponse || !reponse.hasOwnProperty('donnees')) { socket.emit('erreur'); return false }
						const donnees = JSON.parse(reponse.donnees)
						donnees.indexQuestion = indexQuestion
						donnees.statutQuestion = 'question'
						donnees.premiereReponse = ''
						donnees.reponses.push([])
						donnees.resultats.push([])
						if (donnees.reponses.length < (indexQuestion + 1)) {
							for (let i = 0; i < ((indexQuestion + 1) - donnees.reponses.length); i++) {
								donnees.reponses.push([])
							}
						}
						if (donnees.resultats.length < (indexQuestion + 1)) {
							for (let i = 0; i < ((indexQuestion + 1) - donnees.resultats.length); i++) {
								donnees.resultats.push([])
							}
						}
						db.hset('salles:' + salle, 'donnees', JSON.stringify(donnees), function (err) {
							if (err) { socket.emit('erreur'); return false }
							io.in(salle).emit('question', indexQuestion)
							socket.request.session.cookie.expires = new Date(Date.now() + dureeSession)
							socket.request.session.save()
						})
					})
				} else {
					socket.emit('erreursalle')
				}
			})
		})
	
		socket.on('reponses', function (salle) {
			db.exists('salles:' + salle, function (err, resultat) {
				if (err) { socket.emit('erreur'); return false }
				if (resultat === 1) {
					db.hgetall('salles:' + salle, function (err, reponse) {
						if (err || !reponse || !reponse.hasOwnProperty('donnees')) { socket.emit('erreur'); return false }
						const donnees = JSON.parse(reponse.donnees)
						donnees.statutQuestion = 'reponses'
						db.hset('salles:' + salle, 'donnees', JSON.stringify(donnees), function (err) {
							if (err) { socket.emit('erreur'); return false }
							io.in(salle).emit('reponses')
							socket.request.session.cookie.expires = new Date(Date.now() + dureeSession)
							socket.request.session.save()
						})
					})
				} else {
					socket.emit('erreursalle')
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
						if (err || !reponse || !reponse.hasOwnProperty('donnees')) { socket.emit('erreur'); return false }
						const donnees = JSON.parse(reponse.donnees)
						donnees.premiereReponse = identifiant
						if (donnees.hasOwnProperty('reponses') && donnees.reponses[indexQuestion]) {
							donnees.reponses[indexQuestion].push(identifiant)
							db.hset('salles:' + salle, 'donnees', JSON.stringify(donnees), function (err) {
								if (err) { socket.emit('erreur'); return false }
								io.in(salle).emit('premierereponse', identifiant)
								socket.request.session.cookie.expires = new Date(Date.now() + dureeSession)
								socket.request.session.save()
							})
						}
					})
				} else {
					socket.emit('erreursalle')
				}
			})
		})
	
		socket.on('reponseannulee', function ({ salle, identifiant }) {
			db.exists('salles:' + salle, function (err, resultat) {
				if (err) { socket.emit('erreur'); return false }
				if (resultat === 1) {
					db.hgetall('salles:' + salle, function (err, reponse) {
						if (err || !reponse || !reponse.hasOwnProperty('donnees')) { socket.emit('erreur'); return false }
						const donnees = JSON.parse(reponse.donnees)
						donnees.premiereReponse = ''
						db.hset('salles:' + salle, 'donnees', JSON.stringify(donnees), function (err) {
							if (err) { socket.emit('erreur'); return false }
							io.in(salle).emit('reponseannulee', identifiant)
							socket.request.session.cookie.expires = new Date(Date.now() + dureeSession)
							socket.request.session.save()
						})
					})
				} else {
					socket.emit('erreursalle')
				}
			})
		})
	
		socket.on('reponsevalidee', function ({ salle, identifiant, indexQuestion, points }) {
			db.exists('salles:' + salle, function (err, resultat) {
				if (err) { socket.emit('erreur'); return false }
				if (resultat === 1) {
					db.hgetall('salles:' + salle, function (err, reponse) {
						if (err || !reponse || !reponse.hasOwnProperty('donnees')) { socket.emit('erreur'); return false }
						const donnees = JSON.parse(reponse.donnees)
						donnees.statutQuestion = ''
						if (donnees.hasOwnProperty('resultats') && donnees.resultats[indexQuestion]) {
							donnees.resultats[indexQuestion].push({ identifiant: identifiant, points: parseInt(points) })
							db.hset('salles:' + salle, 'donnees', JSON.stringify(donnees), function (err) {
								if (err) { socket.emit('erreur'); return false }
								io.in(salle).emit('reponsevalidee', { identifiant: identifiant, points: parseInt(points), indexQuestion: indexQuestion })
								socket.request.session.cookie.expires = new Date(Date.now() + dureeSession)
								socket.request.session.save()
							})
						}
					})
				} else {
					socket.emit('erreursalle')
				}
			})
		})
	
		socket.on('score', function ({ salle, identifiant, bonus }) {
			db.exists('salles:' + salle, function (err, resultat) {
				if (err) { socket.emit('erreur'); return false }
				if (resultat === 1) {
					db.hgetall('salles:' + salle, function (err, reponse) {
						if (err || !reponse || !reponse.hasOwnProperty('donnees')) { socket.emit('erreur'); return false }
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
						db.hset('salles:' + salle, 'donnees', JSON.stringify(donnees), function (err) {
							if (err) { socket.emit('erreur'); return false }
							io.in(salle).emit('score', { identifiant: identifiant, bonus: parseInt(bonus) })
							socket.request.session.cookie.expires = new Date(Date.now() + dureeSession)
							socket.request.session.session.save()
						})
					})
				} else {
					socket.emit('erreursalle')
				}
			})
		})
	
		socket.on('modifierlangue', function (langue) {
			socket.request.session.langue = langue
			socket.request.session.save()
		})	
	})

	const televerser = multer({
		storage: multer.diskStorage({
			destination: function (req, fichier, callback) {
				const chemin = path.join(__dirname, '..', '/avatars/')
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
}
