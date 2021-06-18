export default function (context) {
	const userAgent = context.userAgent = process.server ? context.req.headers['user-agent'] : navigator.userAgent
	context.store.dispatch('modifierUserAgent', userAgent)
}
