<template>
	<div id="page" v-if="!utilisateurBanni">
		<div id="salle">
			<header>
				<div id="conteneur-header">
					<a id="logo" :href="hote" />

					<div id="titre">
						<span>{{ titre }}</span>
					</div>

					<div id="parametres" v-if="avatar === ''">
						<button type="button" :disabled="disabled" :title="$t('rechargerDonnees')" :aria-label="$t('rechargerDonnees')" @click="rechargerDonnees('notification')"><i class="material-icons" aria-hidden="true">sync</i></button>
						<button type="button" :disabled="disabled" :title="$t('afficherParametres')" :aria-label="$t('afficherParametres')" @click="afficherModaleParametres"><i class="material-icons" aria-hidden="true">settings</i></button>
					</div>
					<div id="parametres" v-else>
						<button type="button" :disabled="disabled" :title="$t('rechargerDonnees')" :aria-label="$t('rechargerDonnees')" @click="rechargerDonnees('notification')"><i class="material-icons" aria-hidden="true">sync</i></button>
						<button type="button" :disabled="disabled" :title="$t('afficherParametres')" :aria-label="$t('afficherParametres')" @click="afficherModaleParametres"><img :src="'/avatars/' + avatar"></button>
					</div>
				</div>
			</header>

			<Transition name="fondu">
				<div id="conteneur" class="ascenseur avec-footer" v-if="statut === 'ouvert'">
					<div id="conteneur-buzzer">
						<div id="base">
							<button type="button" id="buzzer" :class="{'desactive': reponse === false || premiereReponse !== '' || reponses[indexQuestion].includes(identifiant)}" :disabled="disabled" :title="$t('appuyerBuzzer')" :aria-label="$t('appuyerBuzzer')" @click="envoyerReponse"></button>
						</div>
					</div>
				</div>
			</Transition>

			<Transition name="fondu">
				<div id="conteneur" class="salle-fermee" v-if="statut !== 'ouvert'">
					<div class="section">
						<div class="information" v-if="statut === ''">
							{{ $t('sallePasOuverte') }}
						</div>
						<div class="information" v-else-if="statut === 'ferme'">
							{{ $t('sallePlusOuverte') }}
						</div>
						<div class="points">
							<span class="point" />
							<span class="point" />
							<span class="point" />
						</div>
					</div>
				</div>
			</Transition>

			<Transition name="fondu">
				<footer v-if="statut === 'ouvert'">
					<div class="section">
						<span class="score">{{ $t('score') }} {{ score }}</span>
					</div>
				</footer>
			</Transition>
		</div>

		<div class="conteneur-modale" v-if="modaleInformations || modale === 'parametres' || modale === 'question' || modale === 'reponse'">
			<div id="modale-parametres" class="modale" role="dialog" aria-modal="true" :aria-label="$t('parametres')" v-if="modale === 'parametres' || modaleInformations">
				<header v-if="modale === 'parametres'">
					<span class="titre">{{ $t('parametres') }}</span>
					<button type="button" class="fermer" :disabled="disabledModale" :title="$t('fermer')" :aria-label="$t('fermer')" @click="fermerModale"><i class="material-icons" aria-hidden="true">close</i></button>
				</header>
				<div class="conteneur">
					<div class="contenu">
						<label v-if="modale === 'parametres'">{{ $t('langue') }}</label>
						<div class="langue" v-if="modale === 'parametres'">
							<button type="button" :disabled="disabledModale" title="Français" aria-label="Français" :class="{'selectionne': langue === 'fr'}" @click="modifierLangue('fr')">FR</button>
							<button type="button" :disabled="disabledModale" title="Español" aria-label="Español" :class="{'selectionne': langue === 'es'}" @click="modifierLangue('es')">ES</button>
							<button type="button" :disabled="disabledModale" title="Italiano" aria-label="Italiano" :class="{'selectionne': langue === 'it'}" @click="modifierLangue('it')">IT</button>
							<button type="button" :disabled="disabledModale" title="Deutsch" aria-label="Deutsch" :class="{'selectionne': langue === 'de'}" @click="modifierLangue('de')">DE</button>
							<button type="button" :disabled="disabledModale" title="English" aria-label="English" :class="{'selectionne': langue === 'en'}" @click="modifierLangue('en')">EN</button>
						</div>
						<label for="nom">{{ $t('nomOuPseudo') }}</label>
						<input id="nom" type="text" v-model="nomProvisoire" :disabled="nom !== '' && avatar !== '' && statut !== ''">
						<label>{{ $t('avatar') }}</label>
						<div class="avatars" v-if="progression === 0">
							<span class="avatar inactif" v-for="(item, index) in avatars" :class="{'actif': item === avatarProvisoire }" :key="'avatar_' + index" v-if="nom !== '' && avatar !== '' && statut !== ''"><img :src="'/avatars/' + item" :alt="'avatar' + index"></span>
							<button type="button" class="avatar" :disabled="disabledModale" v-for="(item, index) in avatars" :class="{'actif': item === avatarProvisoire }" :title="$t('selectionnerAvatar')" :aria-label="$t('selectionnerAvatar')" @click="modifierAvatar(item)" :key="'selection_avatar_' + index" v-else><img :src="'/avatars/' + item" :alt="'avatar' + index"></button>
							<label for="televerser" class="avatar ajouter" :tabindex="tabIndexModale" :aria-disabled="disabledModale" :title="$t('televerserFichier')" :aria-label="$t('televerserFichier')" @keydown.enter.space.prevent="afficherSelectionAvatar" v-if="avatar === '' || nom === '' || statut === ''"><i class="material-icons" aria-hidden="true">add_photo_alternate</i></label>
							<input id="televerser" type="file" style="display: none" accept=".jpg, .jpeg, .png" :disabled="disabledModale" @change="televerserAvatar">
							<span class="avatar fichier" :class="{'actif': avatarProvisoire !== '' && !avatars.includes(avatarProvisoire), 'inactif': nom !== '' && avatar !== '' && statut !== ''}"><img :src="'/avatars/' + avatarProvisoire" v-if="avatarProvisoire !== '' && !avatars.includes(avatarProvisoire)"></span>
							<span class="avatar fichier" v-if="nom !== '' && avatar !== '' && statut !== ''" />
						</div>
						<div class="televerser" v-else>
							<div class="conteneur-chargement" v-if="progression > 0">
								<progress class="barre-progression" max="100" :value="progression" />
								<div class="chargement" />
							</div>
						</div>
						<div class="actions" :class="{'inactif': progression !== 0}" v-if="avatar === '' || nom === '' || statut === ''">
							<button type="button" class="bouton" :disabled="disabledModale" @click="modifierInformations">{{ $t('valider') }}</button>
						</div>
					</div>
				</div>
			</div>

			<div id="modale-question" class="modale" role="dialog" aria-modal="true" v-else-if="modale === 'question'">
				<div class="conteneur">
					<div class="contenu">
						<span class="question">{{ $t('question') }} {{ indexQuestion + 1 }}</span>
						<span class="icone" aria-hidden="true"><i class="material-icons">hearing</i></span>
					</div>
				</div>
			</div>

			<div id="modale-reponse" class="modale" role="dialog" aria-modal="true" v-else-if="modale === 'reponse'">
				<div class="conteneur">
					<div class="contenu">
						<span class="icone" aria-hidden="true"><i class="material-icons">{{ icone }}</i></span>
						<textarea v-if="options.reponses === 'ecrites' && icone === 'pending'" v-model="texte" :placeholder="$t('votreReponse')" :disabled="texteEnvoye" />
						<div class="actions" v-if="options.reponses === 'ecrites' && icone === 'pending' && !texteEnvoye">
							<button type="button" class="bouton" :disabled="disabledModale" @click="envoyerTexte">{{ $t('envoyer') }}</button>
						</div>
					</div>
				</div>
			</div>
		</div>

		<Notification :notification="notification" @fermer="notification = ''" />

		<Message :message="message" @elementPrecedent="definirElementPrecedent" @fermer="fermerMessage" v-if="message !== ''" />

		<Chargement v-if="chargement" />

		<ChargementPage v-if="chargementPage" />
	</div>
	<div id="page" v-else>
		<div id="conteneur" class="salle-fermee banni">
			<div class="section">
				<div class="information">
					{{ $t('utilisateurBanni') }}
				</div>
				<div class="points">
					<span class="point" />
					<span class="point" />
					<span class="point" />
				</div>
			</div>
		</div>
	</div>
