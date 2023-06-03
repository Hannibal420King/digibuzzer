import axios from 'axios'

export { onBeforeRender }

async function onBeforeRender (pageContext) {
	let pageProps, erreur
	const salle = pageContext.routeParams.salle
	const reponse = await axios.post(pageContext.hote + '/api/recuperer-donnees-salle', {
		salle: salle
	}, {
		headers: { 'Content-Type': 'application/json' }
	}).catch(function () {
		erreur = true
		pageProps = { erreur }
	})
	if (!reponse || !reponse.hasOwnProperty('data') || (reponse.data && reponse.data === 'erreur')) {
		erreur = true
		pageProps = { erreur }
	} else {
		const params = pageContext.params
		const hote = pageContext.hote
		const langues = pageContext.langues
		const identifiant = pageContext.identifiant
		const nom = pageContext.nom
		const avatar = pageContext.avatar
		const langue = pageContext.langue
		const titre = reponse.data.titre
		const statut = reponse.data.statut
		const donnees = reponse.data.donnees
		pageProps = { params, hote, langues, identifiant, nom, avatar, langue, salle, titre, statut, donnees }
	}
	return {
		pageContext: {
			pageProps
		}
	}
}
