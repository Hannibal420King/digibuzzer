export const CLOUDFLARE_ANALYTICS_SCRIPT_ORIGIN = 'https://static.cloudflareinsights.com'
export const CLOUDFLARE_ANALYTICS_CONNECT_ORIGIN = 'https://cloudflareinsights.com'

export const SOCKET_TRANSPORTS = Object.freeze(['polling', 'websocket'])
export const SOCKET_PING_INTERVAL_MS = 25_000
export const SOCKET_PING_TIMEOUT_MS = 20_000

export const createSocketServerOptions = (corsOrigin) => ({
	cors: {
		origin: corsOrigin,
	},
	transports: [...SOCKET_TRANSPORTS],
	allowUpgrades: true,
	upgradeTimeout: 10_000,
	pingInterval: SOCKET_PING_INTERVAL_MS,
	pingTimeout: SOCKET_PING_TIMEOUT_MS,
	maxHttpBufferSize: 1e7,
	cookie: false,
	perMessageDeflate: false,
})
