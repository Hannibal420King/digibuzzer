import { createApp, h } from 'vue'
import PageShell from './PageShell.vue'
import { io } from 'socket.io-client'
import { createI18n } from 'vue-i18n'
import messages from './lang'

export { createPageApp }

function createPageApp (pageContext) {
	const { Page, pageProps } = pageContext
	const PageWithLayout = {
    	render () {
      		return h(
        		PageShell,
        		{},
        		{
          			default () {
            			return h(Page, pageProps || {})
          			}
        		}
      		)
    	}
  	}

	const i18n = createI18n({
		locale: 'fr',
		fallbackLocale: 'fr',
		warnHtmlInMessage: 'off',
		messages
	})

	const app = createApp(PageWithLayout)
	app.use(i18n)

	app.config.globalProperties.$socket = io(pageProps.hote, {
		// transports: ['websocket', 'polling'],
		autoConnect: true,
		closeOnBeforeunload: false
	})
	app.config.globalProperties.$pageContext = pageContext
	
	return app
}
