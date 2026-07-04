export { render as onRenderClient }

import { createPageApp } from './app'

const render = (pageContext) => {
	if (pageContext.pageProps.hasOwnProperty('erreur')) {
		window.location.href = '/'
	} else {
		const app = createPageApp(pageContext)
		app.mount('#app')
	}
}