</template>

<script>
import axios from 'axios'
import ChargementPage from '#root/components/chargement-page.vue'
import Chargement from '#root/components/chargement.vue'
import Message from '#root/components/message.vue'
import Notification from '#root/components/notification.vue'

export default {
	name: 'DigibuzzerParticiper',
	components: {
		ChargementPage,
		Chargement,
		Message,
		Notification
	},
	data () {
		return {
			chargementPage: true,
			chargement: false,
			message: '',
			notification: '',
			mobile: false,
			modale: '',
			modaleInformations: false,
			nomProvisoire: '',
			avatarProvisoire: '',
			avatars: ['avatar1.png', 'avatar2.png', 'avatar3.png', 'avatar4.png', 'avatar5.png', 'avatar6.png', 'avatar7.png', 'avatar8.png'],
			options: {
				reponses: 'orales',
				buzzer: 'immediate',
				points: 1000,
				pointsRetranchesActives: false,
				pointsRetranches: 500,
				scoreNegatif: false
			},
			progression: 0,
			score: 0,
			reponse: false,
			premiereReponse: '',
			indexQuestion: -1,
			reponses: [],
			resultats: [],
			textes: [],
			texte: '',
			texteEnvoye: false,
			icone: 'pending',
			audio: '',
			audioInitialise: false,
			verrouVeilleAPI: false,
			verrouVeille: '',
			utilisateurBanni: false,
			elementPrecedent: null,
			hote: this.$pageContext.pageProps.hote,
			identifiant: this.$pageContext.pageProps.identifiant,
			nom: this.$pageContext.pageProps.nom,
			avatar: this.$pageContext.pageProps.avatar,
			langues: this.$pageContext.pageProps.langues,
			langue: this.$pageContext.pageProps.langue,
			salle: this.$pageContext.pageProps.salle,
			titre: this.$pageContext.pageProps.titre,
			statut: this.$pageContext.pageProps.statut,
			donnees: this.$pageContext.pageProps.donnees
		}
	},
	computed : {
		tabIndexModale () {
			return this.message === '' ? 0 : -1
		},
		disabled () {
			return this.modale === '' && !this.modaleInformations && this.message === '' ? false : true
		},
		disabledModale () {
			return this.message === '' ? false : true
		}
	},
	created () {
		const params = this.$pageContext.pageProps.params
		const langueNav = navigator.language.substring(0, 2)
		const langueParam = params.lang
		if (langueParam && langueParam !== '' && this.langues.includes(langueParam) === true) {
			this.langue = langueParam
			localStorage.setItem('digibuzzer_lang', langueParam)
		} else if (!langueParam && langueNav !== '' && this.langues.includes(langueNav) === true) {
			this.langue = langueNav
		} 
		if (localStorage.getItem('digibuzzer_lang')) {
			this.langue = localStorage.getItem('digibuzzer_lang')
		}
		this.$i18n.locale = this.langue
		if (this.langue !== this.$pageContext.pageProps.langue) {
			this.$socket.emit('modifierlangue', this.langue)
		}

		this.ecouterSocket()

		this.$socket.emit('connexion', { salle: this.salle, identifiant: this.identifiant, nom: this.nom, avatar: this.avatar })

		this.indexQuestion = parseInt(this.donnees.indexQuestion)
		this.premiereReponse = this.donnees.premiereReponse
		if (this.donnees.hasOwnProperty('options')) {
			this.options = this.donnees.options
			if (!this.options.hasOwnProperty('scoreNegatif')) {
				this.options.scoreNegatif = false
			}
		}
		if (this.donnees.hasOwnProperty('textes')) {
			this.textes = this.donnees.textes
		}
		this.reponses = this.donnees.reponses
		this.resultats = this.donnees.resultats
		if (this.donnees.hasOwnProperty('utilisateursBannis') === true && this.donnees.utilisateursBannis.includes(this.identifiant)) {
			this.utilisateurBanni = true
		}
		this.definirScore()
	},
	async mounted () {
		document.getElementsByTagName('html')[0].setAttribute('lang', this.langue)
		if (this.statut === '' || this.nom === '' || this.avatar === '') {
			this.afficherModaleInformations()
			window.digibuzzerVortex?.ready.then((runtime) => {
				const identityName = runtime.identity?.displayName || runtime.identity?.handle || ''
				const safeName = identityName.replace(/[\u0000-\u001f\u007f]/g, '').trim().slice(0, 80)
				if (runtime.enabled && this.nom === '' && this.nomProvisoire === '' && safeName !== '') {
					this.nomProvisoire = safeName
				}
			})
		}

		if (this.donnees.statutQuestion === 'question') {
			this.modale = 'question'
		} else if (this.donnees.statutQuestion === 'reponses') {
			this.reponse = true
			this.$nextTick(() => {
				document.querySelector('#buzzer')?.focus()
			})
		}

		if (this.reponse && this.premiereReponse === this.identifiant) {
			this.modale = 'reponse'
			if (this.options.reponses === 'ecrites' && this.textes[this.indexQuestion] && this.textes[this.indexQuestion].length > 0) {
				for (let i = 0; i < this.textes[this.indexQuestion].length; i++) {
					if (this.textes[this.indexQuestion][i].identifiant === this.identifiant) {
						this.texte = this.textes[this.indexQuestion][i].texte
						this.texteEnvoye = true
					}
				}
			}
			if (this.options.reponses === 'ecrites' && this.texteEnvoye === false) {
				this.$nextTick(() => {
					document.querySelector('#modale-reponse textarea')?.focus()
				})
			}
		}

		this.audio = new Audio()
		this.audio.autoplay = true
		this.audio.src = 'data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV'

		if ('wakeLock' in navigator) {
			this.verrouVeilleAPI = true
		}

		this.chargementPage = false

		this.mobile = (window.navigator.maxTouchPoints || 'ontouchstart' in document)

		document.addEventListener('keydown', this.gererClavier, false)
		document.body.addEventListener('touchstart', this.initialiserVerrouVeilleAudio, false)
		document.body.addEventListener('click', this.initialiserVerrouVeilleAudio, false)
		window.addEventListener('beforeunload', this.quitterPage, false)
		document.addEventListener('visibilitychange', this.gererVisibilite, false)
	},
	beforeUnmount () {
		document.removeEventListener('keydown', this.gererClavier, false)
		document.body.removeEventListener('touchstart', this.initialiserVerrouVeilleAudio, false)
		document.body.removeEventListener('click', this.initialiserVerrouVeilleAudio, false)
		window.removeEventListener('beforeunload', this.quitterPage, false)
		document.removeEventListener('visibilitychange', this.gererVisibilite, false)
	},
	methods: {
		definirElementPrecedent (element) {
			this.elementPrecedent = element
		},
		fermerMessage () {
			this.message = ''
			this.gererFocus()
		},
		afficherModaleParametres () {
			if (this.modale !== 'question' && this.modale !== 'reponse') {
				this.elementPrecedent = (document.activeElement || document.body)
				this.nomProvisoire = this.nom
				this.avatarProvisoire = this.avatar
				this.modale = 'parametres'
				this.$nextTick(() => {
					if (this.statut === '') {
						document.querySelector('#nom')?.focus()
					} else {
						document.querySelector('.modale .fermer')?.focus()
					}
				})
			}
		},
		afficherModaleInformations () {
			if (!this.utilisateurBanni) {
				this.nomProvisoire = this.nom
				this.avatarProvisoire = this.avatar
				this.modaleInformations = true
				this.$nextTick(() => {
					document.querySelector('#nom')?.focus()
				})
			}
		},
		fermerModale () {
			this.modale = ''
			this.nomProvisoire = ''
			this.avatarProvisoire = ''
			this.gererFocus()
		},
		modifierLangue (langue) {
			if (this.langue !== langue) {
				this.chargement = true
				axios.post(this.hote + '/api/modifier-langue', {
					langue: langue
				}).then(() => {
					this.chargement = false
					this.$i18n.locale = langue
					document.getElementsByTagName('html')[0].setAttribute('lang', langue)
					this.langue = langue
					this.notification = this.$t('langueModifiee')
					localStorage.setItem('digibuzzer_lang', langue)
				}).catch((err) => {
					this.chargement = false
					if (err.response?.data === 'non_autorise') {
						this.message = this.$t('actionNonAutorisee')
					} else {
						this.message = this.$t('erreurCommunicationServeur')
					}
				})
			}
		},
		modifierInformations () {
			if (this.progression === 0 && this.nomProvisoire !== '' && this.avatarProvisoire !== '' && (this.nomProvisoire !== this.nom || this.avatarProvisoire !== this.avatar)) {
				if (this.modale === 'parametres') {
					this.modale = ''
				} else {
					this.modaleInformations = false
				}
				this.chargement = true
				axios.post(this.hote + '/api/modifier-informations', {
					identifiant: this.identifiant,
					nom: this.nomProvisoire,
					avatar: this.avatarProvisoire
				}).then(() => {
					this.chargement = false
					this.$socket.emit('informations', { salle: this.salle, identifiant: this.identifiant, nom: this.nomProvisoire, avatar: this.avatarProvisoire })
					this.nom = this.nomProvisoire
					this.avatar = this.avatarProvisoire
					this.notification = this.$t('informationsModifiees')
					this.gererFocus()
				}).catch(() => {
					this.chargement = false
					this.message = this.$t('erreurCommunicationServeur')
				})
			} else if (this.progression === 0 && this.nomProvisoire !== '' && this.nomProvisoire === this.nom && this.avatarProvisoire !== '' && this.avatarProvisoire === this.avatar && this.modale === 'parametres') {
				this.modale = ''
			} else if (this.progression === 0 && this.nomProvisoire !== '' && this.nomProvisoire === this.nom && this.avatarProvisoire !== '' && this.avatarProvisoire === this.avatar && this.modaleInformations) {
				this.modaleInformations = false
			}
		},
		modifierAvatar (avatar) {
			if (this.statut === '' || this.nom === '' || this.avatar === '') {
				this.avatarProvisoire = avatar
			}
		},
		afficherSelectionAvatar () {
			document.querySelector('#televerser').click()
		},
		televerserAvatar (event) {
			const champ = event.target
			const formats = ['jpg', 'jpeg', 'png']
			const extension = champ.files[0].name.substring(champ.files[0].name.lastIndexOf('.') + 1).toLowerCase()
			if (champ.files && champ.files[0] && formats.includes(extension) && champ.files[0].size <= 1 * 1024 * 1024) {
				const fichier = champ.files[0]
				const formulaire = new FormData()
				formulaire.append('fichier', fichier)
				axios.post(this.hote + '/api/televerser-avatar', formulaire, {
					onUploadProgress: (progression) => {
						const pourcentage = parseInt(Math.round((progression.loaded * 100) / progression.total))
						this.progression = pourcentage
					}
				}).then((reponse) => {
					this.avatarProvisoire = reponse.data
					champ.value = ''
					this.progression = 0
				}).catch(() => {
					champ.value = ''
					this.progression = 0
					this.message = this.$t('erreurCommunicationServeur')
				})
			} else {
				champ.value = ''
				if (!formats.includes(extension)) {
					this.message = this.$t('formatImageNonAccepte')
				} else if (champ.files[0].size > 1 * 1024 * 1024) {
					this.message = this.$t('tailleMaximaleImage')
				}
			}
		},
		envoyerReponse () {
			if (this.reponse === true && this.premiereReponse === '' && this.reponses[this.indexQuestion].includes(this.identifiant) === false) {
				this.chargement = true
				const date = new Date().getTime()
				void window.digibuzzerVortex?.trackObserved('digibuzzer.buzzer.pressed')
				this.$socket.emit('reponse', { salle: this.salle, identifiant: this.identifiant, date: date })
			}
		},
		envoyerTexte () {
			if (this.reponse === true && this.premiereReponse === this.identifiant && this.reponses[this.indexQuestion].includes(this.identifiant) === true) {
				this.chargement = true
				this.$socket.emit('texte', { salle: this.salle, identifiant: this.identifiant, texte: this.texte })
			}
		},
		definirScore () {
			let score = 0
			this.resultats.forEach((question) => {
				question.forEach((resultat) => {
					if (resultat.identifiant === this.identifiant) {
						score = score + resultat.points
					}
				})
			})
			if (this.donnees.bonus.map((e) => e.identifiant).includes(this.identifiant) === true) {
				this.donnees.bonus.forEach((bonus) => {
					if (bonus.identifiant === this.identifiant) {
						score = score + bonus.points
					}
				})
			}
			if (this.options.scoreNegatif === false && score < 0) {
				score = 0
			}
			this.score = score
		},
		rechargerDonnees (notification) {
			this.chargement = true
			axios.post(this.hote + '/api/recuperer-donnees-salle', {
				salle: this.salle
			}).then((reponse) => {
				this.chargement = false
				this.modale = ''
				this.reponse = false
				this.titre = reponse.data.titre
				this.statut = reponse.data.statut
				this.donnees = reponse.data.donnees
				this.indexQuestion = parseInt(this.donnees.indexQuestion)
				if (this.donnees.statutQuestion === 'question') {
					this.modale = 'question'
				} else if (this.donnees.statutQuestion === 'reponses') {
					this.reponse = true
				}
				this.premiereReponse = this.donnees.premiereReponse
				if (this.donnees.hasOwnProperty('options')) {
					this.options = this.donnees.options
					if (!this.options.hasOwnProperty('scoreNegatif')) {
						this.options.scoreNegatif = false
					}
				}
				if (this.donnees.hasOwnProperty('textes')) {
					this.textes = this.donnees.textes
				}
				if (this.reponse && this.premiereReponse === this.identifiant) {
					this.modale = 'reponse'
					if (this.options.reponses === 'ecrites' && this.textes[this.indexQuestion] && this.textes[this.indexQuestion].length > 0) {
						for (let i = 0; i < this.textes[this.indexQuestion].length; i++) {
							if (this.textes[this.indexQuestion][i].identifiant === this.identifiant) {
								this.texte = this.textes[this.indexQuestion][i].texte
								this.texteEnvoye = true
							}
						}
					}
					if (this.options.reponses === 'ecrites' && this.texteEnvoye === false) {
						this.$nextTick(() => {
							document.querySelector('#modale-reponse textarea')?.focus()
						})
					}
				}
				this.reponses = this.donnees.reponses
				this.resultats = this.donnees.resultats
				if (this.donnees.hasOwnProperty('utilisateursBannis') === true && this.donnees.utilisateursBannis.includes(this.identifiant)) {
					this.utilisateurBanni = true
				}
				this.definirScore()
				if (notification !== '') {
					this.notification = this.$t('donneesRechargees')
				}
				this.$socket.emit('connexion', { salle: this.salle, identifiant: this.identifiant, nom: this.nom, avatar: this.avatar })
			}).catch((err) => {
				this.chargement = false
				if (err.response?.data === 'salle_inexistante') {
					window.location.replace('/')
				} else {
					this.message = this.$t('erreurCommunicationServeur')
				}
			})
		},
		gererClavier (event) {
			if (event.key === 'Escape' && this.message !== '') {
				this.message = ''
			} else if (event.key === 'Escape' && (this.modale === 'parametres' || this.modaleInformations)) {
				this.fermerModale()
			} else if (event.key === ' ' && this.modale === '' && this.statut === 'ouvert') {
				this.envoyerReponse()
			} else if (event.key === 'Tab') {
				if (this.message !== '') {
					const modale = document.querySelector('#message')
					this.piegerFocus(event, modale)
				} else if (this.modale !== '' || this.modaleInformations) {
					const modale = document.querySelector('.modale')
					this.piegerFocus(event, modale)
				}
			}
		},
		gererFocus () {
			this.$nextTick(() => {
				if (this.elementPrecedent) {
					this.elementPrecedent.focus()
					this.elementPrecedent = null
				}
			})
		},
		piegerFocus (event, conteneur) {
			if (!conteneur) return
			const isVisible = el => el.offsetWidth || el.offsetHeight || el.getClientRects().length
			const focusables = Array.from(conteneur.querySelectorAll('a[href], button, textarea, input:not([type="file"]), select'))
			.filter(el => !el.disabled && el.tabIndex >= 0 && isVisible(el))
			if (focusables.length === 0) return
			const premier = focusables[0]
			const dernier = focusables[focusables.length - 1]
			if (event.shiftKey) {
				if (document.activeElement === premier) {
					event.preventDefault()
					dernier.focus()
				}
			} else {
				if (document.activeElement === dernier) {
					event.preventDefault()
					premier.focus()
				}
			}
		},
		async initialiserVerrouVeilleAudio () {
			if (this.audioInitialise === false) {
				this.audio.play()
				this.audioInitialise = true
			}
			if (this.verrouVeilleAPI && this.verrouVeille === '') {
				try {
					this.verrouVeille = await navigator.wakeLock.request('screen')
				} catch (err) {
					this.verrouVeille = ''
				}
			}
		},
		async gererVisibilite () {
			if (this.mobile && !this.chargement && document.visibilityState === 'visible' && this.identifiant !== '' && this.nom !== '' && this.avatar !== '') {
				setTimeout(() => {
					this.rechargerDonnees('')
				}, 200)
			} else if (!this.mobile && !this.chargement && document.visibilityState === 'visible' && this.identifiant !== '' && this.nom !== '' && this.avatar !== '') {
				this.rechargerDonnees('')
			}
			if (this.verrouVeilleAPI && this.verrouVeille !== '' && document.visibilityState === 'visible') {
				try {
					this.verrouVeille = await navigator.wakeLock.request('screen')
				} catch (err) {
					this.verrouVeille = ''
				}
			}
		},
		quitterPage () {
			this.$socket.emit('deconnexion', this.salle)
		},
		ecouterSocket () {
			this.$socket.on('salleouverte', (salle) => {
				this.statut = 'ouvert'
				this.titre = salle.titre
				this.options = salle.options
				if (this.nom !== '' && this.avatar !== '' && this.modaleInformations) {
					this.modaleInformations = false
				}
			})

			this.$socket.on('sallefermee', () => {
				this.statut = 'ferme'
			})

			this.$socket.on('question', (indexQuestion) => {
				this.indexQuestion = indexQuestion
				this.reponse = false
				this.premiereReponse = ''
				this.texte = ''
				this.texteEnvoye = false
				this.reponses.push([])
				this.resultats.push([])
				this.textes.push([])
				this.modale = 'question'
			})

			this.$socket.on('reponses', () => {
				this.modale = ''
				this.reponse = true
				this.$nextTick(() => {
					document.querySelector('#buzzer')?.focus()
				})
			})

			this.$socket.on('reponse', () => {
				this.chargement = false
			})

			this.$socket.on('texte', (donnees) => {
				this.chargement = false
				if (donnees.identifiant === this.identifiant) {
					this.texteEnvoye = true
				}
			})

			this.$socket.on('premierereponse', (identifiant) => {
				this.premiereReponse = identifiant
				this.reponses[this.indexQuestion].push(identifiant)
				if (identifiant === this.identifiant) {
					this.modale = 'reponse'
					this.icone = 'pending'
					this.audio.src = '/fx/reponse.mp3'
					this.audio.play()
					if (this.options.reponses === 'ecrites') {
						this.$nextTick(() => {
							document.querySelector('#modale-reponse textarea')?.focus()
						})
					}
				}
			})

			this.$socket.on('texteenvoye', (texte) => {
				this.textes[this.indexQuestion].push(texte)
			})

			this.$socket.on('reponseannulee', (identifiant) => {
				this.premiereReponse = ''
				if (identifiant === this.identifiant) {
					this.icone = 'clear'
					this.audio.src = '/fx/incorrect.mp3'
					this.audio.play()
					setTimeout(() => {
						this.modale = ''
						this.icone = 'pending'
					}, 2000)
				}
			})

			this.$socket.on('reponsecomptabilisee', (donnees) => {
				if (donnees.type === 'mauvaise-reponse') {
					this.premiereReponse = ''
				}
				if (donnees.identifiant === this.identifiant) {
					if (donnees.type === 'bonne-reponse') {
						void window.digibuzzerVortex?.trackObserved('digibuzzer.answer.accepted')
					} else if (donnees.type === 'mauvaise-reponse') {
						void window.digibuzzerVortex?.trackObserved('digibuzzer.answer.rejected')
					}
					this.icone = 'thumb_up_alt'
					this.audio.src = '/fx/correct.mp3'
					if (donnees.type === 'mauvaise-reponse') {
						this.icone = 'clear'
						this.audio.src = '/fx/incorrect.mp3'
					}
					this.audio.play()
					setTimeout(() => {
						this.modale = ''
						this.icone = 'pending'
					}, 2000)
				}
				if (this.resultats[donnees.indexQuestion].map((e) => e.identifiant).includes(donnees.identifiant) === true) {
					this.resultats[donnees.indexQuestion].forEach((resultat, indexResultat) => {
						if (resultat.identifiant === donnees.identifiant) {
							this.resultats[donnees.indexQuestion][indexResultat].points = parseInt(this.resultats[donnees.indexQuestion][indexResultat].points) + parseInt(donnees.points)
						}
					})
				} else {
					this.resultats[donnees.indexQuestion].push({ identifiant: donnees.identifiant, points: parseInt(donnees.points) })
				}
				this.definirScore()
			})

			this.$socket.on('score', (donnees) => {
				if (this.donnees.bonus.map((e) => e.identifiant).includes(donnees.identifiant) === true) {
					this.donnees.bonus.forEach((bonus, indexBonus) => {
						if (bonus.identifiant === donnees.identifiant) {
							this.donnees.bonus[indexBonus].points = parseInt(donnees.bonus)
						}
					})
				} else {
					this.donnees.bonus.push({ identifiant: donnees.identifiant, points: parseInt(donnees.bonus) })
				}
				this.definirScore()
			})

			this.$socket.on('utilisateurbanni', (identifiant) => {
				if (this.identifiant === identifiant) {
					this.utilisateurBanni = true
				}
			})

			this.$socket.on('utilisateurautorise', (identifiant) => {
				if (this.identifiant === identifiant) {
					this.utilisateurBanni = false
				}
			})

			this.$socket.on('erreur', () => {
				this.message = this.$t('erreurCommunicationServeur')
			})

			this.$socket.on('erreursalle', () => {
				this.message = this.$t('salleInexistante')
			})
		}
	}
}
</script>

