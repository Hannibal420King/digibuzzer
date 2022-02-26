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
						<span role="button" tabindex="0" :title="$t('afficherParametres')" @click="afficherModaleParametres"><i class="material-icons">settings</i></span>
					</div>
					<div id="parametres" class="avatar" v-else>
						<span role="button" tabindex="0" :title="$t('afficherParametres')" @click="afficherModaleParametres"><img :src="'/avatars/' + avatar"></span>
					</div>
				</div>
			</header>

			<transition-group name="fondu">
				<div id="conteneur" class="ascenseur avec-footer" v-if="statut === 'ouvert'" key="conteneur-ouvert">
					<div id="conteneur-buzzer">
						<div id="base">
							<div id="buzzer" :class="{'desactive': reponse === false || premiereReponse !== '' || reponses[indexQuestion].includes(identifiant)}" @click="envoyerReponse" />
						</div>
					</div>
				</div>

				<div id="conteneur" class="salle-fermee" v-else key="conteneur-ferme">
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

				<footer v-if="statut === 'ouvert'" key="footer">
					<div class="section">
						<span class="score">{{ $t('score') }} {{ score }}</span>
					</div>
				</footer>
			</transition-group>
		</div>

		<div class="conteneur-modale" v-if="modale === 'parametres'">
			<div id="modale-parametres" class="modale">
				<header>
					<span class="titre">{{ $t('parametres') }}</span>
					<span class="fermer" role="button" tabindex="0" @click="fermerModale"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu">
						<label>{{ $t('langue') }}</label>
						<div class="langue">
							<span role="button" tabindex="0" :class="{'selectionne': langue === 'fr'}" @click="modifierLangue('fr')">FR</span>
							<span role="button" tabindex="0" :class="{'selectionne': langue === 'en'}" @click="modifierLangue('en')">EN</span>
						</div>
						<label>{{ $t('nomOuPseudo') }}</label>
						<input type="text" id="nom" :value="nomProvisoire" @input="nomProvisoire = $event.target.value">
						<label>{{ $t('avatar') }}</label>
						<div class="avatars" v-if="progression === 0">
							<span class="avatar" v-for="(item, index) in avatars" :class="{'actif': item === avatarProvisoire}" @click="modifierAvatar(item)" :key="'avatar_' + index"><img :src="'/avatars/' + item" :alt="'avatar' + index"></span>
							<label for="televerser" class="avatar ajouter" role="button" tabindex="0" :title="$t('televerserFichier')"><i class="material-icons">add_photo_alternate</i></label>
							<input id="televerser" type="file" style="display: none" accept=".jpg, .jpeg, .png, .gif" @change="televerserAvatar">
							<span class="avatar fichier" :class="{'actif': avatarProvisoire !== '' && !avatars.includes(avatarProvisoire)}"><img :src="'/avatars/' + avatarProvisoire" v-if="avatarProvisoire !== '' && !avatars.includes(avatarProvisoire)"></span>
						</div>
						<div class="televerser" v-else>
							<div class="conteneur-chargement" v-if="progression > 0">
								<progress class="barre-progression" max="100" :value="progression" />
								<div class="chargement" />
							</div>
						</div>
						<div class="actions" :class="{'inactif': progression !== 0}">
							<span class="bouton" role="button" tabindex="0" @click="modifierInformations">{{ $t('valider') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modale === 'informations'">
			<div id="modale-informations" class="modale">
				<div class="conteneur">
					<div class="contenu">
						<label>{{ $t('nomOuPseudo') }}</label>
						<input type="text" id="nom" :value="nomProvisoire" @input="nomProvisoire = $event.target.value">
						<label>{{ $t('avatar') }}</label>
						<div class="avatars" v-if="progression === 0">
							<span class="avatar" v-for="(item, index) in avatars" :class="{'actif': item === avatarProvisoire}" @click="modifierAvatar(item)" :key="'avatar_' + index"><img :src="'/avatars/' + item" :alt="'avatar' + index"></span>
							<label for="televerser" class="avatar ajouter" role="button" tabindex="0" :title="$t('televerserFichier')"><i class="material-icons">add_photo_alternate</i></label>
							<input id="televerser" type="file" style="display: none" accept=".jpg, .jpeg, .png, .gif" @change="televerserAvatar">
							<span class="avatar fichier" :class="{'actif': avatarProvisoire !== '' && !avatars.includes(avatarProvisoire)}"><img :src="'/avatars/' + avatarProvisoire" v-if="avatarProvisoire !== '' && !avatars.includes(avatarProvisoire)"></span>
						</div>
						<div class="televerser" v-else>
							<div class="conteneur-chargement" v-if="progression > 0">
								<progress class="barre-progression" max="100" :value="progression" />
								<div class="chargement" />
							</div>
						</div>
						<div class="actions" :class="{'inactif': progression !== 0}">
							<span class="bouton" role="button" tabindex="0" @click="modifierInformations">{{ $t('valider') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modale === 'question'">
			<div id="modale-question" class="modale">
				<div class="conteneur">
					<div class="contenu">
						<span class="question">{{ $t('question') }} {{ indexQuestion + 1 }}</span>
						<span class="icone"><i class="material-icons">hearing</i></span>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modale === 'reponse'">
			<div id="modale-reponse" class="modale">
				<div class="conteneur">
					<div class="contenu">
						<span class="icone"><i class="material-icons">{{ icone }}</i></span>
					</div>
				</div>
			</div>
		</div>

		<chargement :chargement="chargement" v-if="chargement" />
	</div>
</template>

<script>
import axios from 'axios'
import chargement from '@/components/chargement.vue'

export default {
	name: 'Participer',
	components: {
		chargement
	},
	sockets: {
		salleouverte: function (salle) {
			this.statut = 'ouvert'
			this.titre = salle.titre
		},
		sallefermee: function () {
			this.statut = 'ferme'
		},
		question: function (indexQuestion) {
			this.indexQuestion = indexQuestion
			this.reponse = false
			this.premiereReponse = ''
			this.reponses.push([])
			this.resultats.push([])
			this.modale = 'question'
		},
		reponses: function () {
			this.modale = ''
			this.reponse = true
		},
		reponse: function () {
			this.chargement = false
		},
		premierereponse: function (identifiant) {
			this.premiereReponse = identifiant
			this.reponses[this.indexQuestion].push(identifiant)
			if (identifiant === this.identifiant) {
				this.modale = 'reponse'
				this.icone = 'pending'
				this.audio.src = '/fx/reponse.mp3'
				audio.play()
			}
		},
		reponseannulee: function (identifiant) {
			this.premiereReponse = ''
			if (identifiant === this.identifiant) {
				this.icone = 'clear'
				this.audio.src = '/fx/incorrect.mp3'
				audio.play()
				setTimeout(function () {
					this.modale = ''
					this.icone = 'pending'
				}.bind(this), 2000)
			}
		},
		reponsevalidee: function (donnees) {
			if (donnees.identifiant === this.identifiant) {
				this.icone = 'thumb_up_alt'
				this.audio.src = '/fx/correct.mp3'
				audio.play()
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
		},
		score: function (donnees) {
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
		},
		erreur: function () {
			this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
		},
		erreursalle: function () {
			this.$store.dispatch('modifierMessage', this.$t('salleInexistante'))
		}
	},
	async asyncData (context) {
		const salle = context.route.params.salle
		const { data } = await axios.post(context.store.state.hote + '/api/recuperer-donnees-salle', {
			salle: salle
		}, {
			headers: { 'Content-Type': 'application/json' }
		})
		if (data === 'erreur') {
			context.redirect('/')
		} else {
			return {
				salle: salle,
				titre: data.titre,
				statut: data.statut,
				donnees: data.donnees
			}
		}
	},
	data () {
		return {
			chargement: false,
			modale: '',
			nomProvisoire: '',
			avatarProvisoire: '',
			avatars: ['avatar1.png', 'avatar2.png', 'avatar3.png', 'avatar4.png', 'avatar5.png', 'avatar6.png', 'avatar7.png', 'avatar8.png'],
			progression: 0,
			score: 0,
			reponse: false,
			premiereReponse: '',
			reponses: [],
			resultats: [],
			icone: 'pending',
			audio: '',
			audioInitialise: false
		}
	},
	head () {
		return {
			title: this.titre + ' - Digibuzzer by La Digitale'
		}
	},
	computed: {
		hote () {
			return this.$store.state.hote
		},
		identifiant () {
			return this.$store.state.identifiant
		},
		nom () {
			return this.$store.state.nom
		},
		avatar () {
			return this.$store.state.avatar
		},
		langue () {
			return this.$store.state.langue
		},
		langues () {
			return this.$store.state.langues
		}
	},
	watchQuery: ['page'],
	created () {
		this.$nuxt.$loading.start()
		if (this.nom !== '' && this.avatar !== '') {
			this.$socket.emit('connexion', { salle: this.salle, identifiant: this.identifiant, nom: this.nom, avatar: this.avatar })
		} else {
			this.modale = 'informations'
		}
		const langue = this.$route.query.lang
		if (this.langues.includes(langue) === true) {
			this.$i18n.setLocale(langue)
			this.$store.dispatch('modifierLangue', langue)
			this.$socket.emit('modifierlangue', langue)
		} else {
			this.$i18n.setLocale(this.langue)
		}
		this.indexQuestion = parseInt(this.donnees.indexQuestion)
		if (this.donnees.statutQuestion === 'question') {
			this.modale = 'question'
		} else if (this.donnees.statutQuestion === 'reponses') {
			this.reponse = true
		}
		this.premiereReponse = this.donnees.premiereReponse
		if (this.reponse && this.premiereReponse === this.identifiant) {
			this.modale = 'reponse'
		}
		this.reponses = this.donnees.reponses
		this.resultats = this.donnees.resultats
		this.definirScore()
	},
	mounted () {
		setTimeout(function () {
			this.$nuxt.$loading.finish()
			document.getElementsByTagName('html')[0].setAttribute('lang', this.langue)
		}.bind(this), 100)
		this.audio = new Audio()
		this.audio.autoplay = true
		this.audio.src = 'data:audio/mpeg;base64,SUQzBAAAAAABEVRYWFgAAAAtAAADY29tbWVudABCaWdTb3VuZEJhbmsuY29tIC8gTGFTb25vdGhlcXVlLm9yZwBURU5DAAAAHQAAA1N3aXRjaCBQbHVzIMKpIE5DSCBTb2Z0d2FyZQBUSVQyAAAABgAAAzIyMzUAVFNTRQAAAA8AAANMYXZmNTcuODMuMTAwAAAAAAAAAAAAAAD/80DEAAAAA0gAAAAATEFNRTMuMTAwVVVVVVVVVVVVVUxBTUUzLjEwMFVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQsRbAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVf/zQMSkAAADSAAAAABVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVVV'
		document.body.addEventListener('touchstart', function () {
			if (this.audioInitialise === false) {
				this.audio.play()
				this.audioInitialise = true
			}
		}.bind(this))
		window.addEventListener('beforeunload', this.quitterPage, false)
	},
	beforeDestroy () {
		window.removeEventListener('beforeunload', this.quitterPage, false)
	},
	methods: {
		afficherModaleParametres () {
			this.nomProvisoire = this.nom
			this.avatarProvisoire = this.avatar
			this.modale = 'parametres'
			this.$nextTick(function () {
				document.querySelector('#nom').focus()
			})
		},
		fermerModale () {
			this.modale = ''
			this.nomProvisoire = ''
			this.avatarProvisoire = ''
		},
		afficherModaleInformations () {
			this.nomProvisoire = this.nom
			this.avatarProvisoire = this.avatar
			this.modale = 'informations'
			this.$nextTick(function () {
				document.querySelector('#nom').focus()
			})
		},
		modifierLangue (langue) {
			if (this.langue !== langue) {
				this.chargement = true
				axios.post(this.hote + '/api/modifier-langue', {
					identifiant: this.identifiant,
					langue: langue
				}).then(function () {
					this.$i18n.setLocale(langue)
					document.getElementsByTagName('html')[0].setAttribute('lang', langue)
					this.$store.dispatch('modifierLangue', langue)
					this.$store.dispatch('modifierNotification', this.$t('langueModifiee'))
					this.chargement = false
				}.bind(this)).catch(function () {
					this.chargement = false
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			}
		},
		modifierInformations () {
			if (this.progression === 0 && this.nomProvisoire !== '' && this.avatarProvisoire !== '') {
				const modale = this.modale
				if (modale === 'informations') {
					this.modale = ''
				}
				this.chargement = true
				axios.post(this.hote + '/api/modifier-informations', {
					identifiant: this.identifiant,
					nom: this.nomProvisoire,
					avatar: this.avatarProvisoire
				}).then(function () {
					this.chargement = false
					if (modale === 'informations') {
						this.$socket.emit('connexion', { salle: this.salle, identifiant: this.identifiant, nom: this.nomProvisoire, avatar: this.avatarProvisoire })
					} else {
						this.$socket.emit('informations', { salle: this.salle, identifiant: this.identifiant, nom: this.nomProvisoire, avatar: this.avatarProvisoire })
					}
					this.$store.dispatch('modifierInformations', { nom: this.nomProvisoire, avatar: this.avatarProvisoire })
					this.$store.dispatch('modifierNotification', this.$t('informationsModifiees'))
				}.bind(this)).catch(function () {
					this.chargement = false
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			}
		},
		modifierAvatar (avatar) {
			this.avatarProvisoire = avatar
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
						this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
					} else {
						this.avatarProvisoire = donnees
					}
					champ.value = ''
					this.progression = 0
				}.bind(this)).catch(function () {
					champ.value = ''
					this.progression = 0
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			} else {
				if (!formats.includes(extension)) {
					this.$store.dispatch('modifierMessage', this.$t('formatImageNonAccepte'))
				} else if (champ.files[0].size >= 1048576) {
					this.$store.dispatch('modifierMessage', this.$t('tailleMaximaleImage'))
				}
				champ.value = ''
			}
		},
		envoyerReponse () {
			if (this.reponse === true && this.premiereReponse === '' && this.reponses[this.indexQuestion].includes(this.identifiant) === false) {
				this.chargement = true
				const date = new Date().getTime()
				this.$socket.emit('reponse', { salle: this.salle, identifiant: this.identifiant, date: date })
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
		quitterPage () {
			this.$socket.emit('deconnexion', this.salle)
		}
	}
}
</script>

<style scoped>
#titre {
	width: calc(100% - 88px)!important;
}

#titre span {
	overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

#parametres {
	font-size: 24px;
	line-height: 40px;
	margin-left: 20px;
	cursor: pointer;
}

#parametres.avatar {
	display: flex;
	justify-content: center;
	align-items: center;
	line-height: 1;
}

#parametres.avatar span img {
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

#modale-informations,
#modale-parametres {
	max-width: 500px;
}

#modale-informations span.bouton,
#modale-parametres span.bouton {
	width: 100%;
	text-align: center;
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
    border-radius: 50%;
	cursor: pointer;
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
	#modale-informations,
	#modale-parametres {
		height: 90%;
	}
}
</style>
