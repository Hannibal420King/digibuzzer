import assert from 'node:assert/strict'
import { createHash } from 'node:crypto'
import { execFileSync } from 'node:child_process'
import { readFile } from 'node:fs/promises'
import { io } from 'socket.io-client'

const mode = process.argv[2]
const baseUrl = (process.argv[3] || 'http://127.0.0.1:33180').replace(/\/$/, '')

const request = async (path, options = {}) => {
	const headers = new Headers(options.headers || {})
	if (options.cookie) headers.set('Cookie', options.cookie)
	if (options.json !== undefined) headers.set('Content-Type', 'application/json')
	const response = await fetch(`${baseUrl}${path}`, {
		method: options.method || (options.json === undefined ? 'GET' : 'POST'),
		headers,
		body: options.json === undefined ? options.body : JSON.stringify(options.json),
		redirect: options.redirect || 'follow',
	})
	const bytes = Buffer.from(await response.arrayBuffer())
	if (!response.ok) throw new Error(`${response.status} ${path}: ${bytes.toString('utf8')}`)
	return {
		response,
		bytes,
		text: bytes.toString('utf8'),
		cookie: response.headers.get('set-cookie')?.split(';', 1)[0] || options.cookie || '',
	}
}

const pageContext = (html) => {
	const match = html.match(/<script id="vike_pageContext" type="application\/json">(.*?)<\/script>/s)
	assert.ok(match, 'SSR page context must be present')
	return JSON.parse(match[1]).pageProps
}

const connect = (cookie) =>
	new Promise((resolve, reject) => {
		const socket = io(baseUrl, {
			transports: ['websocket'],
			extraHeaders: { Cookie: cookie },
			forceNew: true,
			reconnection: false,
			timeout: 5000,
		})
		const timer = setTimeout(() => {
			socket.close()
			reject(new Error('Socket.IO connection timed out'))
		}, 7000)
		socket.once('connect', () => {
			clearTimeout(timer)
			resolve(socket)
		})
		socket.once('connect_error', (error) => {
			clearTimeout(timer)
			reject(error)
		})
	})

const connectWithTransportEvidence = (cookie, transports) =>
	new Promise((resolve, reject) => {
		const socket = io(baseUrl, {
			autoConnect: false,
			transports,
			extraHeaders: { Cookie: cookie },
			forceNew: true,
			reconnection: false,
			timeout: 5000,
		})
		let initialTransport = ''
		const timer = setTimeout(() => {
			socket.close()
			reject(new Error(`Socket.IO ${transports.join(' -> ')} connection timed out`))
		}, 7000)
		socket.io.once('open', () => {
			initialTransport = socket.io.engine.transport.name
		})
		socket.once('connect', () => {
			clearTimeout(timer)
			resolve({ socket, initialTransport })
		})
		socket.once('connect_error', (error) => {
			clearTimeout(timer)
			reject(error)
		})
		socket.connect()
	})

const waitForWebSocketUpgrade = (socket) =>
	new Promise((resolve, reject) => {
		const engine = socket.io.engine
		if (engine.transport.name === 'websocket') return resolve('websocket')
		const timer = setTimeout(() => {
			engine.off('upgrade', upgraded)
			engine.off('upgradeError', failed)
			reject(new Error(`Socket.IO stayed on ${engine.transport.name}; WebSocket upgrade did not complete`))
		}, 7000)
		const upgraded = (transport) => {
			clearTimeout(timer)
			engine.off('upgradeError', failed)
			resolve(transport.name)
		}
		const failed = (error) => {
			clearTimeout(timer)
			engine.off('upgrade', upgraded)
			reject(error)
		}
		engine.once('upgrade', upgraded)
		engine.once('upgradeError', failed)
	})

const verifyTransportPolicy = async (cookie) => {
	const fallback = await connectWithTransportEvidence(cookie, ['polling', 'websocket'])
	try {
		assert.equal(fallback.initialTransport, 'polling')
		assert.equal(await waitForWebSocketUpgrade(fallback.socket), 'websocket')
	} finally {
		fallback.socket.close()
	}

	const pollingOnly = await connectWithTransportEvidence(cookie, ['polling'])
	try {
		assert.equal(pollingOnly.initialTransport, 'polling')
		assert.equal(pollingOnly.socket.io.engine.transport.name, 'polling')
	} finally {
		pollingOnly.socket.close()
	}
}