<style scoped>
#titre {
	flex-grow: 1;
}

#titre span {
	overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

#parametres {
	display: flex;
	justify-content: center;
	align-items: center;
	font-size: 24px;
	line-height: 40px;
	margin-left: 20px;
	line-height: 1;
}

#parametres button {
	cursor: pointer;
}

#parametres button:first-child {
	margin-right: 20px;
}

#parametres button img {
	border-radius: 50%;
	width: 24px;
}

#conteneur.salle-fermee {
	display: flex;
	justify-content: center;
	flex-wrap: wrap;
	align-items: center;
}

#conteneur.salle-fermee.banni {
	width: 100%;
	height: 100%;
}

#conteneur.salle-fermee .information {
	display: block;
	width: 100%;
	font-size: 25px;
	font-weight: 700;
	line-height: 1.4;
	margin-bottom: 40px;
	text-align: center;
}

#conteneur.salle-fermee .points {
	display: flex;
	justify-content: center;
	width: 100%;
}

#conteneur.salle-fermee .point {
	display: inline-block;
	width: 50px;
	height: 50px;
	border-radius: 50%;
	margin-right: 15px;
	background: #00ced1;
	animation: vague 1.5s linear infinite;
}

#conteneur.salle-fermee .point:nth-child(2) {
	animation-delay: -1.1s;
}

