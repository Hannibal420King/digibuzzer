<template>
	<div id="page">
		<div id="salle">
			<header>
				<div id="conteneur-header">
					<a id="logo" :href="hote" />

					<div id="titre">
						<span>{{ titre }}</span>
					</div>

					<div id="parametres" v-if="avatar === ''">
						<span role="button" :tabindex="modale === '' && message === '' ? 0 : -1" :title="$t('rechargerDonnees')" @click="rechargerDonnees('notification')" @keydown.enter="rechargerDonnees('notification')"><i class="material-icons">sync</i></span>
						<span role="button" :tabindex="modale === '' && message === '' ? 0 : -1" :title="$t('afficherParametres')" @click="afficherModaleParametres" @keydown.enter="afficherModaleParametres"><i class="material-icons">settings</i></span>
					</div>
					<div id="parametres" v-else>
						<span role="button" :tabindex="modale === '' && message === '' ? 0 : -1" :title="$t('rechargerDonnees')" @click="rechargerDonnees('notification')" @keydown.enter="rechargerDonnees('notification')"><i class="material-icons">sync</i></span>
						<span role="button" :tabindex="modale === '' && message === '' ? 0 : -1" :title="$t('afficherParametres')" @click="afficherModaleParametres" @keydown.enter="afficherModaleParametres"><img :src="'/avatars/' + avatar"></span>
					</div>
				</div>
			</header>

			<Transition name="fondu">
				<div id="conteneur" class="ascenseur avec-footer" v-if="statut === 'ouvert'">
					<div id="conteneur-buzzer">
						<div id="base">
							<div id="buzzer" :class="{'desactive': reponse === false || premiereReponse !== '' || reponses[indexQuestion].includes(identifiant)}" role="button" :tabindex="modale === '' && message === '' ? 0 : -1" @click="envoyerReponse" @keydown.enter="envoyerReponse" />
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

		<div class="conteneur-modale" v-if="modale === 'parametres' || modale === 'informations'">
			<div id="modale-parametres" class="modale" role="dialog">
				<header v-if="modale === 'parametres'">
					<span class="titre">{{ $t('parametres') }}</span>
					<span class="fermer" role="button" :tabindex="message === '' ? 0 : -1" @click="fermerModale" @keydown.enter="fermerModale"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu">
						<label v-if="modale === 'parametres'">{{ $t('langue') }}</label>
						<div class="langue" v-if="modale === 'parametres'">
							<span role="button" :tabindex="message === '' ? 0 : -1" :class="{'selectionne': langue === 'fr'}" @click="modifierLangue('fr')" @keydown.enter="modifierLangue('fr')">FR</span>
							<span role="button" :tabindex="message === '' ? 0 : -1" :class="{'selectionne': langue === 'it'}" @click="modifierLangue('it')" @keydown.enter="modifierLangue('it')">IT</span>
							<span role="button" :tabindex="message === '' ? 0 : -1" :class="{'selectionne': langue === 'en'}" @click="modifierLangue('en')" @keydown.enter="modifierLangue('en')">EN</span>
						</div>
						<label for="nom">{{ $t('nomOuPseudo') }}</label>
						<input id="nom" type="text" v-model="nomProvisoire" :disabled="nom !== '' && statut !== ''">
						<label>{{ $t('avatar') }}</label>
						<div class="avatars" v-if="progression === 0">
							<span class="avatar" role="button" :tabindex="message === '' ? 0 : -1" v-for="(item, index) in avatars" :class="{'actif': item === avatarProvisoire, 'inactif': avatar !== '' && statut !== '' }" @click="modifierAvatar(item)" @keydown.enter="modifierAvatar(item)" :key="'avatar_' + index"><img :src="'/avatars/' + item" :alt="'avatar' + index"></span>
							<label for="televerser" class="avatar ajouter" role="button" :tabindex="message === '' ? 0 : -1" @keydown.enter="afficherSelectionAvatar" :title="$t('televerserFichier')" v-if="avatar === '' || nom === '' || statut === ''"><i class="material-icons">add_photo_alternate</i></label>
							<input id="televerser" type="file" style="display: none" accept=".jpg, .jpeg, .png, .gif" @change="televerserAvatar">
							<span class="avatar fichier" :class="{'actif': avatarProvisoire !== '' && !avatars.includes(avatarProvisoire), 'inactif': avatar !== '' && statut !== ''}"><img :src="'/avatars/' + avatarProvisoire" v-if="avatarProvisoire !== '' && !avatars.includes(avatarProvisoire)"></span>
							<span class="avatar fichier" v-if="avatar !== '' && statut !== ''" />
						</div>
						<div class="televerser" v-else>
							<div class="conteneur-chargement" v-if="progression > 0">
								<progress class="barre-progression" max="100" :value="progression" />
								<div class="chargement" />
							</div>
						</div>
						<div class="actions" :class="{'inactif': progression !== 0}" v-if="avatar === '' || nom === '' || statut === ''">
							<span class="bouton" role="button" :tabindex="message === '' ? 0 : -1" @click="modifierInformations" @keydown.enter="modifierInformations">{{ $t('valider') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modale === 'question'">
			<div id="modale-question" class="modale" role="dialog">
				<div class="conteneur">
					<div class="contenu">
						<span class="question">{{ $t('question') }} {{ indexQuestion + 1 }}</span>
						<span class="icone"><i class="material-icons">hearing</i></span>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modale === 'reponse'">
			<div id="modale-reponse" class="modale" role="dialog">
				<div class="conteneur">
					<div class="contenu">
						<span class="icone"><i class="material-icons">{{ icone }}</i></span>
						<textarea v-if="options.reponses === 'ecrites' && icone === 'pending'" v-model="texte" :placeholder="$t('votreReponse')" :disabled="texteEnvoye" />
						<div class="actions" v-if="options.reponses === 'ecrites' && icone === 'pending' && !texteEnvoye">
							<span class="bouton" role="button" :tabindex="message === '' ? 0 : -1" @click="envoyerTexte" @keydown.enter="envoyerTexte">{{ $t('envoyer') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<Notification :notification="notification" @fermer="notification = ''" v-if="notification !== ''" />

		<Message :message="message" @elementPrecedent="definirElementPrecedent" @fermer="fermerMessage" v-if="message !== ''" />

		<Chargement v-if="chargement" />

		<ChargementPage v-if="chargementPage" />
	</div>
</template>

<script>
import axios from 'axios'
import ChargementPage from '#root/components/chargement-page.vue'
import Chargement from '#root/components/chargement.vue'
import Message from '#root/components/message.vue'
import Notification from '#root/components/notification.vue'

export default {
	name: 'Participer',
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
			nomProvisoire: '',
			avatarProvisoire: '',
			avatars: ['avatar1.png', 'avatar2.png', 'avatar3.png', 'avatar4.png', 'avatar5.png', 'avatar6.png', 'avatar7.png', 'avatar8.png'],
			options: {
				reponses: 'orales',
				buzzer: 'immediate'
			},
			progression: 0,
			score: 0,
			reponse: false,
			premiereReponse: '',
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
	created () {
		const params = this.$pageContext.pageProps.params
		const langue = params.lang
		if (langue && this.langues.includes(langue) === true) {
			this.$i18n.locale = langue
			this.langue = langue
			this.$socket.emit('modifierlangue', langue)
		} else {
			this.$i18n.locale = this.langue
		}

		this.ecouterSocket()

		this.$socket.emit('connexion', { salle: this.salle, identifiant: this.identifiant, nom: this.nom, avatar: this.avatar })
		if (this.nom === '' || this.avatar === '') {
			this.modale = 'informations'
			this.$nextTick(function () {
				document.querySelector('#nom').focus()
			})
		}

		this.indexQuestion = parseInt(this.donnees.indexQuestion)
		if (this.donnees.statutQuestion === 'question') {
			this.modale = 'question'
		} else if (this.donnees.statutQuestion === 'reponses') {
			this.reponse = true
			this.$nextTick(function () {
				document.querySelector('#buzzer').focus()
			})
		}
		this.premiereReponse = this.donnees.premiereReponse
		if (this.donnees.hasOwnProperty('options') === true) {
			this.options = this.donnees.options
		}
		if (this.donnees.hasOwnProperty('textes') === true) {
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
				this.$nextTick(function () {
					document.querySelector('#modale-reponse textarea').focus()
				})
			}
		}
		this.reponses = this.donnees.reponses
		this.resultats = this.donnees.resultats
		this.definirScore()
	},
	async mounted () {
		document.getElementsByTagName('html')[0].setAttribute('lang', this.langue)

		if (this.statut === '' && this.modale === '') {
			this.afficherModaleInformations()
		}

		this.audio = new Audio()
		this.audio.autoplay = true
		this.audio.src = 'data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV'

		if ('wakeLock' in navigator) {
			this.verrouVeilleAPI = true
		}

		setTimeout(function () {
			this.chargementPage = false
		}.bind(this), 300)

		document.body.addEventListener('touchstart', async function () {
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
		}.bind(this))

		document.body.addEventListener('click', async function () {
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
		}.bind(this))

		document.addEventListener('keydown', this.gererClavier, false)

		window.addEventListener('beforeunload', this.quitterPage, false)

		this.mobile = (window.navigator.maxTouchPoints || 'ontouchstart' in document)
		document.addEventListener('visibilitychange', async function () {
			if (this.mobile && !this.chargement && document.visibilityState === 'visible' && this.identifiant !== '' && this.nom !== '' && this.avatar !== '') {
				setTimeout(function () {
					this.rechargerDonnees('')
				}.bind(this), 200)
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
		}.bind(this))
	},
	beforeUnmount () {
		document.removeEventListener('keydown', this.gererClavier, false)
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
				this.$nextTick(function () {
					if (this.statut === '') {
						document.querySelector('#nom').focus()
					} else {
						document.querySelector('.modale .fermer').focus()
					}
				}.bind(this))
			}
		},
		afficherModaleInformations () {
			if (this.modale !== 'question' && this.modale !== 'reponse') {
				this.nomProvisoire = this.nom
				this.avatarProvisoire = this.avatar
				this.modale = 'informations'
				this.$nextTick(function () {
					document.querySelector('#nom').focus()
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
					identifiant: this.identifiant,
					langue: langue
				}).then(function () {
					this.$i18n.locale = langue
					document.getElementsByTagName('html')[0].setAttribute('lang', langue)
					this.langue = langue
					this.notification = this.$t('langueModifiee')
					this.chargement = false
				}.bind(this)).catch(function () {
					this.chargement = false
					this.message = this.$t('erreurCommunicationServeur')
				}.bind(this))
			}
		},
		modifierInformations () {
			if (this.progression === 0 && this.nomProvisoire !== '' && this.avatarProvisoire !== '' && (this.nomProvisoire !== this.nom || this.avatarProvisoire !== this.avatar)) {
				const modale = this.modale
				this.modale = ''
				this.chargement = true
				axios.post(this.hote + '/api/modifier-informations', {
					identifiant: this.identifiant,
					nom: this.nomProvisoire,
					avatar: this.avatarProvisoire
				}).then(function () {
					this.chargement = false
					this.$socket.emit('informations', { salle: this.salle, identifiant: this.identifiant, nom: this.nomProvisoire, avatar: this.avatarProvisoire })
					this.nom = this.nomProvisoire
					this.avatar = this.avatarProvisoire
					this.notification = this.$t('informationsModifiees')
					this.gererFocus()
				}.bind(this)).catch(function () {
					this.chargement = false
					this.message = this.$t('erreurCommunicationServeur')
				}.bind(this))
			} else if (this.progression === 0 && this.nomProvisoire !== '' && this.nomProvisoire === this.nom && this.avatarProvisoire !== '' && this.avatarProvisoire === this.avatar) {
				this.modale = ''
			}
		},
		modifierAvatar (avatar) {
			if (this.statut === '' || this.avatar === '') {
				this.avatarProvisoire = avatar
			}
		},
		afficherSelectionAvatar () {
			document.querySelector('#televerser').click()
		},
		televerserAvatar (event) {
			const champ = event.target
			const formats = ['jpg', 'jpeg', 'png', 'gif']
			const extension = champ.files[0].name.substr(champ.files[0].name.lastIndexOf('.') + 1).toLowerCase()
			if (champ.files && champ.files[0] && formats.includes(extension) && champ.files[0].size < 1048576) {
				const fichier = champ.files[0]
				const formulaire = new FormData()
				formulaire.append('fichier', fichier)
				axios.post(this.hote + '/api/televerser-avatar', formulaire, {
					headers: {
						'Content-Type': 'multipart/form-data'
					},
					onUploadProgress: function (progression) {
						const pourcentage = parseInt(Math.round((progression.loaded * 100) / progression.total))
						this.progression = pourcentage
					}.bind(this)
				}).then(function (reponse) {
					const donnees = reponse.data
					if (donnees === 'erreur') {
						this.message = this.$t('erreurCommunicationServeur')
					} else {
						this.avatarProvisoire = donnees
					}
					champ.value = ''
					this.progression = 0
				}.bind(this)).catch(function () {
					champ.value = ''
					this.progression = 0
					this.message = this.$t('erreurCommunicationServeur')
				}.bind(this))
			} else {
				champ.value = ''
				if (!formats.includes(extension)) {
					this.message = this.$t('formatImageNonAccepte')
				} else if (champ.files[0].size >= 1048576) {
					this.message = this.$t('tailleMaximaleImage')
				}
			}
		},
		envoyerReponse () {
			if (this.reponse === true && this.premiereReponse === '' && this.reponses[this.indexQuestion].includes(this.identifiant) === false) {
				this.chargement = true
				const date = new Date().getTime()
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
			this.resultats.forEach(function (question) {
				question.forEach(function (resultat) {
					if (resultat.identifiant === this.identifiant) {
						score = score + resultat.points
					}
				}.bind(this))
			}.bind(this))
			if (this.donnees.bonus.map(function (e) { return e.identifiant }).includes(this.identifiant) === true) {
				this.donnees.bonus.forEach(function (bonus) {
					if (bonus.identifiant === this.identifiant) {
						score = score + bonus.points
					}
				}.bind(this))
			}
			this.score = score
		},
		rechargerDonnees (notification) {
			this.chargement = true
			axios.post(this.hote + '/api/recuperer-donnees-salle', {
				salle: this.salle
			}).then(function (reponse) {
				this.chargement = false
				if (reponse.hasOwnProperty('data') && reponse.data !== 'erreur' && reponse.data !== 'salle_inexistante') {
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
					if (this.donnees.hasOwnProperty('options') === true) {
						this.options = this.donnees.options
					}
					if (this.donnees.hasOwnProperty('textes') === true) {
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
							this.$nextTick(function () {
								document.querySelector('#modale-reponse textarea').focus()
							})
						}
					}
					this.reponses = this.donnees.reponses
					this.resultats = this.donnees.resultats
					this.definirScore()
					if (notification !== '') {
						this.notification = this.$t('donneesRechargees')
					}
					this.$socket.emit('connexion', { salle: this.salle, identifiant: this.identifiant, nom: this.nom, avatar: this.avatar })
				} else if (reponse.data === 'salle_inexistante') {
					window.location.href = '/'
				} else {
					this.message = this.$t('erreurCommunicationServeur')
				}
			}.bind(this)).catch(function () {
				this.chargement = false
				this.message = this.$t('erreurCommunicationServeur')
			}.bind(this))
		},
		gererClavier (event) {
			if (event.key === 'Escape' && this.message !== '') {
				this.message = ''
			} else if (event.key === 'Escape' && (this.modale === 'parametres' || this.modale === 'informations')) {
				this.fermerModale()
			}
		},
		gererFocus () {
			if (this.elementPrecedent) {
				this.elementPrecedent.focus()
				this.elementPrecedent = null
			}
		},
		quitterPage () {
			this.$socket.emit('deconnexion', this.salle)
		},
		ecouterSocket () {
			this.$socket.on('salleouverte', function (salle) {
				this.statut = 'ouvert'
				this.titre = salle.titre
				this.options = salle.options
				if (this.nom !== '' && this.avatar !== '' && this.modale === 'informations') {
					this.modale = ''
				}
			}.bind(this))

			this.$socket.on('sallefermee', function () {
				this.statut = 'ferme'
			}.bind(this))

			this.$socket.on('question', function (indexQuestion) {
				this.indexQuestion = indexQuestion
				this.reponse = false
				this.premiereReponse = ''
				this.texte = ''
				this.texteEnvoye = false
				this.reponses.push([])
				this.resultats.push([])
				this.textes.push([])
				this.modale = 'question'
			}.bind(this))

			this.$socket.on('reponses', function () {
				this.modale = ''
				this.reponse = true
				this.$nextTick(function () {
					document.querySelector('#buzzer').focus()
				})
			}.bind(this))

			this.$socket.on('reponse', function () {
				this.chargement = false
			}.bind(this))

			this.$socket.on('texte', function (donnees) {
				this.chargement = false
				if (donnees.identifiant === this.identifiant) {
					this.texteEnvoye = true
				}
			}.bind(this))

			this.$socket.on('premierereponse', function (identifiant) {
				this.premiereReponse = identifiant
				this.reponses[this.indexQuestion].push(identifiant)
				if (identifiant === this.identifiant) {
					this.modale = 'reponse'
					this.icone = 'pending'
					this.audio.src = '/fx/reponse.mp3'
					this.audio.play()
					if (this.options.reponses === 'ecrites') {
						this.$nextTick(function () {
							document.querySelector('#modale-reponse textarea').focus()
						})
					}
				}
			}.bind(this))

			this.$socket.on('texteenvoye', function (texte) {
				this.textes[this.indexQuestion].push(texte)
			}.bind(this))

			this.$socket.on('reponseannulee', function (identifiant) {
				this.premiereReponse = ''
				if (identifiant === this.identifiant) {
					this.icone = 'clear'
					this.audio.src = '/fx/incorrect.mp3'
					this.audio.play()
					setTimeout(function () {
						this.modale = ''
						this.icone = 'pending'
					}.bind(this), 2000)
				}
			}.bind(this))

			this.$socket.on('reponsevalidee', function (donnees) {
				if (donnees.identifiant === this.identifiant) {
					this.icone = 'thumb_up_alt'
					this.audio.src = '/fx/correct.mp3'
					this.audio.play()
					setTimeout(function () {
						this.modale = ''
						this.icone = 'pending'
					}.bind(this), 2000)
				}
				if (this.resultats[donnees.indexQuestion].map(function (e) { return e.identifiant }).includes(donnees.identifiant) === true) {
					this.resultats[donnees.indexQuestion].forEach(function (resultat, indexResultat) {
						if (resultat.identifiant === donnees.identifiant) {
							this.resultats[donnees.indexQuestion][indexResultat].points = parseInt(this.resultats[donnees.indexQuestion][indexResultat].points) + parseInt(donnees.points)
						}
					}.bind(this))
				} else {
					this.resultats[donnees.indexQuestion].push({ identifiant: donnees.identifiant, points: parseInt(donnees.points) })
				}
				this.definirScore()
			}.bind(this))

			this.$socket.on('score', function (donnees) {
				if (this.donnees.bonus.map(function (e) { return e.identifiant }).includes(donnees.identifiant) === true) {
					this.donnees.bonus.forEach(function (bonus, indexBonus) {
						if (bonus.identifiant === donnees.identifiant) {
							this.donnees.bonus[indexBonus].points = parseInt(donnees.bonus)
						}
					}.bind(this))
				} else {
					this.donnees.bonus.push({ identifiant: donnees.identifiant, points: parseInt(donnees.bonus) })
				}
				this.definirScore()
			}.bind(this))

			this.$socket.on('erreur', function () {
				this.message = this.$t('erreurCommunicationServeur')
			}.bind(this))

			this.$socket.on('erreursalle', function () {
				this.message = this.$t('salleInexistante')
			}.bind(this))
		}
	}
}
</script>

<style scoped>
#titre {
	width: calc(100% - 132px)!important;
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

#parametres span {
	cursor: pointer;
}

#parametres span:first-child {
	margin-right: 20px;
}

#parametres span img {
	border-radius: 50%;
	width: 24px;
}

#conteneur.salle-fermee {
	display: flex;
	justify-content: center;
	flex-wrap: wrap;
	align-items: center;
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

#modale-parametres span.bouton {
	width: 100%;
	text-align: center;
}

#modale-parametres .langue span {
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

#modale-parametres .langue span.selectionne {
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

.modale .avatars span {
	width: 18.5%;
	cursor: pointer;
	border: 2px solid transparent;
	margin-bottom: 10px;
}

.modale .avatars span.fichier {
	cursor: default;
}

.modale .avatars span.actif {
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
	margin: 0;
}

.modale .avatars span img {
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
