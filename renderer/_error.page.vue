<template>
	<div id="page">
		<div id="conteneur" v-if="is404">
			<h1>Erreur 404</h1>
			<h3>Cette page n'existe pas.<br><a href="/">← <u>Retour à l'accueil</u></a></h3>
		</div>
		<div id="conteneur" v-else>
			<h1>Erreur 500</h1>
			<h3>Le serveur a rencontré une erreur.<br><a href="/">← <u>Retour à l'accueil</u></a></h3>
		</div>
	</div>
</template>

<script setup>
	defineProps(['is404'])
</script>

<style scoped>
#page {
	display: flex;
	justify-content: center;
	align-items: center;
	width: 100%;
	height: 100%;
	overflow: auto;
}

#conteneur {
	padding: 2rem;
	margin-bottom: 7rem;
}

#page h1 {
	font-size: 3.2rem;
	text-transform: uppercase;
	text-align: center;
	margin-bottom: 3rem;
}

#page h3 {
	font-size: 2rem;
	text-align: center;
}

@media screen and (max-width: 599px) {
	#page h1 {
		font-size: 2.7rem;
	}

	#page h3 {
		font-size: 1.6rem;
	}
}
</style>