#conteneur.salle-fermee .point:nth-child(3) {
	animation-delay: -0.7s;
}

#conteneur-buzzer {
    background-color: #252525;
    width: 30rem;
    height: 30rem;
    margin-left: auto;
    margin-right: auto;
    margin-top: 40px;
    border-radius: 15rem;
    box-shadow: inset 0px 2px 0px #585858, 1px 1px 0px #000, 2px 2px 5px #000;
}

#base {
    background-color: #151515;
    width: 26rem;
    height: 26rem;
    margin-left: auto;
    margin-right: auto;
    top: 2rem;
    position: relative;
    border-radius: 13rem;
    box-shadow: 1px 1px 0px #5d5d5d;
}

#buzzer {
	display: block;
    width: 25rem;
    height: 25rem;
    margin-left: auto;
    margin-right: auto;
    overflow: auto;
    cursor: pointer;
    top: -0.5rem;
    position: relative;
    background-image: linear-gradient(to top, #ff2d55 0%, red 57%);
    border-radius: 15rem;
    box-shadow: inset 0px 2px 0px #a8a8a8, 0px 2px 0px #2a2a2a, 0px 3px 0px #2a2a2a, 0px 4px 0px #2a2a2a, 0px 5px 0px #2a2a2a, 0px 6px 0px #2a2a2a, 0px 7px 0px #2a2a2a, 0px 8px 0px #2a2a2a, 0px 9px 0px #2a2a2a, 0px 10px 0px #2a2a2a, 10px 20px 10px #000;
    transition: all 0.2s;
    border: none;
    padding: 0;
    appearance: none;
}

