# Digibuzzer

Digibuzzer est une application en ligne simple pour créer des salles de jeu virtuelles. 

Elle est publiée sous licence GNU GPLv3.
Sauf les fontes Roboto Slab et Material Icons (Apache License Version 2.0) et la fonte HKGrotesk (Sil Open Font Licence 1.1)

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
npm run build
npm run start
```

### Avec PM2
```
npm run build
pm2 start
```

### Variables d'environnement pour la mise en production (fichier .env à créer à la racine du dossier)
```
DOMAIN (protocole + domaine. ex : https://digibuzzer.app)
HOST (IP publique du serveur de production)
DB_HOST (IP publique du serveur de base de données Redis)
DB_PWD (mot de passe de la base de données Redis)
SESSION_KEY (clé de session Express Session)
```

### Projet Nuxt.js avec serveur Node.js (Express) et base de données Redis


### Démo
https://digibuzzer.app

### Soutien
https://opencollective.com/ladigitale

