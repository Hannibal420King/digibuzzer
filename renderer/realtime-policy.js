export const SOCKET_TRANSPORTS = Object.freeze(['polling', 'websocket'])

export const createSocketClientOptions = () => ({
	autoConnect: true,
	closeOnBeforeunload: false,
	transports: [...SOCKET_TRANSPORTS],
	upgrade: true,
	rememberUpgrade: false,
})