#buzzer:active {
    top: 0.5rem;
    box-shadow: inset 0px 2px 0px #a8a8a8;
}

#buzzer.desactive {
	background-image: linear-gradient(to top, #aaa 0%, #777 57%);
}

#salle footer .section {
	display: flex;
	justify-content: center;
	align-items: center;
	height: 100%;
	margin: 0 auto;
}

#salle footer .score {
    font-size: 3rem;
    font-weight: 700;
    color: #009688;
	line-height: 1;
}

#modale-parametres {
	max-width: 500px;
}

#modale-parametres button.bouton {
	width: 100%;
	text-align: center;
}

#modale-parametres .langue button {
    display: flex;
    justify-content: center;
	align-items: center;
	font-size: 16px;
    width: 40px;
    height: 40px;
    border-radius: 50%;
    border: 1px solid #ddd;
    margin-right: 10px;
	cursor: pointer;
}

#modale-parametres .langue button.selectionne {
    background: #242f3d;
    color: #fff;
    border: 1px solid #222;
    cursor: default;
}

.modale .avatars {
	display: flex;
	justify-content: space-between;
	flex-wrap: wrap;
	margin-bottom: 10px;
}

.modale .avatars span,
.modale .avatars button {
	width: 18.5%;
	cursor: pointer;
	border: 2px solid transparent;
	margin-bottom: 10px;
}

