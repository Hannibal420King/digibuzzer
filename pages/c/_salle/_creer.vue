<template>
	<div id="page" v-if="statutUtilisateur === 'animateur' && salles.includes(salle)">
		<div id="salle" v-if="statut === ''">
			<header>
				<div id="conteneur-header">
					<a id="logo" :href="hote" />

					<div id="titre" class="edition" @click="afficherModaleTitre">
						<span class="titre">{{ titre }}</span>
						<span class="modifier" role="button" tabindex="0" :title="$t('modifierTitre')"><i class="material-icons">edit</i></span>
					</div>

					<div id="parametres">
						<span class="parametres" role="button" tabindex="0" :title="$t('afficherParametres')" @click="afficherModaleParametres"><i class="material-icons">settings</i></span>
					</div>
				</div>
			</header>

			<div id="conteneur" class="ascenseur avec-footer">
				<div class="section">
					<div class="informations">
						<span>{{ $t('lienParticipants') }}</span>
						<span class="lien">{{ hote.replace('http://', '').replace('https://', '') + '/p/' + salle }}</span>
						<span id="copier" class="icone" role="button" tabindex="0" :title="$t('copierLien')"><i class="material-icons">content_copy</i></span>
						<span id="afficher" class="icone" role="button" tabindex="0" :title="$t('afficherCodeQR')" @click="afficherModaleCodeQR"><i class="material-icons">qr_code</i></span>
					</div>
				</div>

				<div class="section">
					<h3>{{ $t('listeParticipants') }}</h3>
					<div class="utilisateurs" v-if="utilisateursConnectes.length > 0">
						<div class="utilisateur" v-for="(utilisateur, index) in utilisateursConnectes" :key="'utilisateur_' + index">
							<span class="avatar"><img :src="'/avatars/' + utilisateur.avatar" :alt="'avatar' + index"></span>
							<span class="nom">{{ utilisateur.nom }}</span>
						</div>
					</div>
					<span class="vide" v-else>{{ $t('aucunParticipant') }}</span>
				</div>
			</div>

			<footer>
				<div class="section">
					<span class="bouton" role="button" tabindex="0" @click="lancer">{{ $t('lancer') }}</span>
				</div>
			</footer>
		</div>

		<div id="salle" v-else-if="statut === 'ferme'">
			<header>
				<div id="conteneur-header">
					<a id="logo" :href="hote" />

					<div id="titre">
						<span class="titre">{{ titre }}</span>
					</div>

					<div id="parametres">
						<span class="parametres" role="button" tabindex="0" :title="$t('afficherParametres')" @click="afficherModaleParametres"><i class="material-icons">settings</i></span>
					</div>
				</div>
			</header>

			<div id="conteneur" class="ascenseur">
				<div class="section">
					<div class="informations">
						<span>{{ $t('telechargerResultats') }}</span>
						<span class="icone" role="button" tabindex="0" :title="$t('telecharger')" @click="exporter"><i class="material-icons">get_app</i></span>
					</div>
				</div>

				<div class="section">
					<h3>{{ $t('listeParticipants') }}</h3>
					<div class="utilisateurs" v-if="donneesUtilisateurs.length > 0">
						<div class="utilisateur" v-for="(utilisateur, index) in donneesUtilisateurs" :key="'utilisateur_' + index">
							<span class="avatar"><img :src="'/avatars/' + utilisateur.avatar" :alt="'avatar' + index"></span>
							<span class="nom">{{ utilisateur.nom }}</span>
							<span class="score">{{ utilisateur.score }}</span>
						</div>
					</div>
					<span class="vide" v-else>{{ $t('aucunParticipant') }}</span>
				</div>
			</div>
		</div>

		<div id="salle" v-else>
			<header>
				<div id="conteneur-header">
					<a id="logo" :href="hote" />

					<div id="titre">
						<span class="titre">{{ titre }}</span>
						<span id="copier" class="icone" role="button" tabindex="0" :title="$t('copierLien')"><i class="material-icons">content_copy</i></span>
						<span id="afficher" class="icone" role="button" tabindex="0" :title="$t('afficherCodeQR')" @click="afficherModaleCodeQR"><i class="material-icons">qr_code</i></span>
					</div>

					<div id="parametres">
						<span class="parametres" role="button" tabindex="0" :title="$t('afficherParametres')"><i class="material-icons" @click="afficherModaleParametres">settings</i></span>
					</div>
				</div>
			</header>

			<div id="conteneur" class="ascenseur avec-footer">
				<div class="section">
					<h3>{{ $t('listeParticipants') }}</h3>
					<div class="utilisateurs" v-if="utilisateursConnectes.length > 0 && !classement">
						<div class="utilisateur" :class="{'desactive': statutQuestion === 'reponses' && reponses[indexQuestion].includes(utilisateur.identifiant)}" v-for="(utilisateur, index) in utilisateursConnectes" :key="'utilisateur_' + index">
							<span class="avatar"><img :src="'/avatars/' + utilisateur.avatar" :alt="'avatar' + index"></span>
							<span class="nom">{{ utilisateur.nom }}</span>
							<span class="score">
								<span>{{ definirScore(utilisateur.identifiant) }}</span>
								<span class="modifier" role="button" tabindex="0" @click="afficherModifierScore(utilisateur.identifiant)"><i class="material-icons">edit</i></span>
							</span>
						</div>
					</div>
					<div class="utilisateurs" v-else-if="utilisateursClasses.length > 0 && classement">
						<div class="utilisateur" :class="{'desactive': statutQuestion === 'reponses' && reponses[indexQuestion].includes(utilisateur.identifiant)}" v-for="(utilisateur, index) in utilisateursClasses" :key="'utilisateur_' + index">
							<span class="avatar"><img :src="'/avatars/' + utilisateur.avatar" :alt="'avatar' + index"></span>
							<span class="nom">{{ utilisateur.nom }}</span>
							<span class="score">
								<span>{{ utilisateur.score }}</span>
								<span class="modifier" role="button" tabindex="0" :title="$t('modifierScore')" @click="afficherModifierScore(utilisateur.identifiant)"><i class="material-icons">edit</i></span>
							</span>
						</div>
					</div>
					<span class="vide" v-else>{{ $t('aucunParticipant') }}</span>
				</div>
			</div>

			<footer>
				<div class="section">
					<span class="bouton icone active" role="button" tabindex="0" @click="classer" :title="$t('desactiverClassementParScore')" v-if="classement"><i class="material-icons">equalizer</i></span>
					<span class="bouton icone" role="button" tabindex="0" @click="classer" :title="$t('classerParScore')" v-else><i class="material-icons">equalizer</i></span>
					<span class="bouton" role="button" tabindex="0" @click="modifierIndexQuestion">{{ $t('nouvelleQuestion') }}</span>
					<span class="bouton" role="button" tabindex="0" @click="modaleConfirmation = true">{{ $t('fermer') }}</span>
				</div>
			</footer>
		</div>

		<div class="conteneur-modale" v-if="modale === 'titre'">
			<div id="modale-titre" class="modale">
				<header>
					<span class="titre">{{ $t('modifierTitre') }}</span>
					<span class="fermer" role="button" tabindex="0" @click="fermerModale"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu">
						<label>{{ $t('titre') }}</label>
						<input type="text" :value="titre">
						<div class="actions">
							<span class="bouton" role="button" tabindex="0" @click="modifierTitre">{{ $t('valider') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modale === 'parametres'">
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
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modale === 'question'">
			<div id="modale-question" class="modale">
				<div class="conteneur">
					<div class="contenu">
						<span class="question">{{ $t('question') }} {{ indexQuestion + 1 }}</span>
						<span class="icone"><i class="material-icons">chat_bubble_outline</i></span>
						<div class="actions">
							<span class="bouton" role="button" tabindex="0" @click="ouvrirReponses">{{ $t('cestParti') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modale === 'utilisateur'">
			<div id="modale-utilisateur" class="modale">
				<div class="conteneur">
					<div class="contenu">
						<div class="avatar">
							<img :src="'/avatars/' + definirAvatar()">
						</div>
						<div class="nom">
							{{ definirNom() }}
						</div>
						<div class="points">
							<label for="points">{{ $t('pointsBonneReponse') }}</label>
							<input type="number" id="points" :value="points" @input="points = $event.target.value">
						</div>
						<div class="actions">
							<span class="bouton" role="button" tabindex="0" @click="annuler">{{ $t('mauvaiseReponse') }}</span>
							<span class="bouton" role="button" tabindex="0" @click="valider">{{ $t('bonneReponse') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modale === 'score'">
			<div id="modale-score" class="modale">
				<header>
					<span class="titre">{{ $t('modifierScore') }}</span>
					<span class="fermer" role="button" tabindex="0" @click="modale = ''"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu">
						<input type="number" :value="donneesScore.score" @input="donneesScore.score = $event.target.value">
						<div class="actions">
							<span class="bouton" role="button" tabindex="0" @click="modifierScore">{{ $t('modifier') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-if="modaleConfirmation">
			<div id="modale-confirmation" class="modale">
				<div class="conteneur">
					<div class="contenu">
						<p v-html="$t('confirmationFermerSalle')" />
						<div class="actions">
							<span class="bouton" role="button" tabindex="0" @click="modaleConfirmation = false">{{ $t('non') }}</span>
							<span class="bouton" role="button" tabindex="0" @click="fermer">{{ $t('oui') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-show="modale === 'codeqr'">
			<div id="modale-codeqr" class="modale">
				<header>
					<span class="titre">{{ $t('codeQR') }}</span>
					<span class="fermer" role="button" tabindex="0" @click="fermerModale"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu">
						<div id="qr" />
					</div>
				</div>
			</div>
		</div>

		<chargement :chargement="chargement" v-if="chargement" />
	</div>
</template>

<script>
import axios from 'axios'
import ClipboardJS from 'clipboard'
import { saveAs } from 'file-saver'
import chargement from '@/components/chargement.vue'

export default {
	name: 'Creer',
	components: {
		chargement
	},
	sockets: {
		connexion: function (donnees) {
			const utilisateurs = donnees.utilisateurs.filter(function (utilisateur) {
				return utilisateur.identifiant !== this.identifiant
			}.bind(this))
			utilisateurs.forEach(function (utilisateur) {
				utilisateur.connecte = true
			})
			this.utilisateurs = utilisateurs
			if (this.donnees.utilisateurs.map(function (e) { return e.identifiant }).includes(donnees.utilisateur.identifiant) === false) {
				this.donnees.utilisateurs.push({ identifiant: donnees.utilisateur.identifiant, nom: donnees.utilisateur.nom, avatar: donnees.utilisateur.avatar })
			}
			const donneesUtilisateurs = this.donnees.utilisateurs.filter(function (utilisateur) {
				return utilisateur.identifiant !== this.identifiant
			}.bind(this))
			this.donnees.utilisateurs = donneesUtilisateurs
			this.$socket.emit('utilisateurs', { salle: this.salle, utilisateurs: donneesUtilisateurs })
		},
		deconnexion: function (identifiant) {
			const utilisateurs = this.utilisateurs
			utilisateurs.forEach(function (utilisateur, indexUtilisateur) {
				if (utilisateur.identifiant === identifiant) {
					utilisateurs.splice(indexUtilisateur, 1, { identifiant: utilisateur.identifiant, nom: utilisateur.nom, avatar: utilisateur.avatar, connecte: false })
				}
			})
			this.utilisateurs = utilisateurs
		},
		question: function (indexQuestion) {
			this.chargement = false
			this.indexQuestion = indexQuestion
			this.statutQuestion = 'question'
			this.premiereReponse = ''
			this.reponses.push([])
			this.resultats.push([])
			this.modale = 'question'
		},
		reponses: function () {
			this.chargement = false
			this.statutQuestion = 'reponses'
		},
		reponse: function (reponse) {
			if (reponse.salle === this.salle && this.premiereReponse === '') {
				this.premiereReponse = reponse.identifiant
				this.modale = 'utilisateur'
				this.$socket.emit('premierereponse', { salle: this.salle, identifiant: reponse.identifiant, indexQuestion: this.indexQuestion })
			}
		},
		premierereponse: function (identifiant) {
			this.reponses[this.indexQuestion].push(identifiant)
		},
		reponseannulee: function () {
			this.chargement = false
		},
		reponsevalidee: function (donnees) {
			this.chargement = false
			this.statutQuestion = ''
			if (this.resultats[donnees.indexQuestion].map(function (e) { return e.identifiant }).includes(donnees.identifiant) === true) {
				this.resultats[donnees.indexQuestion].forEach(function (resultat, indexResultat) {
					if (resultat.identifiant === donnees.identifiant) {
						this.resultats[donnees.indexQuestion][indexResultat].points = parseInt(this.resultats[donnees.indexQuestion][indexResultat].points) + parseInt(donnees.points)
					}
				}.bind(this))
			} else {
				this.resultats[donnees.indexQuestion].push({ identifiant: donnees.identifiant, points: parseInt(donnees.points) })
			}
		},
		score: function (donnees) {
			this.chargement = false
			if (this.donnees.bonus.map(function (e) { return e.identifiant }).includes(donnees.identifiant) === true) {
				this.donnees.bonus.forEach(function (bonus, indexBonus) {
					if (bonus.identifiant === donnees.identifiant) {
						this.donnees.bonus[indexBonus].points = parseInt(donnees.bonus)
					}
				}.bind(this))
			} else {
				this.donnees.bonus.push({ identifiant: donnees.identifiant, points: parseInt(donnees.bonus) })
			}
			this.$store.dispatch('modifierNotification', this.$t('scoreModifie'))
		},
		informations: function (donnees) {
			const utilisateurs = this.utilisateurs
			utilisateurs.forEach(function (utilisateur, indexUtilisateur) {
				if (utilisateur.identifiant === donnees.identifiant) {
					utilisateurs[indexUtilisateur].nom = donnees.nom
					utilisateurs[indexUtilisateur].avatar = donnees.avatar
				}
			})
			this.utilisateurs = utilisateurs
			const donneesUtilisateurs = this.donnees.utilisateurs
			donneesUtilisateurs.forEach(function (utilisateur, indexUtilisateur) {
				if (utilisateur.identifiant === donnees.identifiant) {
					donneesUtilisateurs[indexUtilisateur].nom = donnees.nom
					donneesUtilisateurs[indexUtilisateur].avatar = donnees.avatar
				}
			})
			this.donnees.utilisateurs = donneesUtilisateurs
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
			utilisateurs: [],
			indexQuestion: -1,
			statutQuestion: '',
			premiereReponse: '',
			points: 1000,
			reponses: [],
			resultats: [],
			classement: false,
			donneesScore: {},
			modaleConfirmation: false,
			codeqr: '',
			domaine: ''
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
		langue () {
			return this.$store.state.langue
		},
		langues () {
			return this.$store.state.langues
		},
		statutUtilisateur () {
			return this.$store.state.statut
		},
		salles () {
			return this.$store.state.salles
		},
		utilisateursConnectes () {
			const utilisateurs = []
			this.utilisateurs.forEach(function (utilisateur) {
				if (utilisateur.connecte) {
					utilisateurs.push(utilisateur)
				}
			})
			return utilisateurs
		},
		utilisateursClasses () {
			const utilisateurs = JSON.parse(JSON.stringify(this.utilisateurs))
			utilisateurs.forEach(function (utilisateur, indexUtilisateur) {
				let score = 0
				this.resultats.forEach(function (question) {
					question.forEach(function (u) {
						if (u.identifiant === utilisateur.identifiant) {
							score = score + u.points
						}
					})
				})
				if (this.donnees.bonus.map(function (e) { return e.identifiant }).includes(utilisateur.identifiant) === true) {
					this.donnees.bonus.forEach(function (bonus) {
						if (bonus.identifiant === utilisateur.identifiant) {
							score = score + bonus.points
						}
					})
				}
				utilisateurs[indexUtilisateur].score = score
			}.bind(this))
			utilisateurs.forEach(function (utilisateur, indexUtilisateur) {
				if (!utilisateur.score) {
					utilisateurs[indexUtilisateur].score = 0
				}
			})
			utilisateurs.sort(function (a, b) {
				return b.score - a.score
			})
			return utilisateurs
		},
		donneesUtilisateurs () {
			const utilisateurs = JSON.parse(JSON.stringify(this.donnees.utilisateurs))
			utilisateurs.forEach(function (utilisateur, indexUtilisateur) {
				let score = 0
				this.resultats.forEach(function (question) {
					question.forEach(function (u) {
						if (u.identifiant === utilisateur.identifiant) {
							score = score + u.points
						}
					})
				})
				if (this.donnees.bonus.map(function (e) { return e.identifiant }).includes(utilisateur.identifiant) === true) {
					this.donnees.bonus.forEach(function (bonus) {
						if (bonus.identifiant === utilisateur.identifiant) {
							score = score + bonus.points
						}
					})
				}
				utilisateurs[indexUtilisateur].score = score
			}.bind(this))
			utilisateurs.forEach(function (utilisateur, indexUtilisateur) {
				if (!utilisateur.score) {
					utilisateurs[indexUtilisateur].score = 0
				}
			})
			utilisateurs.sort(function (a, b) {
				return b.score - a.score
			})
			return utilisateurs
		}
	},
	watchQuery: ['page'],
	created () {
		this.$nuxt.$loading.start()
		const langue = this.$route.query.lang
		if (this.langues.includes(langue) === true) {
			this.$i18n.setLocale(langue)
			this.$store.dispatch('modifierLangue', langue)
			this.$socket.emit('modifierlangue', langue)
		} else {
			this.$i18n.setLocale(this.langue)
		}
		if (this.statutUtilisateur === 'animateur' && this.salles.includes(this.salle)) {
			this.$socket.emit('connexion', { salle: this.salle, identifiant: this.identifiant, nom: this.nom, avatar: '' })
		}
		this.indexQuestion = parseInt(this.donnees.indexQuestion)
		this.statutQuestion = this.donnees.statutQuestion
		if (this.statutQuestion === 'question') {
			this.modale = 'question'
		}
		this.premiereReponse = this.donnees.premiereReponse
		if (this.statutQuestion === 'reponses' && this.premiereReponse !== '') {
			this.modale = 'utilisateur'
		}
		this.reponses = this.donnees.reponses
		this.resultats = this.donnees.resultats
	},
	mounted () {
		if (this.statutUtilisateur === 'animateur' && this.salles.includes(this.salle)) {
			setTimeout(function () {
				this.$nuxt.$loading.finish()
				this.initialiser()
				document.getElementsByTagName('html')[0].setAttribute('lang', this.langue)
			}.bind(this), 100)
		} else {
			this.$router.push('/')
		}
	},
	methods: {
		initialiser () {
			const lien = this.hote + '/p/' + this.salle
			const clipboard = new ClipboardJS('#copier', {
				text: function () {
					return lien
				}
			})
			clipboard.on('success', function () {
				this.$store.dispatch('modifierNotification', this.$t('lienCopie'))
			}.bind(this))
			// eslint-disable-next-line
			this.codeqr = new QRCode('qr', {
				text: lien,
				width: 360,
				height: 360,
				colorDark: '#000000',
				colorLight: '#ffffff',
				// eslint-disable-next-line
				correctLevel : QRCode.CorrectLevel.H
			})
			this.domaine = window.location.href.split('/c/')[0]
		},
		definirScore (identifiant) {
			let score = 0
			this.resultats.forEach(function (question) {
				question.forEach(function (resultat) {
					if (resultat.identifiant === identifiant) {
						score = score + resultat.points
					}
				})
			})
			if (this.donnees.bonus.map(function (e) { return e.identifiant }).includes(identifiant) === true) {
				this.donnees.bonus.forEach(function (bonus) {
					if (bonus.identifiant === identifiant) {
						score = score + bonus.points
					}
				})
			}
			return score
		},
		definirScoreSansBonus (identifiant) {
			let score = 0
			this.resultats.forEach(function (question) {
				question.forEach(function (resultat) {
					if (resultat.identifiant === identifiant) {
						score = score + resultat.points
					}
				})
			})
			return score
		},
		definirAvatar () {
			const identifiant = this.premiereReponse
			let avatar = ''
			this.utilisateurs.forEach(function (utilisateur) {
				if (utilisateur.identifiant === identifiant) {
					avatar = utilisateur.avatar
				}
			})
			return avatar
		},
		definirNom () {
			const identifiant = this.premiereReponse
			let nom = ''
			this.utilisateurs.forEach(function (utilisateur) {
				if (utilisateur.identifiant === identifiant) {
					nom = utilisateur.nom
				}
			})
			return nom
		},
		afficherModaleCodeQR () {
			this.modale = 'codeqr'
		},
		fermerModale () {
			this.modale = ''
		},
		afficherModaleTitre () {
			this.modale = 'titre'
			this.$nextTick(function () {
				document.querySelector('#modale-titre input').focus()
			})
		},
		modifierTitre () {
			const titre = document.querySelector('#modale-titre input').value
			if (titre !== '') {
				this.fermerModale()
				this.chargement = true
				axios.post(this.hote + '/api/modifier-titre-salle', {
					identifiant: this.identifiant,
					salle: this.salle,
					titre: titre
				}).then(function (reponse) {
					this.chargement = false
					const donnees = reponse.data
					if (donnees === 'erreur') {
						this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
					} else if (donnees === 'non_autorise') {
						this.$store.dispatch('modifierNotification', this.$t('actionNonAutorisee'))
					} else if (donnees === 'titre_modifie') {
						this.titre = titre
						this.$store.dispatch('modifierNotification', this.$t('titreModifie'))
					}
				}.bind(this)).catch(function () {
					this.chargement = false
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				}.bind(this))
			}
		},
		afficherModaleParametres () {
			this.modale = 'parametres'
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
		afficherModifierScore (identifiant) {
			this.donneesScore.score = this.definirScore(identifiant)
			this.donneesScore.identifiant = identifiant
			this.modale = 'score'
		},
		modifierScore () {
			this.chargement = true
			const bonus = this.donneesScore.score - this.definirScoreSansBonus(this.donneesScore.identifiant)
			console.log(bonus)
			this.$socket.emit('score', { salle: this.salle, identifiant: this.donneesScore.identifiant, bonus: bonus })
			this.modale = ''
			this.donneesScore = {}
		},
		lancer () {
			this.chargement = true
			axios.post(this.hote + '/api/modifier-statut-salle', {
				identifiant: this.identifiant,
				salle: this.salle,
				statut: 'ouvert'
			}).then(function (reponse) {
				this.chargement = false
				const donnees = reponse.data
				if (donnees === 'erreur') {
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				} else if (donnees === 'non_autorise') {
					this.$store.dispatch('modifierNotification', this.$t('actionNonAutorisee'))
				} else if (donnees === 'statut_modifie') {
					this.statut = 'ouvert'
					this.$store.dispatch('modifierNotification', this.$t('salleOuverte'))
					this.$socket.emit('salleouverte', { salle: this.salle, titre: this.titre })
				}
			}.bind(this)).catch(function () {
				this.chargement = false
				this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
			}.bind(this))
		},
		modifierIndexQuestion () {
			this.chargement = true
			this.$socket.emit('question', { salle: this.salle, indexQuestion: this.indexQuestion + 1 })
		},
		ouvrirReponses () {
			this.chargement = true
			this.$socket.emit('reponses', this.salle)
			this.modale = ''
		},
		classer () {
			this.classement = !this.classement
			if (this.classement === true) {
				this.$store.dispatch('modifierNotification', this.$t('classementScoreActive'))
			} else {
				this.$store.dispatch('modifierNotification', this.$t('classementScoreDesactive'))
			}
		},
		valider () {
			this.chargement = true
			this.$socket.emit('reponsevalidee', { salle: this.salle, identifiant: this.premiereReponse, points: this.points, indexQuestion: this.indexQuestion })
			this.modale = ''
			this.premiereReponse = ''
		},
		annuler() {
			this.chargement = true
			this.$socket.emit('reponseannulee', { salle: this.salle, identifiant: this.premiereReponse })
			this.modale = ''
			this.premiereReponse = ''
		},
		fermer () {
			this.modaleConfirmation = false
			this.chargement = true
			axios.post(this.hote + '/api/modifier-statut-salle', {
				identifiant: this.identifiant,
				salle: this.salle,
				statut: 'ferme'
			}).then(function (reponse) {
				this.chargement = false
				const donnees = reponse.data
				if (donnees === 'erreur') {
					this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
				} else if (donnees === 'non_autorise') {
					this.$store.dispatch('modifierNotification', this.$t('actionNonAutorisee'))
				} else if (donnees === 'statut_modifie') {
					this.statut = 'ferme'
					this.$store.dispatch('modifierNotification', this.$t('salleFermee'))
					this.$socket.emit('sallefermee', this.salle)
				}
			}.bind(this)).catch(function () {
				this.chargement = false
				this.$store.dispatch('modifierMessage', this.$t('erreurCommunicationServeur'))
			}.bind(this))
		},
		exporter () {
			if (this.resultats.length > 0) {
				let texte = ''
				const totalQuestions = this.resultats.length
				texte += this.$t('nomOuPseudo') + ',' + this.$t('total') + ','
				for (let i = 0; i < totalQuestions; i++) {
					texte += this.$t('question') + ' ' + (i + 1) + ','
				}
				texte += this.$t('bonus') + '\n'
				this.donneesUtilisateurs.forEach(function (utilisateur) {
					texte += utilisateur.nom + ',' + utilisateur.score + ','
					for (let i = 0; i < totalQuestions; i++) {
						if (this.resultats[i].map(function (e) { return e.identifiant }).includes(utilisateur.identifiant) === true) {
							this.resultats[i].forEach(function (u) {
								if (utilisateur.identifiant === u.identifiant) {
									texte += u.points + ','
								}
							})
						} else {
							texte += 0 + ','
						}
					}
					if (this.donnees.bonus.map(function (e) { return e.identifiant }).includes(utilisateur.identifiant) === true) {
						this.donnees.bonus.forEach(function (u) {
							if (utilisateur.identifiant === u.identifiant) {
								texte += u.points + '\n'
							}
						})
					} else {
						texte += 0 + '\n'
					}
				}.bind(this))
				const blob = new Blob([texte], { type: 'text/csv;charset=utf-8' })
				const fichier = this.salle + '.csv'
				saveAs(blob, fichier)
			} else {
				this.$store.dispatch('modifierMessage', this.$t('erreurExportResultat'))
			}
		}
	}
}
</script>

<style scoped>
#titre.edition {
	cursor: pointer;
}

#parametres {
	display: flex;
	justify-content: flex-end;
	align-items: center;
	font-size: 24px;
	margin-left: 20px;
	cursor: pointer;
}

#parametres span.compte {
	margin-left: 15px;
}

#parametres span.deconnexion {
	margin-left: 15px;
	color: #ff6259;
}

#titre span.titre {
	display: inline-block;
	max-width: calc(100% - 23px);
	overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
}

#titre span.modifier {
	display: inline-block;
	margin-left: 5px;
	visibility: hidden;
}

#titre:hover span.modifier {
	visibility: visible;
}

#titre span#afficher,
#titre span#copier {
	display: inline-block;
	font-size: 24px;
	margin-left: 10px;
	cursor: pointer;
}

.informations {
	display: flex;
	flex-wrap: wrap;
	font-weight: 700;
	width: 100%;
	border: 2px solid #242f3d;
	border-radius: 1em;
	background: #e3e9f0;
	padding: 15px 20px;
}

.informations > span {
	margin-right: 5px;
}

.informations .icone {
	display: inline-block;
	font-size: 24px;
	font-weight: 400;
	margin-left: 10px;
	line-height: 1;
	cursor: pointer;
}

#afficher:active,
#copier:active {
	opacity: 0.7;
}

.utilisateurs {
	display: flex;
	justify-content: flex-start;
	flex-wrap: wrap;
}

.utilisateurs .utilisateur {
	padding: 10px;
	border: 1px solid #ddd;
	border-radius: 7px;
	margin-bottom: 20px;
}

.utilisateurs .utilisateur.desactive {
	background: #eee;
}

.utilisateurs .utilisateur span {
	display: block;
	text-align: center;
}

.utilisateurs .utilisateur span.avatar img {
	border-radius: 50%;
	max-width: 150px;
	max-height: 160px;
}

.utilisateurs .utilisateur span.nom {
	font-weight: 700;
	font-size: 18px;
	margin-top: 10px;
}

.utilisateurs .utilisateur span.score {
	position: relative;
	padding-top: 10px;
	margin-top: 10px;
	border-top: 1px solid #ddd;
	font-weight: 700;
	font-size: 18px;
}

.utilisateurs .utilisateur span.score .modifier {
	display: none;
	position: absolute;
	top: 8px;
	right: 0;
	line-height: 1;
	color: #fff;
	font-size: 24px;
	padding: 3px 1rem;
	background: rgba(0, 0, 0, 0.25);
	border-radius: 4px;
	cursor: pointer;
}

.utilisateurs .utilisateur span.score:hover .modifier {
	display: block;
}

#modale-confirmation {
	text-align: center;
	max-width: 500px;
}

#modale-confirmation .conteneur {
	padding: 30px 25px;
}

#modale-parametres .actions span {
	width: 100%;
}

