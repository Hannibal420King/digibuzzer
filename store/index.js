let hote = 'http://localhost:3000'
if (process.env.NODE_ENV === 'production') {
	hote = process.env.DOMAIN
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
	langues: ['fr', 'en'],
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
	modifierUserAgent ({ commit }, userAgent) {
		commit('modifierUserAgent', userAgent)
	},
	modifierUtilisateur ({ commit }, donnees) {
		commit('modifierIdentifiant', donnees.identifiant)
		commit('modifierNom', donnees.nom)
		commit('modifierAvatar', donnees.avatar)
		commit('modifierLangue', donnees.langue)
		commit('modifierStatut', donnees.statut)
		commit('modifierSalles', donnees.salles)
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
