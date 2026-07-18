const DECLARED_EVENT_KEYS = new Set([
	'digibuzzer.room.created',
	'digibuzzer.buzzer.pressed',
	'digibuzzer.answer.accepted',
	'digibuzzer.answer.rejected'
])

let clientPromise
let vortexOrigin
let returning = false

const panel = () => {
	let element = document.querySelector('#vortex-runtime-panel')
	if (element) return element

	element = document.createElement('aside')
	element.id = 'vortex-runtime-panel'
	element.setAttribute('aria-live', 'polite')
	element.innerHTML = `
		<span data-vortex-status>Standalone mode</span>
		<button type="button" data-vortex-return hidden>Return to Vortex</button>
		<a href="/legal/source" target="_blank" rel="noopener">Source &amp; license</a>`
	Object.assign(element.style, {
		position: 'fixed',
		right: '12px',
		bottom: '12px',
		zIndex: '2147483647',
		display: 'flex',
		alignItems: 'center',
		gap: '8px',
		maxWidth: 'calc(100vw - 24px)',
		padding: '8px 10px',
		border: '1px solid rgba(110, 231, 255, .42)',
		borderRadius: '12px',
		background: 'rgba(12, 16, 38, .94)',
		boxShadow: '0 10px 30px rgba(0, 0, 0, .36)',
		color: '#f7f8ff',
		font: '600 12px/1.3 system-ui, sans-serif',
		backdropFilter: 'blur(12px)'
	})
	for (const interactive of element.querySelectorAll('a,button')) {
		Object.assign(interactive.style, {
			border: '0',
			borderRadius: '8px',
			padding: '5px 8px',
			background: '#273055',
			color: '#bff5ff',
			font: 'inherit',
			textDecoration: 'none',
			cursor: 'pointer'
		})
	}
	document.body.appendChild(element)
	return element
}

const setStatus = (message, title = '') => {
	const status = panel().querySelector('[data-vortex-status]')
	status.textContent = message
	status.title = title
}

const isSafeLocalHost = (hostname) => ['localhost', '127.0.0.1', '[::1]'].includes(hostname) || hostname.endsWith('.localhost')

const validateConfig = (config) => {
	if (!config || config.enabled !== true || typeof config.vortexOrigin !== 'string' || typeof config.sdkUrl !== 'string') return null
	const origin = new URL(config.vortexOrigin)
	const sdk = new URL(config.sdkUrl)
	const safeProtocol = origin.protocol === 'https:' || (origin.protocol === 'http:' && isSafeLocalHost(origin.hostname))
	if (!safeProtocol || origin.username || origin.password || origin.pathname !== '/' || origin.search || origin.hash) throw new Error('Vortex supplied an unsafe public origin')
	if (sdk.origin !== origin.origin || sdk.username || sdk.password || sdk.pathname !== '/sdk/v1/vortex-game-sdk.js' || sdk.search || sdk.hash) throw new Error('Vortex supplied an unsafe SDK URL')
	return { vortexOrigin: origin.origin, sdkUrl: sdk.href }
}

const loadClient = async () => {
	panel()
	try {
		const response = await fetch('/api/vortex/config', {
			credentials: 'same-origin',
			cache: 'no-store',
			headers: { Accept: 'application/json' }
		})
		if (!response.ok) throw new Error('Vortex runtime config is unavailable')
		const validated = validateConfig(await response.json())
		if (!validated) return { enabled: false, identity: null }

		vortexOrigin = validated.vortexOrigin
		const sdk = await import(/* @vite-ignore */ validated.sdkUrl)
		if (typeof sdk.createVortexGameClient !== 'function') throw new Error('Vortex SDK module is invalid')

		const client = await sdk.createVortexGameClient({
			vortexOrigin,
			onSessionExpired: () => window.location.assign(`${vortexOrigin}/login`),
			onError: (error) => console.warn('Vortex SDK:', error)
		})
		const context = await client.auth.context()
		const identity = {
			id: context.user.id,
			handle: context.user.handle,
			displayName: context.user.displayName,
			avatarUrl: context.user.avatarUrl
		}
		const identityLabel = identity.displayName || identity.handle || 'player'
		setStatus(`Vortex · ${identityLabel}`, `Pairwise player ID: ${identity.id}`)
		const returnButton = panel().querySelector('[data-vortex-return]')
		returnButton.hidden = false
		returnButton.addEventListener('click', () => returnToVortex())
		return { enabled: true, identity, client }
	} catch (error) {
		console.warn('Vortex integration unavailable; Digibuzzer remains in standalone mode.', error)
		setStatus('Standalone mode')
		return { enabled: false, identity: null }
	}
}

export const initializeVortex = () => {
	if (!clientPromise) clientPromise = loadClient()
	const adapter = {
		ready: clientPromise.then(({ enabled, identity }) => ({ enabled, identity })),
		trackObserved,
		returnToVortex
	}
	window.digibuzzerVortex = adapter
	return adapter.ready
}

export const trackObserved = async (key, attributes = {}) => {
	if (!DECLARED_EVENT_KEYS.has(key)) throw new Error(`Undeclared Vortex event: ${key}`)
	try {
		const runtime = await (clientPromise || loadClient())
		if (!runtime.enabled) return null
		return runtime.client.events.track(key, attributes, { version: 1, value: 1 })
	} catch (error) {
		console.warn(`Unable to queue Vortex event ${key}.`, error)
		return null
	}
}

export const returnToVortex = async () => {
	if (returning) return
	returning = true
	const runtime = await (clientPromise || loadClient())
	if (!runtime.enabled) {
		returning = false
		return
	}
	try {
		await runtime.client.events.flush()
		await runtime.client.play.end('quit')
		await runtime.client.navigation.returnToVortex('/')
	} catch (error) {
		console.warn('Unable to complete the Vortex return flow.', error)
		if (vortexOrigin) window.location.assign(vortexOrigin)
	} finally {
		returning = false
	}
}