#modale-parametres .actions span {
	margin-bottom: 20px;
}

#modale-parametres .actions span.supprimer {
	background: #ff6259;
	margin-bottom: 0;
}

#modale-parametres .actions span.supprimer:hover {
	background: #d70b00;
}

#modale-parametres .conteneur p {
    font-size: 14px;
    margin-bottom: 15px;
}

#modale-parametres .langue:last-of-type {
	margin-bottom: 0;
}

#modale-utilisateur {
	max-width: 450px;
	text-align: center;
}

#modale-utilisateur .conteneur {
	height: 100%;
}

#modale-utilisateur .avatar img {
	border-radius: 50%;
	max-width: 250px;
}

#modale-utilisateur .nom {
	font-weight: 700;
	font-size: 20px;
	margin-top: 20px;
	margin-bottom: 20px;
}

#modale-utilisateur .points {
	text-align: left;
}

#modale-utilisateur .bouton {
	width: calc(50% - 10px);
}

#modale-utilisateur .bouton:first-child {
	color: #fff;
	background: #777;
}

#modale-utilisateur .bouton:first-child:hover {
	background: #555;
}

#modale-question {
	width: auto;
	max-width: 90%;
}

#modale-question .conteneur {
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
#modale-question {
	font-size: 0;
	line-height: 1;
}

