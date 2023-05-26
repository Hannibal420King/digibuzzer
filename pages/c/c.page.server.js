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
		const hote = pageContext.hote
		const langues = pageContext.langues
		const identifiant = pageContext.identifiant
		const nom = pageContext.nom
		const langue = pageContext.langue
		const role = pageContext.role
		const salles = pageContext.salles
		const titre = reponse.data.titre
		const statut = reponse.data.statut
		const donnees = reponse.data.donnees
		pageProps = { hote, langues, identifiant, nom, langue, role, salles, salle, titre, statut, donnees }
	}
	return {
		pageContext: {
			pageProps
		}
	}
}
