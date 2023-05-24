export { render }

import { createApp } from './app'

async function render (pageContext) {
	const { Page, pageProps } = pageContext
	if (!Page) throw new Error('Client-side render() hook expects pageContext.Page to be defined')
	const app = createApp(Page, pageProps, pageContext)
	app.mount('#app')
}