const waitFor = (socket, event, predicate = () => true) =>
	new Promise((resolve, reject) => {
		const timer = setTimeout(() => {
			socket.off(event, listener)
			reject(new Error(`Timed out waiting for Socket.IO event ${event}`))
		}, 7000)
		const listener = (payload) => {
			if (!predicate(payload)) return
			clearTimeout(timer)
			socket.off(event, listener)
			resolve(payload)
		}
		socket.on(event, listener)
	})

const healthAndLegal = async () => {
	const health = JSON.parse((await request('/healthz')).text)
	assert.deepEqual(health, { status: 'ok', redis: 'ready' })
	assert.deepEqual(JSON.parse((await request('/api/vortex/config')).text), { enabled: false })
	const home = await request('/')
	const contentSecurityPolicy = home.response.headers.get('content-security-policy') || ''
	assert.match(contentSecurityPolicy, /script-src[^;]*https:\/\/static\.cloudflareinsights\.com/)
	assert.match(contentSecurityPolicy, /connect-src[^;]*https:\/\/cloudflareinsights\.com/)
	assert.match((await request('/legal/source')).text, /Hannibal420King\/digibuzzer\/tree\/vortex-v2/)
	assert.match((await request('/legal/license')).text, /GNU AFFERO GENERAL PUBLIC LICENSE/)
}

const seed = async ({ printState = true } = {}) => {
	await healthAndLegal()
	const created = await request('/api/creer-salle', { json: { titre: 'Vortex persistence smoke' } })
	const room = JSON.parse(created.text).salle
	const hostCookie = created.cookie
	assert.match(room, /^[a-f0-9]{16}$/)
	assert.ok(hostCookie.startsWith('digibuzzer='))

	const hostPage = await request(`/c/${room}`, { cookie: hostCookie })
	const host = pageContext(hostPage.text)
	assert.equal(host.erreur, undefined)
	assert.equal(host.salle, room)

	const participantPage = await request(`/p/${room}`)
	const participantCookie = participantPage.cookie
	const participant = pageContext(participantPage.text)
	assert.equal(participant.erreur, undefined)
	assert.equal(participant.salle, room)
	await verifyTransportPolicy(hostCookie)

	const avatarSource = await readFile(new URL('../avatars/avatar1.png', import.meta.url))
	const form = new FormData()
	form.append('fichier', new Blob([avatarSource], { type: 'image/png' }), 'vortex-smoke-avatar.png')
	const avatarUpload = await request('/api/televerser-avatar', {
		method: 'POST',
		cookie: participantCookie,
		body: form,
	})
	const avatar = avatarUpload.text
	assert.match(avatar, /^avatar_[a-z0-9]+\.png$/)
	await request('/api/modifier-informations', {
		cookie: participantCookie,
		json: { nom: 'Vortex Smoke Player', avatar },
	})
	const persistedAvatar = await request(`/avatars/${avatar}`)
	const avatarSha256 = createHash('sha256').update(persistedAvatar.bytes).digest('hex')

	const hostSocket = await connect(hostCookie)
	const participantSocket = await connect(participantCookie)
	try {
		hostSocket.emit('connexion', { salle: room, identifiant: host.identifiant, nom: 'Host', avatar: 'avatar1.png' })
		participantSocket.emit('connexion', { salle: room, identifiant: participant.identifiant, nom: 'Vortex Smoke Player', avatar })

		const opened = waitFor(participantSocket, 'salleouverte', (payload) => payload.titre === 'Vortex persistence smoke')
		hostSocket.emit('salleouverte', {
			salle: room,
			titre: 'Vortex persistence smoke',
			options: { reponses: 'orales', buzzer: 'immediate', points: 1000, pointsRetranchesActives: false, pointsRetranches: 500, scoreNegatif: false },
		})
		await opened

		const question = waitFor(participantSocket, 'question', (index) => index === 0)
		hostSocket.emit('question', { salle: room, indexQuestion: 0 })
		await question

		const answers = waitFor(participantSocket, 'reponses')
		hostSocket.emit('reponses', room)
		await answers

		const buzz = waitFor(hostSocket, 'reponse', (payload) => payload.identifiant === participant.identifiant)
		participantSocket.emit('reponse', { salle: room, identifiant: participant.identifiant, date: Date.now() })
		await buzz

		const first = waitFor(participantSocket, 'premierereponse', (id) => id === participant.identifiant)
		hostSocket.emit('premierereponse', { salle: room, identifiant: participant.identifiant, indexQuestion: 0 })
		await first

		const judged = waitFor(participantSocket, 'reponsecomptabilisee', (payload) => payload.identifiant === participant.identifiant && payload.points === 1000)
		hostSocket.emit('reponsecomptabilisee', { salle: room, identifiant: participant.identifiant, type: 'bonne-reponse', points: 1000, indexQuestion: 0 })
		await judged
	} finally {
		hostSocket.close()
		participantSocket.close()
	}

	const state = { room, hostCookie, participantCookie, hostId: host.identifiant, participantId: participant.identifiant, avatar, avatarSha256 }
	if (printState) console.log(`SMOKE_STATE=${Buffer.from(JSON.stringify(state)).toString('base64url')}`)
	return state
}

