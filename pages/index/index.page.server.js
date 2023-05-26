export { onBeforeRender }

async function onBeforeRender (pageContext) {
	const hote = pageContext.hote
	const langues = pageContext.langues
	const langue = pageContext.langue
	const pageProps = { hote, langues, langue }
	return {
		pageContext: {
			pageProps
		}
	}
}
