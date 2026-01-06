<template>
	<div id="page" v-if="role === 'animateur' && salles.includes(salle)">
		<div id="salle" v-if="statut === ''">
			<header>
				<div id="conteneur-header">
					<a id="logo" :href="hote" />

					<div id="titre" class="edition">
						<span class="titre">{{ titre }}</span>
						<span class="modifier" :title="$t('modifierTitre')" role="button" :tabindex="modale === '' && message === '' ? 0 : -1" @click="afficherModaleTitre" @keydown.enter="afficherModaleTitre"><i class="material-icons">edit</i></span>
					</div>

					<div id="boutons">
						<span class="recharger" role="button" :tabindex="modale === '' && message === '' ? 0 : -1" :title="$t('rechargerDonnees')" @click="rechargerDonnees('notification')" @keydown.enter="rechargerDonnees('notification')"><i class="material-icons">sync</i></span>
						<span class="langues" role="button" :tabindex="modale === '' && message === '' ? 0 : -1" :title="$t('modifierLangue')" @click="afficherModaleLangues" @keydown.enter="afficherModaleLangues"><i class="material-icons">language</i></span>
					</div>
				</div>
			</header>

			<div id="conteneur" class="ascenseur avec-footer">
				<div class="section">
					<div class="informations">
						<span>{{ $t('lienParticipants') }}</span>
						<span class="lien">{{ hote.replace('http://', '').replace('https://', '') + '/p/' + salle }}</span>
						<span id="copier" class="icone" role="button" :tabindex="modale === '' && message === '' ? 0 : -1" :title="$t('copierLien')" @keydown.enter="copierLien"><i class="material-icons">content_copy</i></span>
						<span id="afficher" class="icone" role="button" :tabindex="modale === '' && message === '' ? 0 : -1" :title="$t('afficherCodeQR')" @click="afficherCodeQR" @keydown.enter="afficherCodeQR"><i class="material-icons">qr_code</i></span>
					</div>
				</div>

				<div id="section-parametres" class="section">
					<h3>{{ $t('parametres') }}</h3>
					<div class="conteneur-parametres">
						<div class="parametre">
							<h3>{{ $t('reponses') }}</h3>
							<label class="bouton-radio" role="button" :tabindex="modale === '' && message === '' ? 0 : -1" @keydown.enter="modifierParametre('reponses-orales')">{{ $t('orales') }}
								<input id="reponses-orales" type="radio" name="reponses" :checked="options.reponses === 'orales'" @change="modifierParametres('reponses', 'orales')">
								<span class="coche" />
							</label>
							<label class="bouton-radio" role="button" :tabindex="modale === '' && message === '' ? 0 : -1" @keydown.enter="modifierParametre('reponses-ecrites')">{{ $t('ecrites') }}
								<input id="reponses-ecrites" type="radio" name="reponses" :checked="options.reponses === 'ecrites'" @change="modifierParametres('reponses', 'ecrites')">
								<span class="coche" />
							</label>
						</div>
						<div class="parametre">
							<h3>{{ $t('activationBuzzer') }}</h3>
							<label class="bouton-radio" role="button" :tabindex="modale === '' && message === '' ? 0 : -1" @keydown.enter="modifierParametre('buzzer-immediat')">{{ $t('immediate') }}
								<input id="buzzer-immediat" type="radio" name="buzzer" :checked="options.buzzer === 'immediate'" @change="modifierParametres('buzzer', 'immediate')">
								<span class="coche" />
							</label>
							<label class="bouton-radio" role="button" :tabindex="modale === '' && message === '' ? 0 : -1" @keydown.enter="modifierParametre('buzzer-delai')">{{ $t('avecDelaiAleatoire') }}
								<input id="buzzer-delai" type="radio" name="buzzer" :checked="options.buzzer === 'delai'" @change="modifierParametres('buzzer', 'delai')">
								<span class="coche" />
							</label>
						</div>
					</div>
				</div>

				<div class="section">
					<h3>{{ $t('listeParticipants') }}</h3>
					<div class="utilisateurs" v-if="utilisateursConnectes.length > 0">
						<div class="utilisateur" v-for="(utilisateur, index) in utilisateursConnectes" :key="'utilisateur_connecte_' + index">
							<span class="bannir" role="button" :tabindex="modale === '' && message === '' ? 0 : -1" @click="bannir(utilisateur.identifiant)" @keydown.enter="bannir(utilisateur.identifiant)"><i class="material-icons">block</i></span>
							<span class="avatar"><img :src="'/avatars/' + utilisateur.avatar" :alt="'avatar' + index"></span>
							<span class="nom">{{ utilisateur.nom }}</span>
						</div>
					</div>
					<span class="vide" v-else>{{ $t('aucunParticipant') }}</span>
					<h3 v-if="utilisateursBannis.length > 0">{{ $t('listeParticipantsBannis') }}</h3>
					<div class="utilisateurs" v-if="utilisateursBannis.length > 0">
						<div class="utilisateur banni" v-for="(utilisateur, index) in utilisateursBannis" :key="'utilisateur_banni_' + index">
							<span class="bannir" role="button" :tabindex="modale === '' && message === '' ? 0 : -1" @click="autoriser(utilisateur.identifiant)" @keydown.enter="autoriser(utilisateur.identifiant)"><i class="material-icons">check_circle</i></span>
							<span class="avatar"><img :src="'/avatars/' + utilisateur.avatar" :alt="'avatar' + index"></span>
							<span class="nom">{{ utilisateur.nom }}</span>
						</div>
					</div>
				</div>
			</div>

			<footer>
				<div class="section">
					<span class="bouton" role="button" :tabindex="modale === '' && message === '' ? 0 : -1" @click="lancer" @keydown.enter="lancer">{{ $t('lancer') }}</span>
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

					<div id="boutons">
						<span class="langues" role="button" :tabindex="modale === '' && message === '' ? 0 : -1" :title="$t('modifierLangue')" @click="afficherModaleLangues" @keydown.enter="afficherModaleLangues"><i class="material-icons">language</i></span>
					</div>
				</div>
			</header>

			<div id="conteneur" class="ascenseur">
				<div class="section">
					<div class="informations">
						<span>{{ $t('telechargerResultats') }}</span>
						<span class="icone" role="button" :tabindex="modale === '' && message === '' ? 0 : -1" :title="$t('telecharger')" @click="exporter" @keydown.enter="exporter"><i class="material-icons">get_app</i></span>
					</div>
				</div>

				<div class="section">
					<h3>{{ $t('listeParticipants') }}</h3>
					<div class="utilisateurs" v-if="donneesUtilisateurs.length > 0">
						<div class="utilisateur" :class="{'banni': utilisateur.banni}" v-for="(utilisateur, index) in donneesUtilisateurs" :key="'utilisateur_' + index">
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
						<span id="copier" class="icone" role="button" :tabindex="modale === '' && message === '' ? 0 : -1" :title="$t('copierLien')" @keydown.enter="copierLien"><i class="material-icons">content_copy</i></span>
						<span id="afficher" class="icone" role="button" :tabindex="modale === '' && message === '' ? 0 : -1" :title="$t('afficherCodeQR')" @click="afficherCodeQR" @keydown.enter="afficherCodeQR"><i class="material-icons">qr_code</i></span>
					</div>

					<div id="boutons">
						<span class="recharger" role="button" :tabindex="modale === '' && message === '' ? 0 : -1" :title="$t('rechargerDonnees')" @click="rechargerDonnees('notification')" @keydown.enter="rechargerDonnees('notification')"><i class="material-icons">sync</i></span>
						<span class="langues" role="button" :tabindex="modale === '' && message === '' ? 0 : -1" :title="$t('modifierLangue')" @click="afficherModaleLangues" @keydown.enter="afficherModaleLangues"><i class="material-icons">language</i></span>
					</div>
				</div>
			</header>

			<div id="conteneur" class="ascenseur avec-footer">
				<div class="section">
					<h3>{{ $t('listeParticipants') }}</h3>
					<div class="utilisateurs" v-if="utilisateursConnectes.length > 0 && !classement">
						<div class="utilisateur" :class="{'desactive': statutQuestion === 'reponses' && reponses[indexQuestion].includes(utilisateur.identifiant)}" v-for="(utilisateur, index) in utilisateursConnectes" :key="'utilisateur_connecte_' + index">
							<span class="bannir" role="button" :tabindex="modale === '' && message === '' ? 0 : -1" @click="bannir(utilisateur.identifiant)" @keydown.enter="bannir(utilisateur.identifiant)"><i class="material-icons">block</i></span>
							<span class="avatar"><img :src="'/avatars/' + utilisateur.avatar" :alt="'avatar' + index"></span>
							<span class="nom">{{ utilisateur.nom }}</span>
							<span class="score">
								<span :tabindex="modale === '' && message === '' ? 0 : -1" :title="$t('modifierScore')" @click="afficherModifierScore(utilisateur.identifiant)" @keydown.enter="afficherModifierScore(utilisateur.identifiant)">{{ definirScore(utilisateur.identifiant) }}</span>
								<span class="modifier" role="button" :tabindex="modale === '' && message === '' ? 0 : -1" @click="afficherModifierScore(utilisateur.identifiant)" @keydown.enter="afficherModifierScore(utilisateur.identifiant)"><i class="material-icons">edit</i></span>
							</span>
						</div>
					</div>
					<div class="utilisateurs" v-else-if="utilisateursClasses.length > 0 && classement">
						<div class="utilisateur" :class="{'desactive': statutQuestion === 'reponses' && reponses[indexQuestion].includes(utilisateur.identifiant)}" v-for="(utilisateur, index) in utilisateursClasses" :key="'utilisateur_connecte_' + index">
							<span class="bannir" role="button" :tabindex="modale === '' && message === '' ? 0 : -1" @click="bannir(utilisateur.identifiant)" @keydown.enter="bannir(utilisateur.identifiant)"><i class="material-icons">block</i></span>
							<span class="avatar"><img :src="'/avatars/' + utilisateur.avatar" :alt="'avatar' + index"></span>
							<span class="nom">{{ utilisateur.nom }}</span>
							<span class="score">
								<span :tabindex="modale === '' && message === '' ? 0 : -1" :title="$t('modifierScore')" @click="afficherModifierScore(utilisateur.identifiant)" @keydown.enter="afficherModifierScore(utilisateur.identifiant)">{{ utilisateur.score }}</span>
								<span class="modifier" role="button" :tabindex="modale === '' && message === '' ? 0 : -1" @click="afficherModifierScore(utilisateur.identifiant)" @keydown.enter="afficherModifierScore(utilisateur.identifiant)"><i class="material-icons">edit</i></span>
							</span>
						</div>
					</div>
					<span class="vide" v-else>{{ $t('aucunParticipant') }}</span>
					<h3 class="bannis" v-if="utilisateursBannis.length > 0">
						<span>{{ $t('listeParticipantsBannis') }}</span>
						<span class="afficher-bannis" :tabindex="modale === '' && message === '' ? 0 : -1" @click="utilisateursBannisVisibles = !utilisateursBannisVisibles" @keydown.enter="utilisateursBannisVisibles = !utilisateursBannisVisibles" v-if="utilisateursBannisVisibles"><i class="material-icons">unfold_less</i></span>
						<span class="afficher-bannis" :tabindex="modale === '' && message === '' ? 0 : -1" @click="utilisateursBannisVisibles = !utilisateursBannisVisibles" @keydown.enter="utilisateursBannisVisibles = !utilisateursBannisVisibles" v-else><i class="material-icons">unfold_more</i></span>
					</h3>
					<div class="utilisateurs" v-if="utilisateursBannis.length > 0 && utilisateursBannisVisibles">
						<div class="utilisateur banni" v-for="(utilisateur, index) in utilisateursBannis" :key="'utilisateur_banni_' + index">
							<span class="bannir" role="button" :tabindex="modale === '' && message === '' ? 0 : -1" @click="autoriser(utilisateur.identifiant)" @keydown.enter="autoriser(utilisateur.identifiant)"><i class="material-icons">check_circle</i></span>
							<span class="avatar"><img :src="'/avatars/' + utilisateur.avatar" :alt="'avatar' + index"></span>
							<span class="nom">{{ utilisateur.nom }}</span>
							<span class="score">{{ definirScore(utilisateur.identifiant) }}</span>
						</div>
					</div>
				</div>
			</div>

			<footer>
				<div class="section">
					<span class="bouton icone active" role="button" :tabindex="modale === '' && message === '' ? 0 : -1" @click="classer" @keydown.enter="classer" :title="$t('desactiverClassementParScore')" v-if="classement"><i class="material-icons">equalizer</i></span>
					<span class="bouton icone" role="button" :tabindex="modale === '' && message === '' ? 0 : -1" @click="classer" @keydown.enter="classer" :title="$t('classerParScore')" v-else><i class="material-icons">equalizer</i></span>
					<span class="bouton" role="button" :tabindex="modale === '' && message === '' ? 0 : -1" @click="modifierIndexQuestion" @keydown.enter="modifierIndexQuestion">{{ $t('nouvelleQuestion') }}</span>
					<span class="bouton" role="button" :tabindex="modale === '' && message === '' ? 0 : -1" @click="afficherModaleConfirmation" @keydown.enter="afficherModaleConfirmation">{{ $t('fermer') }}</span>
				</div>
			</footer>
		</div>

		<div class="conteneur-modale" v-if="modale === 'titre'">
			<div id="modale-titre" class="modale" role="dialog">
				<header>
					<span class="titre">{{ $t('modifierTitre') }}</span>
					<span class="fermer" role="button" :tabindex="message === '' ? 0 : -1" @click="fermerModale" @keydown.enter="fermerModale"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu">
						<label for="champ-titre">{{ $t('titre') }}</label>
						<input id="champ-titre" type="text" :value="titre" @keydown.enter="modifierTitre">
						<div class="actions">
							<span class="bouton" role="button" :tabindex="message === '' ? 0 : -1" @click="modifierTitre" @keydown.enter="modifierTitre">{{ $t('valider') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modale === 'langues'">
			<div id="modale-langues" class="modale" role="dialog">
				<header>
					<span class="titre">{{ $t('langue') }}</span>
					<span class="fermer" role="button" :tabindex="message === '' ? 0 : -1" @click="fermerModale" @keydown.enter="fermerModale"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu">
						<span role="button" :tabindex="message === '' ? 0 : -1" :class="{'selectionne': langue === 'fr'}" @click="modifierLangue('fr')" @keydown.enter="modifierLangue('fr')">FR</span>
						<span role="button" :tabindex="message === '' ? 0 : -1" :class="{'selectionne': langue === 'it'}" @click="modifierLangue('it')" @keydown.enter="modifierLangue('it')">IT</span>
						<span role="button" :tabindex="message === '' ? 0 : -1" :class="{'selectionne': langue === 'de'}" @click="modifierLangue('de')" @keydown.enter="modifierLangue('de')">DE</span>
						<span role="button" :tabindex="message === '' ? 0 : -1" :class="{'selectionne': langue === 'en'}" @click="modifierLangue('en')" @keydown.enter="modifierLangue('en')">EN</span>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modale === 'question'">
			<div id="modale-question" class="modale" role="dialog">
				<div class="conteneur">
					<div class="contenu">
						<span class="question">{{ $t('question') }} {{ indexQuestion + 1 }}</span>
						<span class="icone"><i class="material-icons">chat_bubble_outline</i></span>
						<div class="actions">
							<span class="bouton" role="button" :tabindex="message === '' ? 0 : -1" @click="ouvrirReponses" @keydown.enter="ouvrirReponses">{{ $t('cestParti') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modale === 'utilisateur'">
			<div id="modale-utilisateur" class="modale" role="dialog">
				<div class="conteneur">
					<div class="contenu">
						<div class="avatar">
							<img :src="'/avatars/' + definirAvatar()">
						</div>
						<div class="nom">
							{{ definirNom() }}
						</div>
						<div class="texte" v-if="options.reponses === 'ecrites'">
							<label for="texte">{{ $t('reponse') }}</label>
							<span v-if="texte === ''">{{ $t('attenteTexte') }}</span>
							<span v-else v-html="texte" />
						</div>
						<div class="points">
							<label for="points">{{ $t('pointsBonneReponse') }}</label>
							<input id="points" type="number" v-model="points">
						</div>
						<div class="actions">
							<span class="bouton" role="button" :tabindex="message === '' ? 0 : -1" @click="annuler" @keydown.enter="annuler">{{ $t('mauvaiseReponse') }}</span>
							<span class="bouton" role="button" :tabindex="message === '' ? 0 : -1" @click="valider" @keydown.enter="valider">{{ $t('bonneReponse') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modale === 'score'">
			<div id="modale-score" class="modale" role="dialog">
				<header>
					<span class="titre">{{ $t('modifierScore') }}</span>
					<span class="fermer" role="button" :tabindex="message === '' ? 0 : -1" @click="fermerModale" @keydown.enter="fermerModale"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu">
						<input type="number" v-model="donneesScore.score" @keydown.enter="modifierScore">
						<div class="actions">
							<span class="bouton" role="button" :tabindex="message === '' ? 0 : -1" @click="modifierScore" @keydown.enter="modifierScore">{{ $t('modifier') }}</span>
						</div>
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modale === 'code-qr'">
			<div id="modale-codeqr" class="modale" role="dialog">
				<header>
					<span class="titre">{{ $t('codeQR') }}</span>
					<span class="fermer" role="button" :tabindex="message === '' ? 0 : -1" @click="fermerModale" @keydown.enter="fermerModale"><i class="material-icons">close</i></span>
				</header>
				<div class="conteneur">
					<div class="contenu">
						<div id="qr" />
					</div>
				</div>
			</div>
		</div>

		<div class="conteneur-modale" v-else-if="modale === 'confirmation'">
			<div id="modale-confirmation" class="modale" role="dialog">
				<div class="conteneur">
					<div class="contenu">
						<p v-html="$t('confirmationFermerSalle')" />
						<div class="actions">
							<span class="bouton" role="button" :tabindex="message === '' ? 0 : -1" @click="fermerModale" @keydown.enter="fermerModale">{{ $t('non') }}</span>
							<span class="bouton" role="button" :tabindex="message === '' ? 0 : -1" @click="fermer" @keydown.enter="fermer">{{ $t('oui') }}</span>
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
import ClipboardJS from 'clipboard'
import fileSaver from 'file-saver'
const { saveAs } = fileSaver
import ChargementPage from '#root/components/chargement-page.vue'
import Chargement from '#root/components/chargement.vue'
import Message from '#root/components/message.vue'
import Notification from '#root/components/notification.vue'

export default {
	name: 'Creer',
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
			modale: '',
			utilisateurs: [],
			options: {
				reponses: 'orales',
				buzzer: 'immediate'
			},
			indexQuestion: -1,
			statutQuestion: '',
			premiereReponse: '',
			points: 1000,
			reponses: [],
			resultats: [],
			textes: [],
			texte: '',
			classement: false,
			donneesScore: {},
			codeqr: '',
			domaine: '',
			donneesUtilisateurs: [],
			utilisateursBannisVisibles: true,
			elementPrecedent: null,
			hote: this.$pageContext.pageProps.hote,
			identifiant: this.$pageContext.pageProps.identifiant,
			nom: this.$pageContext.pageProps.nom,
			role: this.$pageContext.pageProps.role,
			salles: this.$pageContext.pageProps.salles,
			langues: this.$pageContext.pageProps.langues,
			langue: this.$pageContext.pageProps.langue,
			salle: this.$pageContext.pageProps.salle,
			titre: this.$pageContext.pageProps.titre,
			statut: this.$pageContext.pageProps.statut,
			donnees: this.$pageContext.pageProps.donnees
		}
	},
	computed: {
		utilisateursConnectes () {
			const utilisateurs = []
			this.utilisateurs.forEach(function (utilisateur) {
				if (utilisateur.connecte && !utilisateur.banni) {
					utilisateurs.push(utilisateur)
				}
			})
			return utilisateurs
		},
		utilisateursBannis () {
			const utilisateurs = []
			this.utilisateurs.forEach(function (utilisateur) {
				if (utilisateur.connecte && utilisateur.banni) {
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
				if (utilisateur.banni) {
					utilisateurs.splice(indexUtilisateur, 1)
				}
			})
			utilisateurs.sort(function (a, b) {
				return b.score - a.score
			})
			return utilisateurs
		}
	},
	watch: {
		statut: function (statut) {
			if (statut === 'ferme') {
				this.definirDonneesUtilisateurs()
			}
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

		if (this.role === 'animateur' && this.salles.includes(this.salle)) {
			this.$socket.emit('connexion', { salle: this.salle, identifiant: this.identifiant, nom: this.nom, avatar: '' })
		}

		this.indexQuestion = parseInt(this.donnees.indexQuestion)
		this.statutQuestion = this.donnees.statutQuestion
		if (this.statutQuestion === 'question') {
			this.modale = 'question'
			this.$nextTick(function () {
				document.querySelector('#modale-question .bouton').focus()
			})
		}
		this.premiereReponse = this.donnees.premiereReponse
		if (this.donnees.hasOwnProperty('options') === true) {
			this.options = this.donnees.options
		}
		if (this.donnees.hasOwnProperty('textes') === true) {
			this.textes = this.donnees.textes
		}
		if (this.statutQuestion === 'reponses' && this.premiereReponse !== '') {
			this.modale = 'utilisateur'
			if (this.options.reponses === 'ecrites' && this.textes[this.indexQuestion] && this.textes[this.indexQuestion].length > 0) {
				for (let i = 0; i < this.textes[this.indexQuestion].length; i++) {
					if (this.textes[this.indexQuestion][i].identifiant === this.premiereReponse) {
						this.texte = this.textes[this.indexQuestion][i].texte
					}
				}
			}
			this.$nextTick(function () {
				document.querySelector('#points').focus()
			})
		}
		this.reponses = this.donnees.reponses
		this.resultats = this.donnees.resultats
		if (this.statut === 'ferme') {
			this.definirDonneesUtilisateurs()
		}
	},
	mounted () {
		document.getElementsByTagName('html')[0].setAttribute('lang', this.langue)

		this.initialiser()

		setTimeout(function () {
			this.chargementPage = false
		}.bind(this), 300)

		document.addEventListener('keydown', this.gererClavier, false)

		this.mobile = (window.navigator.maxTouchPoints || 'ontouchstart' in document)
		document.addEventListener('visibilitychange', async function () {
			if (this.mobile && !this.chargement && document.visibilityState === 'visible' && this.identifiant !== '' && this.nom !== '' && this.avatar !== '') {
				setTimeout(function () {
					this.rechargerDonnees('')
				}.bind(this), 200)
			} else if (!this.mobile && !this.chargement && document.visibilityState === 'visible' && this.identifiant !== '' && this.nom !== '' && this.avatar !== '') {
				this.rechargerDonnees('')
			}
		}.bind(this))
	},
	beforeUnmount () {
		document.removeEventListener('keydown', this.gererClavier, false)
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
				document.querySelector('#copier').focus()
				this.notification = this.$t('lienCopie')
			}.bind(this))

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
		definirDonneesUtilisateurs () {
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
			this.donneesUtilisateurs = utilisateurs
		},
		copierLien () {
			document.querySelector('#copier').click()
		},
		afficherCodeQR () {
			this.elementPrecedent = (document.activeElement || document.body)
			this.modale = 'code-qr'
			this.$nextTick(function () {
				const lien = this.hote + '/p/' + this.salle
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
				document.querySelector('.modale .fermer').focus()
			}.bind(this))
		},
		fermerModale () {
			this.modale = ''
			this.gererFocus()
		},
		fermerMessage () {
			this.message = ''
			this.gererFocus()
		},
		definirElementPrecedent (element) {
			this.elementPrecedent = element
		},
		afficherModaleTitre () {
			this.elementPrecedent = (document.activeElement || document.body)
			this.modale = 'titre'
			this.$nextTick(function () {
				document.querySelector('#modale-titre input').focus()
			})
		},
		modifierTitre () {
			const titre = document.querySelector('#modale-titre input').value
			if (titre !== '' && titre !== this.titre) {
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
						this.message = this.$t('erreurCommunicationServeur')
					} else if (donnees === 'non_autorise') {
						this.notification = this.$t('actionNonAutorisee')
					} else if (donnees === 'titre_modifie') {
						this.titre = titre
						document.title = titre + ' - Digibuzzer by La Digitale'
						this.notification = this.$t('titreModifie')
					}
				}.bind(this)).catch(function () {
					this.chargement = false
					this.message = this.$t('erreurCommunicationServeur')
				}.bind(this))
			}
		},
		afficherModaleLangues () {
			this.elementPrecedent = (document.activeElement || document.body)
			this.modale = 'langues'
			this.$nextTick(function () {
				document.querySelector('#modale-langues .fermer').focus()
			})
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
		modifierParametre (id) {
			document.querySelector('#' + id).click()
		},
		modifierParametres (type, valeur) {
			this.options[type] = valeur
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
					this.message = this.$t('erreurCommunicationServeur')
				} else if (donnees === 'non_autorise') {
					this.notification = this.$t('actionNonAutorisee')
				} else if (donnees === 'statut_modifie') {
					this.statut = 'ouvert'
					this.notification = this.$t('salleOuverte')
					this.$socket.emit('salleouverte', { salle: this.salle, titre: this.titre, options: this.options })
					this.$nextTick(function () {
						document.querySelector('footer .bouton:nth-child(2)').focus()
					})
				}
			}.bind(this)).catch(function () {
				this.chargement = false
				this.message = this.$t('erreurCommunicationServeur')
			}.bind(this))
		},
		modifierIndexQuestion () {
			this.chargement = true
			this.$socket.emit('question', { salle: this.salle, indexQuestion: this.indexQuestion + 1 })
		},
		ouvrirReponses () {
			this.chargement = true
			if (this.options.buzzer === 'immediate') {
				this.$socket.emit('reponses', this.salle)
			} else {
				const delai = Math.random() * (1500 - 100) + 100
				setTimeout(function () {
					this.$socket.emit('reponses', this.salle)
				}.bind(this), delai)
			}
			this.modale = ''
		},
		afficherModifierScore (identifiant) {
			this.elementPrecedent = (document.activeElement || document.body)
			this.donneesScore.score = this.definirScore(identifiant)
			this.donneesScore.identifiant = identifiant
			this.modale = 'score'
			this.$nextTick(function () {
				document.querySelector('#modale-score input').focus()
			})
		},
		modifierScore () {
			this.chargement = true
			const bonus = this.donneesScore.score - this.definirScoreSansBonus(this.donneesScore.identifiant)
			this.$socket.emit('score', { salle: this.salle, identifiant: this.donneesScore.identifiant, bonus: bonus })
			this.fermerModale()
			this.donneesScore = {}
		},
		bannir (identifiant) {
			if (!this.donnees.utilisateursBannis) {
				this.donnees.utilisateursBannis = []
			}
			if (!this.donnees.utilisateursBannis.includes(identifiant)) {
				this.donnees.utilisateursBannis.push(identifiant)
				this.utilisateurs.forEach(function (utilisateur) {
					if (utilisateur.identifiant === identifiant) {
						utilisateur.banni = true
					}
				}.bind(this))
				this.$socket.emit('utilisateursbannis', { salle: this.salle, utilisateursBannis: this.donnees.utilisateursBannis, identifiant: identifiant, type: 'banni' })
			}
		},
		autoriser (identifiant) {
			if (this.donnees.utilisateursBannis.includes(identifiant)) {
				const index = this.donnees.utilisateursBannis.indexOf(identifiant)
				this.donnees.utilisateursBannis.splice(index, 1)
				this.utilisateurs.forEach(function (utilisateur) {
					if (utilisateur.identifiant === identifiant) {
						utilisateur.banni = false
					}
				}.bind(this))
				this.$socket.emit('utilisateursbannis', { salle: this.salle, utilisateursBannis: this.donnees.utilisateursBannis, identifiant: identifiant, type: 'autorise' })
			}
		},
		classer () {
			this.classement = !this.classement
			if (this.classement === true) {
				this.notification = this.$t('classementScoreActive')
			} else {
				this.notification = this.$t('classementScoreDesactive')
			}
		},
		valider () {
			if (isNaN(this.points) === false && this.points > 0) {
				this.chargement = true
				this.$socket.emit('reponsevalidee', { salle: this.salle, identifiant: this.premiereReponse, points: this.points, indexQuestion: this.indexQuestion })
				this.modale = ''
				this.premiereReponse = ''
				this.$nextTick(function () {
					document.querySelector('footer .bouton:nth-child(2)').focus()
				})
			}
		},
		annuler () {
			this.chargement = true
			this.$socket.emit('reponseannulee', { salle: this.salle, identifiant: this.premiereReponse })
			this.modale = ''
			this.premiereReponse = ''
			this.texte = ''
			this.$nextTick(function () {
				document.body.focus()
			})
		},
		afficherModaleConfirmation () {
			this.elementPrecedent = (document.activeElement || document.body)
			this.modale = 'confirmation'
			this.$nextTick(function () {
				document.querySelector('.modale .bouton').focus()
			})
		},
		fermer () {
			this.fermerModale()
			this.chargement = true
			axios.post(this.hote + '/api/modifier-statut-salle', {
				identifiant: this.identifiant,
				salle: this.salle,
				statut: 'ferme'
			}).then(function (reponse) {
				this.chargement = false
				const donnees = reponse.data
				if (donnees === 'erreur') {
					this.message = this.$t('erreurCommunicationServeur')
				} else if (donnees === 'non_autorise') {
					this.notification = this.$t('actionNonAutorisee')
				} else if (donnees === 'statut_modifie') {
					this.statut = 'ferme'
					this.notification = this.$t('salleFermee')
					this.$socket.emit('sallefermee', this.salle)
				}
			}.bind(this)).catch(function () {
				this.chargement = false
				this.message = this.$t('erreurCommunicationServeur')
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
					if (utilisateur.banni) {
						texte += utilisateur.nom + ' (' + this.$t('banni') + ') ' + ',' + utilisateur.score + ','
					} else {
						texte += utilisateur.nom + ',' + utilisateur.score + ','
					}
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
				this.message = this.$t('aucunResultat')
			}
		},
		rechargerDonnees (notification) {
			this.chargement = true
			axios.post(this.hote + '/api/recuperer-donnees-salle', {
				salle: this.salle
			}).then(function (reponse) {
				this.chargement = false
				if (reponse.hasOwnProperty('data') && reponse.data !== 'erreur' && reponse.data !== 'salle_inexistante') {
					this.titre = reponse.data.titre
					this.statut = reponse.data.statut
					this.donnees = reponse.data.donnees
					this.indexQuestion = parseInt(this.donnees.indexQuestion)
					this.statutQuestion = this.donnees.statutQuestion
					if (this.statutQuestion === 'question') {
						this.modale = 'question'
						this.$nextTick(function () {
							document.querySelector('#modale-question .bouton').focus()
						})
					}
					this.premiereReponse = this.donnees.premiereReponse
					if (this.donnees.hasOwnProperty('options') === true) {
						this.options = this.donnees.options
					}
					if (this.donnees.hasOwnProperty('textes') === true) {
						this.textes = this.donnees.textes
					}
					if (this.statutQuestion === 'reponses' && this.premiereReponse !== '') {
						this.modale = 'utilisateur'
						if (this.options.reponses === 'ecrites' && this.textes[this.indexQuestion] && this.textes[this.indexQuestion].length > 0) {
							for (let i = 0; i < this.textes[this.indexQuestion].length; i++) {
								if (this.textes[this.indexQuestion][i].identifiant === this.premiereReponse) {
									this.texte = this.textes[this.indexQuestion][i].texte
								}
							}
						}
						this.$nextTick(function () {
							document.querySelector('#points').focus()
						})
					}
					this.reponses = this.donnees.reponses
					this.resultats = this.donnees.resultats
					if (this.statut === 'ferme') {
						this.definirDonneesUtilisateurs()
					}
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
			} else if (event.key === 'Escape' && (this.modale === 'titre' || this.modale === 'langues' || this.modale === 'code-qr' || this.modale === 'score' || this.modale === 'confirmation')) {
				this.fermerModale()
			}
		},
		gererFocus () {
			if (this.elementPrecedent) {
				this.elementPrecedent.focus()
				this.elementPrecedent = null
			}
		},
		ecouterSocket () {
			this.$socket.on('connexion', function (donnees) {
				if (!this.donnees.utilisateursBannis) {
					this.donnees.utilisateursBannis = []
				}
				const utilisateurs = donnees.utilisateurs.filter(function (utilisateur) {
					return utilisateur.identifiant !== this.identifiant
				}.bind(this))
				utilisateurs.forEach(function (utilisateur) {
					if (utilisateur.nom !== '' && utilisateur.avatar !== '') {
						utilisateur.connecte = true
					} else {
						utilisateur.connecte = false
					}
					if (this.donnees.utilisateursBannis.includes(utilisateur.identifiant)) {
						utilisateur.banni = true
					} else {
						utilisateur.banni = false
					}
				}.bind(this))
				this.utilisateurs = utilisateurs
				if (this.donnees.utilisateurs.map(function (e) { return e.identifiant }).includes(donnees.utilisateur.identifiant) === false) {
					if (this.donnees.utilisateursBannis.includes(donnees.utilisateur.identifiant)) {
						this.donnees.utilisateurs.push({ identifiant: donnees.utilisateur.identifiant, nom: donnees.utilisateur.nom, avatar: donnees.utilisateur.avatar, banni: true })
					} else {
						this.donnees.utilisateurs.push({ identifiant: donnees.utilisateur.identifiant, nom: donnees.utilisateur.nom, avatar: donnees.utilisateur.avatar, banni: false })
					}
				}
				this.donnees.utilisateurs.forEach(function (utilisateur, index) {
					utilisateurs.forEach(function (u) {
						if (utilisateur.identifiant === u.identifiant) {
							this.donnees.utilisateurs[index].nom = u.nom
							this.donnees.utilisateurs[index].avatar = u.avatar
							this.donnees.utilisateurs[index].banni = u.banni
						}
					}.bind(this))
				}.bind(this))
				const donneesUtilisateurs = this.donnees.utilisateurs.filter(function (utilisateur) {
					return utilisateur.identifiant !== this.identifiant
				}.bind(this))
				this.donnees.utilisateurs = donneesUtilisateurs
				this.$socket.emit('utilisateurs', { salle: this.salle, utilisateurs: donneesUtilisateurs })
			}.bind(this))

			this.$socket.on('deconnexion', function (identifiant) {
				const utilisateurs = JSON.parse(JSON.stringify(this.utilisateurs))
				utilisateurs.forEach(function (utilisateur, indexUtilisateur) {
					if (utilisateur.identifiant === identifiant) {
						utilisateurs.splice(indexUtilisateur, 1, { identifiant: utilisateur.identifiant, nom: utilisateur.nom, avatar: utilisateur.avatar, connecte: false })
					}
				})
				this.utilisateurs = utilisateurs
			}.bind(this))

			this.$socket.on('question', function (indexQuestion) {
				this.chargement = false
				this.indexQuestion = indexQuestion
				this.statutQuestion = 'question'
				this.premiereReponse = ''
				this.texte = ''
				this.reponses.push([])
				this.resultats.push([])
				this.textes.push([])
				this.modale = 'question'
				this.$nextTick(function () {
					document.querySelector('#modale-question .bouton').focus()
				})
			}.bind(this))

			this.$socket.on('reponses', function () {
				this.chargement = false
				this.statutQuestion = 'reponses'
			}.bind(this))

			this.$socket.on('reponse', function (reponse) {
				if (reponse.salle === this.salle && this.premiereReponse === '') {
					this.elementPrecedent = (document.activeElement || document.body)
					this.premiereReponse = reponse.identifiant
					this.modale = 'utilisateur'
					this.$socket.emit('premierereponse', { salle: this.salle, identifiant: reponse.identifiant, indexQuestion: this.indexQuestion })
					this.$nextTick(function () {
						document.querySelector('#points').focus()
					})
				}
			}.bind(this))

			this.$socket.on('texte', function (donnees) {
				if (donnees.salle === this.salle && donnees.identifiant === this.premiereReponse) {
					this.texte = donnees.texte
					this.$socket.emit('texteenvoye', { salle: this.salle, identifiant: donnees.identifiant, indexQuestion: this.indexQuestion, texte: this.texte })
				}
			}.bind(this))

			this.$socket.on('premierereponse', function (identifiant) {
				this.reponses[this.indexQuestion].push(identifiant)
			}.bind(this))

			this.$socket.on('texteenvoye', function (texte) {
				this.textes[this.indexQuestion].push(texte)
			}.bind(this))

			this.$socket.on('reponseannulee', function () {
				this.chargement = false
			}.bind(this))

			this.$socket.on('reponsevalidee', function (donnees) {
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
			}.bind(this))

			this.$socket.on('score', function (donnees) {
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
				this.notification = this.$t('scoreModifie')
			}.bind(this))

			this.$socket.on('informations', function (donnees) {
				const utilisateurs = JSON.parse(JSON.stringify(this.utilisateurs))
				utilisateurs.forEach(function (utilisateur, indexUtilisateur) {
					if (utilisateur.identifiant === donnees.identifiant) {
						utilisateurs[indexUtilisateur].nom = donnees.nom
						utilisateurs[indexUtilisateur].avatar = donnees.avatar
						utilisateurs[indexUtilisateur].connecte = true
					}
				})
				this.utilisateurs = utilisateurs
				const donneesUtilisateurs = JSON.parse(JSON.stringify(this.donnees.utilisateurs))
				donneesUtilisateurs.forEach(function (utilisateur, indexUtilisateur) {
					if (utilisateur.identifiant === donnees.identifiant) {
						donneesUtilisateurs[indexUtilisateur].nom = donnees.nom
						donneesUtilisateurs[indexUtilisateur].avatar = donnees.avatar
					}
				})
				this.donnees.utilisateurs = donneesUtilisateurs
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
#boutons {
	display: flex;
	justify-content: flex-end;
	align-items: center;
	font-size: 24px;
	margin-left: 20px;
	cursor: pointer;
}

#boutons .recharger {
	margin-right: 20px;
}

#titre span,
#boutons span {
	line-height: 1;
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
	cursor: pointer;
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
	border-radius: 0.5em;
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

#section-parametres {
	margin-bottom: 25px;
}

#section-parametres + .section {
	margin-top: 25px!important;
}

#section-parametres .conteneur-parametres {
	display: flex;
    flex-wrap: wrap;
    justify-content: flex-start;
}

#section-parametres.section h3 {
	display: block;
	width: 100%;
	font-weight: 700;
	font-size: 17px;
	margin-bottom: 10px;
	line-height: 1.2;
}

#section-parametres .parametre {
	margin-right: 30px;
}

