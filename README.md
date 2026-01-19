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
```

### Projet Vue (Vue.js 3 et Vike) avec serveur Node.js (Express) et base de données Redis

### Démo
https://digibuzzer.app

### Remerciements et crédits
Traduction en italien par Paolo Mauri (https://codeberg.org/maupao)

Traduction en allemand par kate (https://translate.codeberg.org/user/kate/), Dirk (https://translate.codeberg.org/user/Dirk/), Alexander Weller (https://translate.codeberg.org/user/weller@kreidezeit.kiwi/) et ThetaDev (https://translate.codeberg.org/user/ThetaDev/)

Traduction en espagnol par fersdt (https://translate.codeberg.org/user/fersdt/)

### Soutien
Open Collective : https://opencollective.com/ladigitale

Liberapay : https://liberapay.com/ladigitale/
