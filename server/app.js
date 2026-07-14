import 'dotenv/config'
import path from 'path'
import fs from 'fs-extra'
import express from 'express'
import { createServer } from 'http'
import { Server } from 'socket.io'
import { createAdapter } from '@socket.io/cluster-adapter'
import eiows from 'eiows'
import compression from 'compression'
import cors from 'cors'
import { createClient } from 'redis'
import helmet from 'helmet'
import multer from 'multer'
import sharp from 'sharp'
import dayjs from 'dayjs'
import cron from 'node-cron'
import { fileURLToPath } from 'url'
import { RedisStore } from 'connect-redis'
import session from 'express-session'
import rateLimit from 'express-rate-limit'
import { RedisStore as RateLimitRedisStore } from 'rate-limit-redis'
import { randomBytes } from 'crypto'
import { renderPage, createDevMiddleware } from 'vike/server'

const production = process.env.NODE_ENV === 'production'

if (!process.env.SESSION_KEY || process.env.SESSION_KEY.trim() === '') {
	console.error('ERREUR : la variable d\'environnement SESSION_KEY est manquante ou vide. Le serveur ne peut pas démarrer.')
	process.exit(1)
}

let cluster = false
if (production) {
	cluster = parseInt(process.env.NODE_CLUSTER) === 1
}
const __dirname = path.dirname(fileURLToPath(import.meta.url))
const root = `${__dirname}/..`

