export { render }
export const passToClient = ['pageProps', 'urlPathname']

import { renderToString as renderToString_ } from '@vue/server-renderer'
import { escapeInject, dangerouslySkipEscape } from 'vite-plugin-ssr/server'
import { createApp } from './app'

async function render (pageContext) {
	const { Page, pageProps } = pageContext
	if (!Page) throw new Error('My render() hook expects pageContext.Page to be defined')
	const app = createApp(Page, pageProps, pageContext)
	const appHtml = await renderToString(app)
	let titre = 'Digibuzzer by La Digitale'
	if (pageProps.hasOwnProperty('titre')) {
		titre = pageProps.titre + ' - Digibuzzer by La Digitale'
	}
	const documentHtml = escapeInject`<!DOCTYPE html>
		<html lang="fr">
			<head>
				<meta charset="UTF-8" />
				<meta name="viewport" content="width=device-width, height=device-height, viewport-fit=cover, initial-scale=1.0, minimum-scale=1.0, maximum-scale=1.0, user-scalable=no, shrink-to-fit=no">
				<meta name="apple-mobile-web-app-capable" content="yes">
				<meta name="mobile-web-app-capable" content="yes">
				<meta name="HandheldFriendly" content="true">
				<meta name="keywords" content="ladigitale, quiz, buzzer, education, openedtech, free software">
				<meta name="description" content="Une application en ligne pour créer des salles de jeu virtuelles proposée par La Digitale">
				<meta name="robots" content="index, no-follow" />
				<meta name="theme-color" content="#00ced1">
				<meta property="og:title" content="${titre}">
				<meta property="og:description" content="Une application en ligne pour créer des salles de jeu virtuelles proposée par La Digitale">
				<meta property="og:type" content="website" />
				<meta property="og:url" content="https://digibuzzer.app" />
				<meta property="og:image" content="https://digibuzzer.app/img/digibuzzer.png" />
				<meta property="og:locale" content="fr_FR" />
				<title>${titre}</title>
				<link rel="icon" type="image/png" href="/img/favicon.png">
			</head>
			<body>
				<noscript>
      				<strong>Veuillez activer Javascript dans votre navigateur pour utiliser <i>Digibuzzer</i>.</strong>
    			</noscript>
				<div id="app">${dangerouslySkipEscape(appHtml)}</div>
				<script src="/js/qrcode.js"></script>
			</body>
		</html>`

  	return {
    	documentHtml
  	}
}

async function renderToString (app) {
  	let err
  	app.config.errorHandler = (err_) => {
    	err = err_
  	}
  	const appHtml = await renderToString_(app)
  	if (err) throw err
  	return appHtml
}
