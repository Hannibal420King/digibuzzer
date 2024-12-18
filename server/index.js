import 'dotenv/config'
import path from 'path'
import fs from 'fs-extra'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { createAdapter } from '@socket.io/cluster-adapter'
import compression from 'compression'
import cors from 'cors'
import { createClient } from 'redis'
import bodyParser from 'body-parser'
import helmet from 'helmet'
import multer from 'multer'
import sharp from 'sharp'
import dayjs from 'dayjs'
import cron from 'node-cron'
import { fileURLToPath } from 'url'
import RedisStore from 'connect-redis'
import session from 'express-session'
import { renderPage } from 'vike/server'

const production = process.env.NODE_ENV === 'production'
const cluster = parseInt(process.env.NODE_CLUSTER) === 1
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = `${__dirname}/..`

demarrerServeur()

async function demarrerServeur () {
	const app = express()
	app.use(compression())
	const httpServer = createServer(app)

	let hote = 'http://localhost:3000'
	if (production) {
		hote = process.env.DOMAIN
	} else if (process.env.PORT) {
		hote = 'http://localhost:' + process.env.PORT
	}
	let db
	let db_port = 6379
	if (process.env.DB_PORT) {
		db_port = process.env.DB_PORT
	}
	if (production) {
		db = await createClient({
			url: 'redis://default:' + process.env.DB_PWD  + '@' + process.env.DB_HOST + ':' + db_port
		}).on('error', function (err) {
			console.log('redis: ', err)
		}).connect()
	} else {
		db = await createClient({
			url: 'redis://localhost:' + db_port
		}).on('error', function (err) {
			console.log('redis: ' + err)
		}).connect()
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
	const redisStore = new RedisStore(storeOptions)
	const sessionOptions = {
		secret: process.env.SESSION_KEY,
		store: redisStore,
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

	let earlyHints103 = false
	if (process.env.EARLY_HINTS && parseInt(process.env.EARLY_HINTS) === 1) {
		earlyHints103 = true
	}

	cron.schedule('59 23 * * Saturday', async function () {
		const salles = await db.KEYS('salles:*')
		const donneesSalles = []
		for (const salle of salles) {
			const donneesSalle = new Promise(async function (resolve) {
				const reponse = await db.EXISTS(salle)
				if (reponse === null) { resolve(0); return false }
				if (reponse === 1) {
					let resultat = await db.HGETALL(salle)
					resultat = Object.assign({}, resultat)
					if (resultat === null) { resolve(0); return false }
					if (dayjs(new Date(resultat.date)).isBefore(dayjs().subtract(14, 'days'))) {
						await db.DEL(salle)
						resolve(1)
					} else {
						resolve(0)
					}
				} else {
					resolve(0)
				}
			})
			donneesSalles.push(donneesSalle)
		}
		Promise.all(donneesSalles).then(function (resultats) {
			console.log(resultats)
		})
	})

	app.set('trust proxy', true)
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
	app.use(bodyParser.json({ limit: '50mb' }))
	app.use(sessionMiddleware)
	app.use(cors())
	if (parseInt(process.env.REVERSE_PROXY) !== 1 || !production) {
		app.use('/avatars', express.static('avatars'))
	}

	if (!production) {
		const vite = await import('vite')
    	const viteDevMiddleware = (
      		await vite.createServer({
        		root,
        		server: { middlewareMode: true }
			})
    	).middlewares
    	app.use(viteDevMiddleware)
  	} else if (production && parseInt(process.env.REVERSE_PROXY) !== 1) {
		const sirv = (await import('sirv')).default
		app.use(sirv(`${root}/dist/client`))
	}
	
	app.get('/', async function (req, res, next) {
		let langue = 'fr'
		if (req.session.hasOwnProperty('langue') && req.session.langue !== '') {
			langue = req.session.langue
		}
		const pageContextInit = {
			urlOriginal: req.originalUrl,
			params: req.query,
			hote: hote,
			langues: ['fr', 'en', 'it'],
			langue: langue
		}
		const pageContext = await renderPage(pageContextInit)
		const { httpResponse } = pageContext
		if (!httpResponse) {
			return next()
		}
		const { body, statusCode, headers, earlyHints } = httpResponse
		if (earlyHints103 === true && res.writeEarlyHints) {
			res.writeEarlyHints({ link: earlyHints.map((e) => e.earlyHintLink) })
		}
		if (headers) {
			headers.forEach(([name, value]) => res.setHeader(name, value))
		}
		res.status(statusCode).send(body)
  	})

	app.get('/c/:salle', async function (req, res, next) {
		if (req.session.identifiant === undefined || req.session.identifiant === '')  {
			res.redirect('/')
		} else {
			let langue = 'fr'
			if (req.session.hasOwnProperty('langue') && req.session.langue !== '') {
				langue = req.session.langue
			}
			const pageContextInit = {
				urlOriginal: req.originalUrl,
				params: req.query,
				hote: hote,
				langues: ['fr', 'en', 'it'],
				identifiant: req.session.identifiant,
				nom: req.session.nom,
				avatar: req.session.avatar,
				langue: langue,
				role: req.session.role,
				salles: req.session.salles
			}
			const pageContext = await renderPage(pageContextInit)
			const { httpResponse } = pageContext
			if (!httpResponse) {
				return next()
			}
			const { body, statusCode, headers, earlyHints } = httpResponse
			if (earlyHints103 === true && res.writeEarlyHints) {
				res.writeEarlyHints({ link: earlyHints.map((e) => e.earlyHintLink) })
			}
			if (headers) {
				headers.forEach(([name, value]) => res.setHeader(name, value))
			}
			res.status(statusCode).send(body)
		}
  	})

	app.get('/p/:salle', async function (req, res, next) {
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
		if (!req.session.hasOwnProperty('salles')) {
			req.session.salles = []
		}
		const pageContextInit = {
			urlOriginal: req.originalUrl,
			params: req.query,
			hote: hote,
			langues: ['fr', 'en', 'it'],
			identifiant: req.session.identifiant,
			nom: req.session.nom,
			avatar: req.session.avatar,
			langue: req.session.langue,
			role: req.session.role,
			salles: req.session.salles
		}
		const pageContext = await renderPage(pageContextInit)
		const { httpResponse } = pageContext
		if (!httpResponse) {
			return next()
		}
		const { body, statusCode, headers, earlyHints } = httpResponse
		if (earlyHints103 === true && res.writeEarlyHints) {
			res.writeEarlyHints({ link: earlyHints.map((e) => e.earlyHintLink) })
		}
		if (headers) {
			headers.forEach(([name, value]) => res.setHeader(name, value))
		}
		res.status(statusCode).send(body)
  	})

	app.post('/api/creer-salle', async function (req, res) {
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
		const reponse = await db.EXISTS('salles:' + salle)
		if (reponse === null) { res.send('erreur'); return false }
		if (reponse === 0) {
			const donnees = {}
			donnees.indexQuestion = -1
			donnees.statutQuestion = ''
			donnees.premiereReponse = ''
			donnees.reponses = []
			donnees.textes = []
			donnees.resultats = []
			donnees.utilisateurs = []
			donnees.bonus = []
			await db.HSET('salles:' + salle, ['identifiant', req.session.identifiant, 'titre', titre, 'statut', '', 'donnees', JSON.stringify(donnees), 'date', date])
			req.session.nom = ''
			req.session.avatar = ''
			if (req.session.langue === '' || req.session.langue === undefined) {
				req.session.langue = 'fr'
			}
			req.session.role = 'animateur'
			req.session.salles.push(salle)
			req.session.cookie.expires = new Date(Date.now() + dureeSession)
			res.json({ salle: salle })
		} else {
			res.send('existe_deja')
		}
	})

	app.post('/api/modifier-titre-salle', async function (req, res) {
		const identifiant = req.body.identifiant
		if (req.session.identifiant && req.session.identifiant === identifiant) {
			const salle = req.body.salle
			const reponse = await db.EXISTS('salles:' + salle)
			if (reponse === null) { res.send('erreur'); return false }
			if (reponse === 1) {
				const titre = req.body.titre
				await db.HSET('salles:' + salle, 'titre', titre)
				res.send('titre_modifie')
			} else {
				res.send('erreur')
			}
		} else {
			res.send('non_autorise')
		}
	})
	
	app.post('/api/modifier-statut-salle', async function (req, res) {
		const identifiant = req.body.identifiant
		if (req.session.identifiant && req.session.identifiant === identifiant) {
			const salle = req.body.salle
			const reponse = await db.EXISTS('salles:' + salle)
			if (reponse === null) { res.send('erreur'); return false }
			if (reponse === 1) {
				const statut = req.body.statut
				await db.HSET('salles:' + salle, 'statut', statut)
				res.send('statut_modifie')
			} else {
				res.send('erreur')
			}
		} else {
			res.send('non_autorise')
		}
	})

	app.post('/api/recuperer-donnees-salle', async function (req, res) {
		const salle = req.body.salle
		const reponse = await db.EXISTS('salles:' + salle)
		if (reponse === null) { res.send('erreur'); return false }
		if (reponse === 1) {
			let resultat = await db.HGETALL('salles:' + salle)
			resultat = Object.assign({}, resultat)
			if (resultat === null) { res.send('erreur'); return false }
			const titre = resultat.titre
			const statut = resultat.statut
			const donnees = JSON.parse(resultat.donnees)
			res.json({ titre: titre, statut: statut, donnees: donnees })
		} else {
			res.send('salle_inexistante')
		}
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
					sharp(chemin).withMetadata().rotate().jpeg().resize(300, 320).toBuffer(async function (err, buffer) {
						if (err) { res.send('erreur'); return false }
						await fs.writeFile(chemin, buffer)
						res.send(fichier.filename)
					})
				} else if (extension === '.png') {
					sharp(chemin).withMetadata().resize(300, 320).toBuffer(async function (err, buffer) {
						if (err) { res.send('erreur'); return false }
						await fs.writeFile(chemin, buffer)
						res.send(fichier.filename)
					})
				} else {
					res.send(fichier.filename)
				}
			})
		}
	})

	app.use(function (req, res) {
		res.redirect('/')
	})

	const port = process.env.PORT || 3000
	httpServer.listen(port)

	const io = new Server(httpServer, {
		// wsEngine: eiows.Server,
		pingInterval: 95000,
    	pingTimeout: 100000,
    	maxHttpBufferSize: 1e8,
		cookie: false,
		perMessageDeflate: false
	})
	if (cluster === true) {
		io.adapter(createAdapter())
	}
	const wrap = middleware => (socket, next) => middleware(socket.request, {}, next)
	io.use(wrap(sessionMiddleware))
	
	io.on('connection', function (socket) {
		socket.on('connexion', async function (donnees) {
			const salle = donnees.salle
			const identifiant = donnees.identifiant
			const nom = donnees.nom
			const avatar = donnees.avatar
			socket.data.identifiant = identifiant
			socket.data.nom = nom
			socket.data.avatar = avatar
			socket.join(salle)
			const clients = await io.to(salle).fetchSockets()
			let utilisateurs = []
			for (let i = 0; i < clients.length; i++) {
				utilisateurs.push({ identifiant: clients[i].data.identifiant, nom: clients[i].data.nom, avatar: clients[i].data.avatar })
			}
			utilisateurs = utilisateurs.filter((valeur, index, self) =>
				index === self.findIndex((t) => (
					t.identifiant === valeur.identifiant && t.nom === valeur.nom && t.avatar === valeur.avatar
				))
			)
			io.to(salle).emit('connexion', { utilisateurs: utilisateurs, utilisateur: { identifiant: identifiant, nom: nom, avatar: avatar } })
		})
	
		socket.on('deconnexion', function (salle) {
			socket.leave(salle)
			socket.to(salle).emit('deconnexion', socket.request.session.identifiant)
		})
	
		socket.on('salleouverte', async function (donnees) {
			if (donnees.hasOwnProperty('options') === true) {
				const reponse = await db.EXISTS('salles:' + donnees.salle)
				if (reponse === null) { socket.emit('erreur'); return false }
				if (reponse === 1) {
					let resultat = await db.HGETALL('salles:' + donnees.salle)
					resultat = Object.assign({}, resultat)
					if (resultat === null || !resultat.hasOwnProperty('donnees')) { socket.emit('erreur'); return false }
					const donneesServeur = JSON.parse(resultat.donnees)
					donneesServeur.options = donnees.options
					await db.HSET('salles:' + donnees.salle, 'donnees', JSON.stringify(donneesServeur))
					socket.to(donnees.salle).emit('salleouverte', donnees)
				}
			} else {
				socket.to(donnees.salle).emit('salleouverte', donnees)
			}
		})
	
		socket.on('sallefermee', function (salle) {
			socket.to(salle).emit('sallefermee')
		})
	
		socket.on('utilisateurs', async function (donnees) {
			const salle = donnees.salle
			const utilisateurs = donnees.utilisateurs
			const reponse = await db.EXISTS('salles:' + salle)
			if (reponse === null) { socket.emit('erreur'); return false }
			if (reponse === 1) {
				let resultat = await db.HGETALL('salles:' + salle)
				resultat = Object.assign({}, resultat)
				if (resultat === null || !resultat.hasOwnProperty('donnees')) { socket.emit('erreur'); return false }
				const donneesReponse = JSON.parse(resultat.donnees)
				donneesReponse.utilisateurs = utilisateurs
				await db.HSET('salles:' + salle, 'donnees', JSON.stringify(donneesReponse))
			} else {
				socket.emit('erreursalle')
			}
		})
	
		socket.on('informations', async function (donnees) {
			const salle = donnees.salle
			const identifiant = donnees.identifiant
			const nom = donnees.nom
			const avatar = donnees.avatar
			const reponse = await db.EXISTS('salles:' + salle)
			if (reponse === null) { socket.emit('erreur'); return false }
			if (reponse === 1) {
				let resultat = await db.HGETALL('salles:' + salle)
				resultat = Object.assign({}, resultat)
				if (resultat === null || !resultat.hasOwnProperty('donnees')) { socket.emit('erreur'); return false }
				const donneesReponse = JSON.parse(resultat.donnees)
				donneesReponse.utilisateurs.forEach(function (utilisateur, indexUtilisateur) {
					if (utilisateur.identifiant === identifiant) {
						donneesReponse.utilisateurs[indexUtilisateur].nom = nom
						donneesReponse.utilisateurs[indexUtilisateur].avatar = avatar
					}
				})
				await db.HSET('salles:' + salle, 'donnees', JSON.stringify(donneesReponse))
				socket.to(salle).emit('informations', { identifiant: identifiant, nom: nom, avatar: avatar })
				socket.data.identifiant = identifiant
				socket.data.nom = nom
				socket.data.avatar = avatar
				socket.request.session.nom = nom
				socket.request.session.avatar = avatar
				socket.request.session.cookie.expires = new Date(Date.now() + dureeSession)
				socket.request.session.save()
			} else {
				socket.emit('erreursalle')
			}
		})
	
		socket.on('question', async function ({ salle, indexQuestion }) {
			const reponse = await db.EXISTS('salles:' + salle)
			if (reponse === null) { socket.emit('erreur'); return false }
			if (reponse === 1) {
				let resultat = await db.HGETALL('salles:' + salle)
				resultat = Object.assign({}, resultat)
				if (resultat === null || !resultat.hasOwnProperty('donnees')) { socket.emit('erreur'); return false }
				const donnees = JSON.parse(resultat.donnees)
				donnees.indexQuestion = indexQuestion
				donnees.statutQuestion = 'question'
				donnees.premiereReponse = ''
				donnees.reponses.push([])
				donnees.resultats.push([])
				if (donnees.hasOwnProperty('options') && donnees.options.reponses === 'ecrites') {
					donnees.textes.push([])
				}
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
				if (donnees.hasOwnProperty('options') && donnees.options.reponses === 'ecrites' && donnees.textes.length < (indexQuestion + 1)) {
					for (let i = 0; i < ((indexQuestion + 1) - donnees.textes.length); i++) {
						donnees.textes.push([])
					}
				}
				await db.HSET('salles:' + salle, 'donnees', JSON.stringify(donnees))
				io.to(salle).emit('question', indexQuestion)
				socket.request.session.cookie.expires = new Date(Date.now() + dureeSession)
				socket.request.session.save()
			} else {
				socket.emit('erreursalle')
			}
		})
	
		socket.on('reponses', async function (salle) {
			const reponse = await db.EXISTS('salles:' + salle)
			if (reponse === null) { socket.emit('erreur'); return false }
			if (reponse === 1) {
				let resultat = await db.HGETALL('salles:' + salle)
				resultat = Object.assign({}, resultat)
				if (resultat === null || !resultat.hasOwnProperty('donnees')) { socket.emit('erreur'); return false }
				const donnees = JSON.parse(resultat.donnees)
				donnees.statutQuestion = 'reponses'
				await db.HSET('salles:' + salle, 'donnees', JSON.stringify(donnees))
				io.to(salle).emit('reponses')
				socket.request.session.cookie.expires = new Date(Date.now() + dureeSession)
				socket.request.session.save()
			} else {
				socket.emit('erreursalle')
			}
		})
	
		socket.on('reponse', function (donnees) {
			io.to(donnees.salle).emit('reponse', donnees)
		})

		socket.on('texte', function (donnees) {
			io.to(donnees.salle).emit('texte', donnees)
		})
	
		socket.on('premierereponse', async function ({ salle, identifiant, indexQuestion }) {
			const reponse = await db.EXISTS('salles:' + salle)
			if (reponse === null) { socket.emit('erreur'); return false }
			if (reponse === 1) {
				let resultat = await db.HGETALL('salles:' + salle)
				resultat = Object.assign({}, resultat)
				if (resultat === null || !resultat.hasOwnProperty('donnees')) { socket.emit('erreur'); return false }
				const donnees = JSON.parse(resultat.donnees)
				donnees.premiereReponse = identifiant
				if (donnees.hasOwnProperty('reponses') && donnees.reponses[indexQuestion]) {
					donnees.reponses[indexQuestion].push(identifiant)
					await db.HSET('salles:' + salle, 'donnees', JSON.stringify(donnees))
					io.to(salle).emit('premierereponse', identifiant)
					socket.request.session.cookie.expires = new Date(Date.now() + dureeSession)
					socket.request.session.save()
				}
			} else {
				socket.emit('erreursalle')
			}
		})

		socket.on('texteenvoye', async function ({ salle, identifiant, indexQuestion, texte }) {
			const reponse = await db.EXISTS('salles:' + salle)
			if (reponse === null) { socket.emit('erreur'); return false }
			if (reponse === 1) {
				let resultat = await db.HGETALL('salles:' + salle)
				resultat = Object.assign({}, resultat)
				if (resultat === null || !resultat.hasOwnProperty('donnees')) { socket.emit('erreur'); return false }
				const donnees = JSON.parse(resultat.donnees)
				if (donnees.hasOwnProperty('textes') && donnees.textes[indexQuestion]) {
					donnees.textes[indexQuestion].push({ identifiant: identifiant, texte: texte })
					await db.HSET('salles:' + salle, 'donnees', JSON.stringify(donnees))
					io.to(salle).emit('texteenvoye', texte)
					socket.request.session.cookie.expires = new Date(Date.now() + dureeSession)
					socket.request.session.save()
				}
			} else {
				socket.emit('erreursalle')
			}
		})
	
		socket.on('reponseannulee', async function ({ salle, identifiant }) {
			const reponse = await db.EXISTS('salles:' + salle)
			if (reponse === null) { socket.emit('erreur'); return false }
			if (reponse === 1) {
				let resultat = await db.HGETALL('salles:' + salle)
				resultat = Object.assign({}, resultat)
				if (resultat === null || !resultat.hasOwnProperty('donnees')) { socket.emit('erreur'); return false }
				const donnees = JSON.parse(resultat.donnees)
				donnees.premiereReponse = ''
				await db.HSET('salles:' + salle, 'donnees', JSON.stringify(donnees))
				io.to(salle).emit('reponseannulee', identifiant)
				socket.request.session.cookie.expires = new Date(Date.now() + dureeSession)
				socket.request.session.save()
			} else {
				socket.emit('erreursalle')
			}
		})
	
		socket.on('reponsevalidee', async function ({ salle, identifiant, indexQuestion, points }) {
			const reponse = await db.EXISTS('salles:' + salle)
			if (reponse === null) { socket.emit('erreur'); return false }
			if (reponse === 1) {
				let resultat = await db.HGETALL('salles:' + salle)
				resultat = Object.assign({}, resultat)
				if (resultat === null || !resultat.hasOwnProperty('donnees')) { socket.emit('erreur'); return false }
				const donnees = JSON.parse(resultat.donnees)
				donnees.statutQuestion = ''
				if (donnees.hasOwnProperty('resultats') && donnees.resultats[indexQuestion]) {
					donnees.resultats[indexQuestion].push({ identifiant: identifiant, points: parseInt(points) })
					await db.HSET('salles:' + salle, 'donnees', JSON.stringify(donnees))
					io.to(salle).emit('reponsevalidee', { identifiant: identifiant, points: parseInt(points), indexQuestion: indexQuestion })
					socket.request.session.cookie.expires = new Date(Date.now() + dureeSession)
					socket.request.session.save()
				}
			} else {
				socket.emit('erreursalle')
			}
		})
	
		socket.on('score', async function ({ salle, identifiant, bonus }) {
			const reponse = await db.EXISTS('salles:' + salle)
			if (reponse === null) { socket.emit('erreur'); return false }
			if (reponse === 1) {
				let resultat = await db.HGETALL('salles:' + salle)
				resultat = Object.assign({}, resultat)
				if (resultat === null || !resultat.hasOwnProperty('donnees')) { socket.emit('erreur'); return false }
				const donnees = JSON.parse(resultat.donnees)
				if (donnees.bonus.map(function (e) { return e.identifiant }).includes(identifiant) === true) {
					donnees.bonus.forEach(function (u, index) {
						if (u.identifiant === identifiant) {
							donnees.bonus[index].points = parseInt(bonus)
						}
					})
				} else {
					donnees.bonus.push({ identifiant: identifiant, points: parseInt(bonus) })
				}
				await db.HSET('salles:' + salle, 'donnees', JSON.stringify(donnees))
				io.to(salle).emit('score', { identifiant: identifiant, bonus: parseInt(bonus) })
				socket.request.session.cookie.expires = new Date(Date.now() + dureeSession)
				socket.request.session.save()
			} else {
				socket.emit('erreursalle')
			}
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
