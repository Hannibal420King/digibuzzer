let hote = 'http://localhost:3000'
if (process.env.NODE_ENV === 'production') {
	hote = 'https://digibuzzer.app'
}

export const state = () => ({
	hote: hote,
	userAgent: '',
	message: '',
	notification: '',
	identifiant: '',
	nom: '',
	avatar: '',
	langue: 'fr',
	statut: '',
	salles: []
})

export const mutations = {
	modifierUserAgent (state, donnees) {
		state.userAgent = donnees
	},
	modifierMessage (state, message) {
		state.message = message
	},
	modifierNotification (state, notification) {
		state.notification = notification
	},
	modifierIdentifiant (state, identifiant) {
		state.identifiant = identifiant
	},
	modifierNom (state, nom) {
		state.nom = nom
	},
	modifierAvatar (state, avatar) {
		state.avatar = avatar
	},
	modifierLangue (state, langue) {
		state.langue = langue
	},
	modifierStatut (state, statut) {
		state.statut = statut
	},
	modifierSalles (state, salles) {
		state.salles = salles
	}
}

export const actions = {
	nuxtServerInit ({ commit }, { req }) {
		if (req.session && req.session.identifiant && req.session.identifiant !== '' && req.session.identifiant !== undefined) {
			commit('modifierIdentifiant', req.session.identifiant)
		}
		if (req.session && req.session.nom && req.session.nom !== '') {
			commit('modifierNom', req.session.nom)
		}
		if (req.session && req.session.avatar && req.session.avatar !== '') {
			commit('modifierAvatar', req.session.avatar)
		}
		if (req.session && req.session.langue && req.session.langue !== '') {
			commit('modifierLangue', req.session.langue)
		}
		if (req.session && req.session.statut && req.session.statut !== '') {
			commit('modifierStatut', req.session.statut)
		}
		if (req.session && req.session.salles && req.session.salles.length > 0) {
			commit('modifierSalles', req.session.salles)
		}
	},
	modifierUserAgent ({ commit }, userAgent) {
		commit('modifierUserAgent', userAgent)
	},
	modifierMessage ({ commit }, message) {
		commit('modifierMessage', message)
	},
	modifierNotification ({ commit }, notification) {
		commit('modifierNotification', notification)
	},
	modifierIdentifiant ({ commit }, identifiant) {
		commit('modifierIdentifiant', identifiant)
	},
	modifierInformations ({ commit }, donnees) {
		commit('modifierNom', donnees.nom)
		commit('modifierAvatar', donnees.avatar)
	},
	modifierLangue ({ commit }, langue) {
		commit('modifierLangue', langue)
	}
}