.modale .avatars span.fichier {
	cursor: default;
}

.modale .avatars .actif {
	border: 2px solid #001d1d;
	cursor: pointer;
}

.modale .avatars span.inactif {
	cursor: default;
}

.modale .avatars .ajouter {
    display: flex;
	width: 18.5%;
	cursor: pointer;
    justify-content: center;
    align-items: center;
	font-size: 48px;
	font-weight: 400;
	line-height: 1;
	margin: 0 0 10px 0;
}

.modale .avatars span img,
.modale .avatars button img {
	border-radius: 50%;
}

.modale .actions.inactif .bouton:hover,
.modale .actions.inactif .bouton {
	background: #aaa;
	cursor: default;
}

#modale-question,
#modale-reponse {
	width: auto;
	max-width: 90%;
}

#modale-question .conteneur,
#modale-reponse .conteneur {
	height: 100%;
}

#modale-question .question {
	display: block;
	font-size: 20px;
	font-weight: 700;
	margin-bottom: 10px;
	text-align: center;
}

#modale-question .icone,
#modale-question,
#modale-reponse .icone,
#modale-reponse {
	font-size: 0;
	line-height: 1;
}

#modale-reponse .icone {
	display: block;
}

#modale-reponse textarea {
	margin-bottom: 0;
}

#modale-reponse textarea + .actions {
	margin-top: 20px;
}

#modale-question .icone i,
#modale-reponse .icone i {
	font-size: 40vh;
}

@keyframes vague {
	0%, 60%, 100% {
		transform: initial;
	}
	30% {
		transform: translateY(-30px);
	}
}

@media screen and (orientation: landscape) and (max-height: 479px) {
	#modale-parametres {
		height: 90%;
	}
}
</style>