const verifyState = async (state) => {
	await healthAndLegal()
	const host = pageContext((await request(`/c/${state.room}`, { cookie: state.hostCookie })).text)
	const participant = pageContext((await request(`/p/${state.room}`, { cookie: state.participantCookie })).text)
	assert.equal(host.identifiant, state.hostId)
	assert.equal(participant.identifiant, state.participantId)
	assert.equal(participant.nom, 'Vortex Smoke Player')
	assert.equal(participant.avatar, state.avatar)

	const roomData = JSON.parse((await request('/api/recuperer-donnees-salle', { json: { salle: state.room } })).text)
	assert.equal(roomData.donnees.resultats[0][0].identifiant, state.participantId)
	assert.equal(roomData.donnees.resultats[0][0].points, 1000)
	const persistedAvatar = await request(`/avatars/${state.avatar}`)
	assert.equal(createHash('sha256').update(persistedAvatar.bytes).digest('hex'), state.avatarSha256)

	const participantSocket = await connect(state.participantCookie)
	participantSocket.emit('connexion', { salle: state.room, identifiant: state.participantId, nom: participant.nom, avatar: participant.avatar })
	participantSocket.close()
	console.log(JSON.stringify({ verified: true, room: state.room, redisScore: 1000, avatar: state.avatar, socketReconnect: true }))
}

const verify = async (encodedState) => verifyState(JSON.parse(Buffer.from(encodedState, 'base64url').toString('utf8')))

const waitUntilHealthy = async () => {
	for (let attempt = 0; attempt < 30; attempt++) {
		try {
			const health = JSON.parse((await request('/healthz')).text)
			if (health.status === 'ok' && health.redis === 'ready') return
		} catch {}
		await new Promise((resolve) => setTimeout(resolve, 1000))
	}
	throw new Error('Digibuzzer did not become healthy after container restart')
}

const docker = (...args) => execFileSync(process.platform === 'win32' ? 'docker.exe' : 'docker', args, { encoding: 'utf8' }).trim()

const fullPersistenceSmoke = async () => {
	const webContainer = process.env.SMOKE_WEB_CONTAINER || 'digibuzzer-vortex-smoke-web'
	const redisContainer = process.env.SMOKE_REDIS_CONTAINER || 'digibuzzer-vortex-smoke-redis'
	await waitUntilHealthy()
	const state = await seed({ printState: false })

	console.log(`Restarted APP container: ${docker('restart', webContainer)}`)
	await waitUntilHealthy()
	await verifyState(state)

	console.log(`Stopped APP container: ${docker('stop', webContainer)}`)
	console.log(`Restarted Redis container: ${docker('restart', redisContainer)}`)
	console.log(`Started APP container: ${docker('start', webContainer)}`)
	await waitUntilHealthy()
	await verifyState(state)

	const persistence = docker('exec', redisContainer, 'redis-cli', 'INFO', 'persistence')
	assert.match(persistence, /aof_enabled:1/)
	assert.match(persistence, /aof_last_write_status:ok/)
	console.log(JSON.stringify({ fullPersistenceSmoke: true, appRestart: true, redisRestart: true, aof: true }))
}

if (mode === 'seed') {
	await seed()
} else if (mode === 'verify' && process.argv[4]) {
	await verify(process.argv[4])
} else if (mode === 'full') {
	await fullPersistenceSmoke()
} else {
	throw new Error('Usage: node test/runtime-smoke.mjs seed <base-url> | verify <base-url> <state> | full <base-url>')
}