#modale-question .icone i {
	font-size: 40vh;
}

#modale-codeqr .contenu {
	text-align: center;
}

#modale-codeqr #qr {
	display: inline-block;
}

@media screen and (orientation: landscape) and (max-height: 479px) {
	#modale-utilisateur {
		height: 90%;
	}
}

@media screen and (max-width: 479px) {
	#modale-utilisateur .bouton {
		width: 100%;
		margin-right: 0;
	}

	#modale-utilisateur .bouton:first-child {
		margin-bottom: 20px;
	}
}

@media screen and (max-width: 599px) {
	.utilisateurs {
		justify-content: space-between;
	}

	.utilisateurs .utilisateur {
		width: 47%;
		margin-right: 0;
	}

	.utilisateurs .utilisateur span.avatar img {
		max-width: 100%;
	}
}

@media screen and (min-width: 600px) and (max-width: 1023px) {
	.utilisateurs .utilisateur {
		width: 31%;
		margin-right: 3.5%;
	}

	.utilisateurs .utilisateur:nth-child(3n) {
		margin-right: 0;
	}
}

@media screen and (min-width: 1024px) {
	.utilisateurs .utilisateur {
		width: 23.5%;
		margin-right: 2%;
	}

	.utilisateurs .utilisateur:nth-child(4n) {
		margin-right: 0;
	}
}
</style>

<style>
#modale-codeqr #qr img {
	max-width: 100%;
	height: auto;
	max-height: 60vh;
}
</style>
