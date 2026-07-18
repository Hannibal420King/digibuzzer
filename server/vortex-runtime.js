const LOCAL_HOSTS = new Set(['localhost', '127.0.0.1', '[::1]'])
const SDK_PATH = /^\/sdk\/v1\/vortex-game-sdk\.js$/

const isLocalHost = (hostname) => LOCAL_HOSTS.has(hostname) || hostname.endsWith('.localhost')

const parseSafeUrl = (value) => {
	if (typeof value !== 'string' || value.trim() === '') return null
	try {
		return new URL(value)
	} catch {
		return null
	}
}

export const vortexPublicConfig = (environment = process.env) => {
	const vortexOrigin = parseSafeUrl(environment.VORTEX_PUBLIC_URL)
	const sdkUrl = parseSafeUrl(environment.VORTEX_SDK_URL)

	if (!vortexOrigin || !sdkUrl) return { enabled: false }

	const secureOrigin = vortexOrigin.protocol === 'https:' ||
		(vortexOrigin.protocol === 'http:' && isLocalHost(vortexOrigin.hostname))
	const validOrigin = secureOrigin &&
		!vortexOrigin.username &&
		!vortexOrigin.password &&
		vortexOrigin.pathname === '/' &&
		!vortexOrigin.search &&
		!vortexOrigin.hash
	const validSdk = vortexOrigin.origin === sdkUrl.origin &&
		!sdkUrl.username &&
		!sdkUrl.password &&
		SDK_PATH.test(sdkUrl.pathname) &&
		!sdkUrl.search &&
		!sdkUrl.hash

	if (!validOrigin || !validSdk) return { enabled: false }

	return {
		enabled: true,
		vortexOrigin: vortexOrigin.origin,
		sdkUrl: sdkUrl.href
	}
}
