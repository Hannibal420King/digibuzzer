# Digibuzzer

Digibuzzer est une application en ligne simple pour créer des salles de jeu virtuelles. 

Elle est publiée sous licence GNU AGPLv3.
Sauf les fontes Roboto Slab et Material Icons (Apache License Version 2.0) et la fonte Mona Sans Expanded (Sil Open Font Licence 1.1)

### Prérequis
Node.js 20+, Redis 6+

### Préparation et installation des dépendances
```
npm install
```

### Lancement du serveur de développement sur localhost:3000
```
npm run dev
```

### Compilation, minification des fichiers et lancement du serveur de production
```
npm run prod
```

### Avec PM2
```
npm run build
pm2 start ecosystem.config.cjs --env production
```

### Variables d'environnement pour la mise en production (fichier .env à créer à la racine du dossier)
```
DOMAIN (protocole + domaine. ex : https://digibuzzer.app / seulement utilisée en production)
PORT (port du serveur local / 3000 par défaut)
REVERSE_PROXY (utilisation d'un reverse proxy / 0 ou 1 / 0 par défaut)
NODE_CLUSTER (utilisation de node.js en cluster / 0 ou 1 / 0 par défaut)
EARLY_HINTS (utilisation par le serveur des early hints et du code de statut 103 / 0 ou 1 / 0 par défaut)
DB_HOST (IP publique du serveur de base de données Redis)
DB_PWD (mot de passe de la base de données Redis)
DB_PORT (port de la base de données Redis / 6379 par défaut)
SESSION_KEY (clé de session Express Session)
SESSION_DURATION (durée de la session de connexion des utilisateurs en millisecondes)
VITE_LEGAL_TERMS_LINK (lien vers les mentions légales)
UMAMI_SCRIPT_URL (lien vers le script fourni par Umami pour l'analyse de trafic)
UMAMI_WEBSITE_ID (id de site sur le serveur Umami)
```

### Projet Vue (Vue.js 3 et Vike) avec serveur Node.js (Express) et base de données Redis

### Démo
https://digibuzzer.app

### Comment contribuer ?
Tout d'abord, merci de vouloir contribuer ! Voici quelques idées :
- soutenir le projet sur [Open Collective](https://opencollective.com/ladigitale) ou [LiberaPay](https://liberapay.com/ladigitale/) ;
- signaler des bogues ou proposer des fonctionnalités en ouvrant un ticket ;
- faire la promotion des services libres de La Digitale auprès de vos collègues, lors d'événements éducatifs, etc. ;
- publier des articles avec des pistes pédagogiques / des idées d'activités pour proposer des exemples concrets d'utilisation des outils ;
- participer à la traduction des services sur [Codeberg Translate](https://translate.codeberg.org/projects/la-digitale/#components).

Les demandes d'ajouts (Pull Requests) ne sont pas acceptées pour le moment. En effet, une contribution au code nécessite souvent plusieurs heures pour être révisée et commentée et ce n'est pas toujours compatible avec les priorités et le temps que je peux consacrer au projet.

N'hésitez pas à me contacter si vous avez des questions.

### Remerciements et crédits
Traduction en italien par Paolo Mauri (https://codeberg.org/maupao)

Traduction en allemand par kate (https://translate.codeberg.org/user/kate/), Dirk (https://translate.codeberg.org/user/Dirk/), Alexander Weller (https://translate.codeberg.org/user/weller@kreidezeit.kiwi/) et ThetaDev (https://translate.codeberg.org/user/ThetaDev/)

Traduction en espagnol par fersdt (https://translate.codeberg.org/user/fersdt/)