#section-parametres .bouton-radio {
	display: inline-block;
	position: relative;
	padding-left: 30px;
	cursor: pointer;
	font-size: 16px;
	user-select: none;
	margin-bottom: 15px;
	margin-right: 15px;
	line-height: 22px;
}

#section-parametres .bouton-radio:last-child {
	margin-right: 0;
}

#section-parametres .bouton-radio input {
	display: none;
}

#section-parametres .coche {
	position: absolute;
	top: 0;
	left: 0;
	height: 22px;
	width: 22px;
	background-color: #eee;
	border-radius: 50%;
}

#section-parametres .bouton-radio:hover input ~ .coche {
	background-color: #ccc;
}

#section-parametres .bouton-radio input:checked ~ .coche {
	background-color: #00ced1;
}

#section-parametres .coche:after {
	content: '';
	position: absolute;
	display: none;
}

#section-parametres .bouton-radio input:checked ~ .coche:after {
	display: block;
}

#section-parametres .bouton-radio .coche:after {
	top: 6px;
	left: 6px;
	width: 10px;
	height: 10px;
	border-radius: 50%;
	background: #fff;
}

.utilisateurs {
	display: flex;
	justify-content: flex-start;
	flex-wrap: wrap;
}

.utilisateurs .utilisateur {
	position: relative;
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
	cursor: pointer;
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
}

