export { render }

import { createApp } from './app'

async function render (pageContext) {
	const { Page, pageProps } = pageContext
	const app = createApp(Page, pageProps, pageContext)
	app.mount('#app')
}
