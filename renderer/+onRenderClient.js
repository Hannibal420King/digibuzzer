export { render as onRenderClient }

import { createPageApp } from './app'
import { initializeVortex } from './vortex'

const render = (pageContext) => {
	initializeVortex()
	if (pageContext.pageProps.hasOwnProperty('erreur')) {
		window.location.href = '/'
	} else {
		const app = createPageApp(pageContext)
		app.mount('#app')
	}
}