const demarrerServeur = async () => {
	const app = express()
	app.use(compression())
	const httpServer = createServer(app)

	let hote = 'http://localhost:3000'
	if (production) {
		hote = process.env.DOMAIN
	} else if (process.env.PORT) {
		hote = 'http://localhost:' + process.env.PORT
	}
	const hoteWs = hote.replace(/^https:\/\//, 'wss://').replace(/^http:\/\//, 'ws://')
	const langues = ['fr', 'en', 'it', 'de', 'es']
	let db
	const db_port = parseInt(process.env.DB_PORT) || 6379
	if (production) {
		db = await createClient({
			url: 'redis://default:' + process.env.DB_PWD  + '@' + process.env.DB_HOST + ':' + db_port
		}).on('error', (err) => {
			console.error('Erreur Redis : ' + err)
		}).connect()
	} else {
		db = await createClient({
			url: 'redis://localhost:' + db_port
		}).on('error', (err) => {
			console.error('Erreur Redis : ' + err)
		}).connect()
	}
	const cookieSecurise = parseInt(process.env.COOKIE_SECURE) !== 0
	let storeOptions, cookie, dureeSession, domainesAutorises
	if (production) {
		storeOptions = {
			host: process.env.DB_HOST,
			port: db_port,
			pass: process.env.DB_PWD,
			client: db,
			prefix: 'sessions:'
		}
		cookie = cookieSecurise ? { sameSite: 'None', secure: true } : { sameSite: 'Lax', secure: false }
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
	if (production && !process.env.SESSION_KEY) {
		throw new Error('SESSION_KEY manquante dans les variables d\'environnement. Arrêt du serveur.')
	}
	const redisStore = new RedisStore(storeOptions)
	const sessionOptions = {
		secret: process.env.SESSION_KEY || 'cle-par-defaut-dev',
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

	if (production && process.env.AUTHORIZED_DOMAINS) {
		domainesAutorises = process.env.AUTHORIZED_DOMAINS.split(',')
	} else {
		domainesAutorises = hote
	}

	let earlyHints103 = false
	if (process.env.EARLY_HINTS && parseInt(process.env.EARLY_HINTS) === 1) {
		earlyHints103 = true
	}

	cron.schedule('59 23 * * Saturday', async () => {
		try {
			const salles = await db.KEYS('salles:*')
			const promesses = salles.map(async (salle) => {
				try {
					const salleExiste = await db.EXISTS(salle)
					if (salleExiste !== 1) return 0
					let donneesSalle = await db.HGETALL(salle)
					donneesSalle = donneesSalle ? { ...donneesSalle } : {}
					if (!donneesSalle.hasOwnProperty('date')) return 0
					if (dayjs(new Date(donneesSalle.date)).isBefore(dayjs().subtract(14, 'days'))) {
						await db.DEL(salle)
						return 1
					}
					return 0
				} catch (err) {
					console.error('Erreur cron : ', err)
					return 0
				}
			})
			await Promise.all(promesses)
		} catch (err) {
			console.error('Erreur cron : ', err.message)
		}
	})

	const limiteApi = rateLimit({
		windowMs: 15 * 60 * 1000,
		limit: 100,
		standardHeaders: 'draft-7',
		legacyHeaders: false,
		store: new RateLimitRedisStore({
			sendCommand: (...args) => db.sendCommand(args),
			prefix: 'rl-api:'
		}),
		skipSuccessfulRequests: true,
		validate: { trustProxy: false }
	})

	let scriptSrc
	let domaineUmami = null
	if (process.env.UMAMI_SCRIPT_URL && process.env.UMAMI_SCRIPT_URL !== '') {
		const umamiScriptUrl = new URL(process.env.UMAMI_SCRIPT_URL)
		domaineUmami = umamiScriptUrl.protocol + '//' + umamiScriptUrl.hostname
		scriptSrc = ["'self'", domaineUmami]
	} else {
		scriptSrc = ["'self'"]
	}
	if (!production) {
		scriptSrc.push("'unsafe-inline'")
	}
	let hoteVite = 'ws://localhost:24678'
	if (production) {
		hoteVite = ''
	}
	app.set('trust proxy', true)
	app.use(
		helmet.contentSecurityPolicy({
			directives: {
				"default-src": ["'self'", "https:"],
				"connect-src": ["'self'", hoteWs, hoteVite, ...(domaineUmami ? [domaineUmami] : [])],
				"script-src": scriptSrc,
				"media-src": ["'self'", "data:"],
				"frame-ancestors": ["'self'", 'https://ladigitale.dev', 'https://digipad.app', 'https://digiwall.app']
			}
		})
	)
	app.use(express.json({ limit: '10mb' }))
	app.use(sessionMiddleware)
	app.use(cors({ origin: domainesAutorises }))
	app.use('/api/', limiteApi)
	if (parseInt(process.env.REVERSE_PROXY) !== 1 || !production) {
		app.use('/avatars', express.static('avatars'))
	}

	if (!production) {
		const { devMiddleware } = await createDevMiddleware({ root })
		app.use(devMiddleware)
	} else if (production && parseInt(process.env.REVERSE_PROXY) !== 1) {
		const sirv = (await import('sirv')).default
		app.use(sirv(`${root}/dist/client`))
	}
	
	app.get('/', async (req, res, next) => {
		let langue = 'fr'
		if (req.session.hasOwnProperty('langue') && req.session.langue !== '') {
			langue = req.session.langue
		}
		const pageContextInit = {
			urlOriginal: req.originalUrl,
			params: req.query,
			hote: hote,
			langues: langues,
			langue: langue
		}
		const pageContext = await renderPage(pageContextInit)
		if (pageContext.errorWhileRendering) {
			if (!pageContext.httpResponse) throw pageContext.errorWhileRendering
		}
		const { httpResponse } = pageContext
		if (!httpResponse) return next()
		const { body, statusCode, headers, earlyHints } = httpResponse
		if (earlyHints103 === true && res.writeEarlyHints) {
			res.writeEarlyHints({ link: earlyHints.map((e) => e.earlyHintLink) })
		}
		if (headers) {
			headers.forEach(([name, value]) => res.setHeader(name, value))
		}
		res.status(statusCode).send(body)
	})

	app.get('/c/:salle', async (req, res, next) => {
		if (!req.session.identifiant) return res.redirect('/')
		let langue = 'fr'
		if (req.session.hasOwnProperty('langue') && req.session.langue !== '') {
			langue = req.session.langue
		}
		const pageContextInit = {
			urlOriginal: req.originalUrl,
			params: req.query,
			hote: hote,
			langues: langues,
			identifiant: req.session.identifiant,
			nom: req.session.nom,
			avatar: req.session.avatar,
			langue: langue,
			role: req.session.role,
			salles: req.session.salles
		}
		const pageContext = await renderPage(pageContextInit)
		if (pageContext.errorWhileRendering) {
			if (!pageContext.httpResponse) throw pageContext.errorWhileRendering
		}
		const { httpResponse } = pageContext
		if (!httpResponse) return next()
		const { body, statusCode, headers, earlyHints } = httpResponse
		if (earlyHints103 === true && res.writeEarlyHints) {
			res.writeEarlyHints({ link: earlyHints.map((e) => e.earlyHintLink) })
		}
		if (headers) {
			headers.forEach(([name, value]) => res.setHeader(name, value))
		}
		res.status(statusCode).send(body)
	})

	app.get('/p/:salle', async (req, res, next) => {
		const salle = req.params.salle
		if (!req.session.identifiant || !req.session.hasOwnProperty('salle') || req.session.salle !== salle) {
			const identifiant = 'u' + Math.random().toString(16).slice(3)
			req.session.identifiant = identifiant
			req.session.nom = ''
			req.session.avatar = 'avatar1.png'
			req.session.langue = 'fr'
			req.session.role = 'joueur'
			req.session.salle = salle
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
			langues: langues,
			identifiant: req.session.identifiant,
			nom: req.session.nom,
			avatar: req.session.avatar,
			langue: req.session.langue,
			role: req.session.role
		}
		const pageContext = await renderPage(pageContextInit)
		if (pageContext.errorWhileRendering) {
			if (!pageContext.httpResponse) throw pageContext.errorWhileRendering
		}
		const { httpResponse } = pageContext
		if (!httpResponse) return next()
		const { body, statusCode, headers, earlyHints } = httpResponse
		if (earlyHints103 === true && res.writeEarlyHints) {
			res.writeEarlyHints({ link: earlyHints.map((e) => e.earlyHintLink) })
		}
		if (headers) {
			headers.forEach(([name, value]) => res.setHeader(name, value))
		}
		res.status(statusCode).send(body)
	})

	app.post('/api/creer-salle', async (req, res) => {
		if (!req.session.identifiant) {
			const identifiant = 'u' + Math.random().toString(16).slice(3)
			req.session.identifiant = identifiant
		}
		if (!req.session.hasOwnProperty('salles')) {
			req.session.salles = []
		}
		const titre = req.body.titre
		const salle = randomBytes(8).toString('hex')
		const date = dayjs().format()
		try {
			const salleExiste = await db.EXISTS('salles:' + salle)
			if (salleExiste === 1) return res.status(409).send('existe_deja')
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
			req.session.salle = ''
			req.session.salles.push(salle)
			req.session.cookie.expires = new Date(Date.now() + dureeSession)
			res.status(200).json({ salle: salle })
		} catch (err) {
			console.error(err.stack)
			res.status(500).send('erreur')
		}
	})

	app.post('/api/modifier-titre-salle', async (req, res) => {
		const identifiant = req.body.identifiant
		if (!req.session.identifiant || req.session.identifiant !== identifiant) return res.status(403).send('non_autorise')
		const salle = req.body.salle
		try {
			const salleExiste = await db.EXISTS('salles:' + salle)
			if (salleExiste === 0) return res.status(404).send('erreur')
			const titre = req.body.titre
			await db.HSET('salles:' + salle, 'titre', titre)
			res.status(200).send('titre_modifie')
		} catch (err) {
			console.error(err.stack)
			res.status(500).send('erreur')
		}
	})

	app.post('/api/modifier-statut-salle', async (req, res) => {
		const identifiant = req.body.identifiant
		if (!req.session.identifiant || req.session.identifiant !== identifiant) return res.status(403).send('non_autorise')
		const salle = req.body.salle
		try {
			const salleExiste = await db.EXISTS('salles:' + salle)
			if (salleExiste === 0) return res.status(404).send('erreur')
			const statut = req.body.statut
			if (!['', 'ouvert', 'ferme'].includes(statut)) return res.status(400).send('non_autorise')
			await db.HSET('salles:' + salle, 'statut', statut)
			res.status(200).send('statut_modifie')
		} catch (err) {
			console.error(err.stack)
			res.status(500).send('erreur')
		}
	})

	app.post('/api/recuperer-donnees-salle', async (req, res) => {
		const salle = req.body.salle
		try {
			const salleExiste = await db.EXISTS('salles:' + salle)
			if (salleExiste === 0) return res.status(404).send('salle_inexistante')
			let donneesSalle = await db.HGETALL('salles:' + salle)
			donneesSalle = donneesSalle ? { ...donneesSalle } : {}
			const titre = donneesSalle.titre
			const statut = donneesSalle.statut
			const donnees = parseJSON(donneesSalle.donnees, {})
			res.status(200).json({ titre: titre, statut: statut, donnees: donnees })
		} catch (err) {
			console.error(err.stack)
			res.status(500).send('erreur')
		}
	})
	
	app.post('/api/modifier-informations', (req, res) => {
		const nom = req.body.nom
		const avatar = req.body.avatar
		if (typeof nom !== 'string' || typeof avatar !== 'string') {
			return res.status(400).send('erreur')
		}
		if (avatar !== '' && path.basename(avatar) !== avatar) {
			return res.status(400).send('erreur')
		}
		req.session.nom = nom
		req.session.avatar = avatar
		req.session.save(() => {
			res.status(200).send('informations_modifiees')
		})
	})

	app.post('/api/modifier-langue', (req, res) => {
		const langue = req.body.langue
		if (!langues.includes(langue)) return res.status(400).send('non_autorise')
		req.session.langue = langue
		req.session.save(() => {
			res.status(200).send('langue_modifiee')
		})
	})

	app.post('/api/televerser-avatar', (req, res) => {
		const identifiant = req.session.identifiant
		if (!identifiant) return res.status(403).send('non_autorise')
		televerser(req, res, async () => {
			const fichier = req.file
			if (!fichier) return res.status(400).send('erreur')
			const info = path.parse(fichier.originalname)
			const extension = info.ext.toLowerCase()
			const chemin = path.join(__dirname, '..', '/avatars/' + fichier.filename)
			try {
				const metadata = await sharp(chemin).metadata()
				if (!['jpeg', 'png'].includes(metadata.format)) {
					await fs.unlink(chemin).catch(() => {})
					res.status(400).send('erreur')
					return
				}
			} catch {
				await fs.unlink(chemin).catch(() => {})
				res.status(500).send('erreur')
				return
			}
			if (extension === '.jpg' || extension === '.jpeg') {
				try {
					const bufferOptimise = await sharp(chemin, { failOnError: false })
						.withMetadata()
						.rotate()
						.jpeg({
							quality: 90,
							progressive: true
						})
						.resize(300, 320)
						.toBuffer()
					if (!bufferOptimise) return res.status(500).send('erreur')
					await fs.writeFile(chemin, bufferOptimise)
					res.status(200).send(fichier.filename)
				} catch {
					await fs.unlink(chemin).catch(() => {})
					res.status(500).send('erreur')
				}
			} else if (extension === '.png') {
				try {
					const bufferOptimise = await sharp(chemin, { failOnError: false })
						.withMetadata()
						.resize(300, 320)
						.toBuffer()
					if (!bufferOptimise) return res.status(500).send('erreur')
					await fs.writeFile(chemin, bufferOptimise)
					res.status(200).send(fichier.filename)
				} catch {
					await fs.unlink(chemin).catch(() => {})
					res.status(500).send('erreur')
				}
			} else {
				res.status(200).send(fichier.filename)
			}
		})
	})

	app.use((req, res) => {
		res.redirect('/')
	})

	const port = process.env.PORT || 3000
	httpServer.listen(port)

	const io = new Server(httpServer, {
		wsEngine: eiows.Server,
		cors: {
			origin: hoteWs
		},
		pingInterval: 120000,
    	pingTimeout: 100000,
    	maxHttpBufferSize: 1e7,
		cookie: false,
		perMessageDeflate: false
	})
	if (cluster === true) {
		io.adapter(createAdapter())
	}
	const wrap = middleware => (socket, next) => middleware(socket.request, {}, next)
	io.use(wrap(sessionMiddleware))
	// Rate limit pour les sockets : 100 actions par seconde par worker
	const compteurSocket = new Map()
	io.use((socket, next) => {
		const identifiant = socket.request.session?.identifiant || socket.handshake.address
		if (!compteurSocket.has(identifiant)) {
			compteurSocket.set(identifiant, { n: 0, intervalle: setInterval(() => {
				compteurSocket.get(identifiant).n = 0
			}, 1000) })
		}
		socket.use((paquet, suivant) => {
			let etat = compteurSocket.get(identifiant)
			if (!etat) {
				etat = { n: 0, intervalle: setInterval(() => {
					const e = compteurSocket.get(identifiant)
					if (e) e.n = 0
				}, 1000) }
				compteurSocket.set(identifiant, etat)
			}
			etat.n++
			if (etat.n > 100) {
				return suivant(new Error('connexions_trop_nombreuses'))
			}
			suivant()
		})
		socket.on('disconnect', () => {
			const io_sockets = [...io.sockets.sockets.values()]
			const autreSockets = io_sockets.filter((s)  => {
				return s.id !== socket.id && (s.request.session?.identifiant || s.handshake.address) === identifiant
			})
			if (autreSockets.length === 0) {
				const etat = compteurSocket.get(identifiant)
				if (etat) {
					clearInterval(etat.intervalle)
					compteurSocket.delete(identifiant)
				}
			}
		})
		next()
	})
	
	io.on('connection', (socket) => {
		const req = socket.request
		socket.use((__, next) => {
			req.session.reload((err) => {
				if (err) return socket.disconnect()
				next()
			})
		})

		socket.on('connexion', async (donnees) => {
			try {
				const salle = donnees.salle
				const identifiant = donnees.identifiant
				const nom = donnees.nom
				const avatar = donnees.avatar
				socket.data.identifiant = identifiant
				socket.data.nom = nom
				socket.data.avatar = avatar
				socket.data.salle = salle
				socket.join(salle)
				const clients = await io.to(salle).fetchSockets()
				const utilisateurs = []
				for (let i = 0; i < clients.length; i++) {
					utilisateurs.push({ identifiant: clients[i].data.identifiant, nom: clients[i].data.nom, avatar: clients[i].data.avatar })
				}
				const utilisateursConnectes = utilisateurs.filter((valeur, index, self) =>
					index === self.findIndex((t) => (
						t.identifiant === valeur.identifiant && t.nom === valeur.nom && t.avatar === valeur.avatar
					))
				)
				io.to(salle).emit('connexion', { utilisateurs: utilisateursConnectes, utilisateur: { identifiant: identifiant, nom: nom, avatar: avatar } })
			} catch (err) {
				console.error(err.stack)
				socket.emit('erreur')
			}
		})
	
		socket.on('deconnexion', () => {
			const salle = socket.data.salle
			if (!salle) return
			socket.leave(salle)
			socket.to(salle).emit('deconnexion', req.session.identifiant)
			socket.data.salle = null
		})

		socket.on('disconnecting', () => {
			if (req.session.identifiant !== '') {
				socket.rooms.forEach((room) => {
					io.to(room).emit('deconnexion', req.session.identifiant)
				})
			}
		})
	
		socket.on('salleouverte', async (donnees) => {
			if (!verifierAdmin(req, donnees.salle)) return socket.emit('erreur')
			if (!donnees.hasOwnProperty('options')) return socket.to(donnees.salle).emit('salleouverte', donnees)
			try {
				const salleExiste = await db.EXISTS('salles:' + donnees.salle)
				if (salleExiste !== 1) return socket.emit('erreur')
				let donneesSalle = await db.HGETALL('salles:' + donnees.salle)
				donneesSalle = donneesSalle ? { ...donneesSalle } : {}
				if (!donneesSalle.hasOwnProperty('donnees')) return socket.emit('erreur')
				const donneesServeur = parseJSON(donneesSalle.donnees, {})
				donneesServeur.options = donnees.options
				await db.HSET('salles:' + donnees.salle, 'donnees', JSON.stringify(donneesServeur))
				socket.to(donnees.salle).emit('salleouverte', donnees)
			} catch (err) {
				console.error(err.stack)
				socket.emit('erreur')
			}
		})
	
		socket.on('sallefermee', (salle) => {
			if (!verifierAdmin(req, salle)) return
			socket.to(salle).emit('sallefermee')
		})
	
		socket.on('utilisateurs', async (donnees) => {
			const salle = donnees.salle
			if (!verifierAdmin(req, salle)) return socket.emit('erreur')
			try {
				const utilisateurs = donnees.utilisateurs
				const salleExiste = await db.EXISTS('salles:' + salle)
				if (salleExiste === 0) return socket.emit('erreursalle')
				let donneesSalle = await db.HGETALL('salles:' + salle)
				donneesSalle = donneesSalle ? { ...donneesSalle } : {}
				if (!donneesSalle.hasOwnProperty('donnees')) return socket.emit('erreur')
				const donneesReponse = parseJSON(donneesSalle.donnees, {})
				donneesReponse.utilisateurs = utilisateurs
				await db.HSET('salles:' + salle, 'donnees', JSON.stringify(donneesReponse))
			} catch (err) {
				console.error(err.stack)
				socket.emit('erreur')
			}
		})

		socket.on('utilisateursbannis', async (donnees) => {
			const salle = donnees.salle
			if (!verifierAdmin(req, salle)) return socket.emit('erreur')
			try {
				const utilisateursBannis = donnees.utilisateursBannis
				const identifiant = donnees.identifiant
				const type = donnees.type
				const salleExiste = await db.EXISTS('salles:' + salle)
				if (salleExiste === 0) return socket.emit('erreursalle')
				let donneesSalle = await db.HGETALL('salles:' + salle)
				donneesSalle = donneesSalle ? { ...donneesSalle } : {}
				if (!donneesSalle.hasOwnProperty('donnees')) return socket.emit('erreur')
				const donneesReponse = parseJSON(donneesSalle.donnees, {})
				donneesReponse.utilisateursBannis = utilisateursBannis
				await db.HSET('salles:' + salle, 'donnees', JSON.stringify(donneesReponse))
				if (type === 'banni') {
					socket.to(salle).emit('utilisateurbanni', identifiant)
				} else {
					socket.to(salle).emit('utilisateurautorise', identifiant)
				}
			} catch (err) {
				console.error(err.stack)
				socket.emit('erreur')
			}
		})
	
		socket.on('informations', async (donnees) => {
			try {
				const salle = donnees.salle
				const identifiant = donnees.identifiant
				const nom = donnees.nom
				const avatar = donnees.avatar
				const salleExiste = await db.EXISTS('salles:' + salle)
				if (salleExiste === 0) return socket.emit('erreursalle')
				let donneesSalle = await db.HGETALL('salles:' + salle)
				donneesSalle = donneesSalle ? { ...donneesSalle } : {}
				if (!donneesSalle.hasOwnProperty('donnees')) return socket.emit('erreur')
				const donneesReponse = parseJSON(donneesSalle.donnees, {})
				donneesReponse.utilisateurs.forEach((utilisateur, indexUtilisateur) => {
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
				req.session.nom = nom
				req.session.avatar = avatar
				req.session.cookie.expires = new Date(Date.now() + dureeSession)
				await sauvegarderSession(req)
			} catch (err) {
				console.error(err.stack)
				socket.emit('erreur')
			}
		})
	
		socket.on('question', async ({ salle, indexQuestion }) => {
			if (!verifierAdmin(req, salle)) return socket.emit('erreur')
			try {
				const salleExiste = await db.EXISTS('salles:' + salle)
				if (salleExiste === 0) return socket.emit('erreursalle')
				let donneesSalle = await db.HGETALL('salles:' + salle)
				donneesSalle = donneesSalle ? { ...donneesSalle } : {}
				if (!donneesSalle.hasOwnProperty('donnees')) return socket.emit('erreur')
				const donnees = parseJSON(donneesSalle.donnees, {})
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
				req.session.cookie.expires = new Date(Date.now() + dureeSession)
				await sauvegarderSession(req)
			} catch (err) {
				console.error(err.stack)
				socket.emit('erreur')
			}
		})
	
		socket.on('reponses', async (salle) => {
			if (!verifierAdmin(req, salle)) return socket.emit('erreur')
			try {
				const salleExiste = await db.EXISTS('salles:' + salle)
				if (salleExiste === 0) return socket.emit('erreursalle')
				let donneesSalle = await db.HGETALL('salles:' + salle)
				donneesSalle = donneesSalle ? { ...donneesSalle } : {}
				if (!donneesSalle.hasOwnProperty('donnees')) return socket.emit('erreur')
				const donnees = parseJSON(donneesSalle.donnees, {})
				donnees.statutQuestion = 'reponses'
				await db.HSET('salles:' + salle, 'donnees', JSON.stringify(donnees))
				io.to(salle).emit('reponses')
				req.session.cookie.expires = new Date(Date.now() + dureeSession)
				await sauvegarderSession(req)
			} catch (err) {
				console.error(err.stack)
				socket.emit('erreur')
			}
		})
	
		socket.on('reponse', (donnees) => {
			if (donnees.identifiant !== req.session?.identifiant) return
			if (!donnees.salle || donnees.salle !== socket.data.salle) return
			io.to(donnees.salle).emit('reponse', donnees)
		})

		socket.on('texte', (donnees) => {
			if (donnees.identifiant !== req.session?.identifiant) return
			if (!donnees.salle || donnees.salle !== socket.data.salle) return
			io.to(donnees.salle).emit('texte', donnees)
		})
	
		socket.on('premierereponse', async ({ salle, identifiant, indexQuestion }) => {
			if (!verifierAdmin(req, salle)) return socket.emit('erreur')
			try {
				const salleExiste = await db.EXISTS('salles:' + salle)
				if (salleExiste === 0) return socket.emit('erreursalle')
				let donneesSalle = await db.HGETALL('salles:' + salle)
				donneesSalle = donneesSalle ? { ...donneesSalle } : {}
				if (!donneesSalle.hasOwnProperty('donnees')) return socket.emit('erreur')
				const donnees = parseJSON(donneesSalle.donnees, {})
				donnees.premiereReponse = identifiant
				if (donnees.hasOwnProperty('reponses') && donnees.reponses[indexQuestion]) {
					donnees.reponses[indexQuestion].push(identifiant)
					await db.HSET('salles:' + salle, 'donnees', JSON.stringify(donnees))
					io.to(salle).emit('premierereponse', identifiant)
					req.session.cookie.expires = new Date(Date.now() + dureeSession)
					await sauvegarderSession(req)
				}
			} catch (err) {
				console.error(err.stack)
				socket.emit('erreur')
			}
		})

		socket.on('texteenvoye', async ({ salle, identifiant, indexQuestion, texte }) => {
			if (!verifierAdmin(req, salle)) return socket.emit('erreur')
			try {
				const salleExiste = await db.EXISTS('salles:' + salle)
				if (salleExiste === 0) return socket.emit('erreursalle')
				let donneesSalle = await db.HGETALL('salles:' + salle)
				donneesSalle = donneesSalle ? { ...donneesSalle } : {}
				if (!donneesSalle.hasOwnProperty('donnees')) return socket.emit('erreur')
				const donnees = parseJSON(donneesSalle.donnees, {})
				if (donnees.hasOwnProperty('textes') && donnees.textes[indexQuestion]) {
					donnees.textes[indexQuestion].push({ identifiant: identifiant, texte: texte })
					await db.HSET('salles:' + salle, 'donnees', JSON.stringify(donnees))
					io.to(salle).emit('texteenvoye', texte)
					req.session.cookie.expires = new Date(Date.now() + dureeSession)
					await sauvegarderSession(req)
				}
			} catch (err) {
				console.error(err.stack)
				socket.emit('erreur')
			}
		})
	
		socket.on('reponseannulee', async ({ salle, identifiant }) => {
			if (!verifierAdmin(req, salle)) return socket.emit('erreur')
			try {
				const salleExiste = await db.EXISTS('salles:' + salle)
				if (salleExiste === 0) return socket.emit('erreursalle')
				let donneesSalle = await db.HGETALL('salles:' + salle)
				donneesSalle = donneesSalle ? { ...donneesSalle } : {}
				if (!donneesSalle.hasOwnProperty('donnees')) return socket.emit('erreur')
				const donnees = parseJSON(donneesSalle.donnees, {})
				donnees.premiereReponse = ''
				await db.HSET('salles:' + salle, 'donnees', JSON.stringify(donnees))
				io.to(salle).emit('reponseannulee', identifiant)
				req.session.cookie.expires = new Date(Date.now() + dureeSession)
				await sauvegarderSession(req)
			} catch (err) {
				console.error(err.stack)
				socket.emit('erreur')
			}
		})
	
		socket.on('reponsecomptabilisee', async ({ salle, identifiant, type, points, indexQuestion }) => {
			if (!verifierAdmin(req, salle)) return socket.emit('erreur')
			try {
				const salleExiste = await db.EXISTS('salles:' + salle)
				if (salleExiste === 0) return socket.emit('erreursalle')
				let donneesSalle = await db.HGETALL('salles:' + salle)
				donneesSalle = donneesSalle ? { ...donneesSalle } : {}
				if (!donneesSalle.hasOwnProperty('donnees')) return socket.emit('erreur')
				const donnees = parseJSON(donneesSalle.donnees, {})
				if (type === 'bonne-reponse') {
					donnees.statutQuestion = ''
				} else {
					donnees.premiereReponse = ''
				}
				if (donnees.hasOwnProperty('resultats') && donnees.resultats[indexQuestion]) {
					donnees.resultats[indexQuestion].push({ identifiant: identifiant, points: parseInt(points) })
					await db.HSET('salles:' + salle, 'donnees', JSON.stringify(donnees))
					io.to(salle).emit('reponsecomptabilisee', { identifiant: identifiant, type: type, points: parseInt(points), indexQuestion: indexQuestion })
					req.session.cookie.expires = new Date(Date.now() + dureeSession)
					await sauvegarderSession(req)
				}
			} catch (err) {
				console.error(err.stack)
				socket.emit('erreur')
			}
		})
	
		socket.on('score', async ({ salle, identifiant, bonus }) => {
			if (!verifierAdmin(req, salle)) return socket.emit('erreur')
			try {
				const salleExiste = await db.EXISTS('salles:' + salle)
				if (salleExiste === 0) return socket.emit('erreursalle')
				let donneesSalle = await db.HGETALL('salles:' + salle)
				donneesSalle = donneesSalle ? { ...donneesSalle } : {}
				if (!donneesSalle.hasOwnProperty('donnees')) return socket.emit('erreur')
				const donnees = parseJSON(donneesSalle.donnees, {})
				if (donnees.bonus.map((e) => e.identifiant).includes(identifiant) === true) {
					donnees.bonus.forEach((u, index) => {
						if (u.identifiant === identifiant) {
							donnees.bonus[index].points = parseInt(bonus)
						}
					})
				} else {
					donnees.bonus.push({ identifiant: identifiant, points: parseInt(bonus) })
				}
				await db.HSET('salles:' + salle, 'donnees', JSON.stringify(donnees))
				io.to(salle).emit('score', { identifiant: identifiant, bonus: parseInt(bonus) })
				req.session.cookie.expires = new Date(Date.now() + dureeSession)
				await sauvegarderSession(req)
			} catch (err) {
				console.error(err.stack)
				socket.emit('erreur')
			}
		})
	
		socket.on('modifierlangue', async (langue) => {
			req.session.langue = langue
			await sauvegarderSession(req)
		})
	})

	const verifierAdmin = (req, salle) => {
		const session = req.session
		return session && session.role === 'animateur' && Array.isArray(session.salles) && session.salles.includes(salle)
	}

	const sauvegarderSession = (req) => {
		return new Promise((resolve, reject) => {
			req.session.save((err) => {
				if (err) reject(err)
				else resolve()
			})
		})
	}

	const parseJSON = (str, fallback) => {
		try {
			return JSON.parse(str)
		} catch (e) {
			return fallback
		}
	}

	const televerser = multer({
		limits: { fileSize: 10 * 1024 * 1024 },
		storage: multer.diskStorage({
			destination: (req, fichier, callback) => {
				const chemin = path.join(__dirname, '..', '/avatars/')
				callback(null, chemin)
			},
			filename: (req, fichier, callback) => {
				const info = path.parse(fichier.originalname)
				const extension = info.ext.toLowerCase()
				const nom = 'avatar_' + Math.random().toString(36).substring(2) + extension
				callback(null, nom)
			}
		})
	}).single('fichier')
}

demarrerServeur()