.utilisateurs .utilisateur span.bannir {
	display: none;
	position: absolute;
	top: 5px;
	right: 5px;
	line-height: 1;
	color: #aaa;
	font-size: 24px;
	cursor: pointer;
}

.utilisateurs .utilisateur:hover span.bannir,
.utilisateurs .utilisateur span.score:hover .modifier {
	display: block;
}

.utilisateurs .utilisateur.banni {
	opacity: 0.5;
}

.vide + h3 {
	margin-top: 40px;
}

.utilisateurs + h3 {
	margin-top: 25px;
}

h3.bannis {
	display: flex;
	align-items: center;
}

span.afficher-bannis {
	font-size: 24px;
	color: #aaa;
	line-height: 1;
	margin-left: 10px;
	cursor: pointer;
}

#modale-confirmation {
	text-align: center;
	max-width: 500px;
}

#modale-confirmation .conteneur {
	padding: 30px 25px;
}

#modale-langues .contenu {
	display: flex;
}

#modale-langues .contenu span {
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

#modale-langues .contenu span.selectionne {
    background: #242f3d;
    color: #fff;
    border: 1px solid #222;
    cursor: default;
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

#modale-utilisateur .texte,
#modale-utilisateur .points {
	text-align: left;
}

#modale-utilisateur .texte {
	margin-bottom: 20px;
}

#modale-utilisateur .texte span {
	display: block;
	padding: 10px 15px;
	border-radius: 4px;
	border: 1px solid #ddd;
	white-space: pre-line;
	max-height: 70px;
	overflow: auto;
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
#modale-codeqr .contenu {
	text-align: center;
}

#modale-codeqr #qr {
	display: inline-block;
}

#modale-codeqr #qr img {
	max-width: 100%;
	height: auto;
	max-height: 60vh;
}
</style>
