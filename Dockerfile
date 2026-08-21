# syntax=docker/dockerfile:1

#### Étape 1 : installation des dépendances + build (Vike/Vite) ####
FROM node:24.18.0-bookworm-slim@sha256:6f7b03f7c2c8e2e784dcf9295400527b9b1270fd37b7e9a7285cf83b6951452d AS build
WORKDIR /app

RUN apt-get update \
	&& apt-get install -y --no-install-recommends python3 make g++ git ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Vite/vike n'injectent les variables VITE_* dans le bundle client qu'au moment du build : elles doivent être fournies ici (via --build-arg) et pas seullement au conteneur runtime
ARG VITE_LEGAL_TERMS_LINK
ENV VITE_LEGAL_TERMS_LINK=${VITE_LEGAL_TERMS_LINK}

RUN npm test && npm run build && npm prune --omit=dev

#### Étape 2 : construction de l'image ####
FROM node:24.18.0-bookworm-slim@sha256:6f7b03f7c2c8e2e784dcf9295400527b9b1270fd37b7e9a7285cf83b6951452d AS runtime
ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update \
	&& apt-get install -y --no-install-recommends curl \
	&& rm -rf /var/lib/apt/lists/* \
	&& rm -rf /usr/local/lib/node_modules/npm /usr/local/bin/npm /usr/local/bin/npx

COPY --from=build --chown=node:node /app/node_modules ./node_modules
COPY --from=build --chown=node:node /app/dist ./dist
COPY --chown=node:node package.json ./
COPY --chown=node:node LICENSE README.md ./
COPY --chown=node:node server ./server
COPY --chown=node:node public ./public
COPY --chown=node:node avatars ./avatars
COPY --chown=node:node vortex ./vortex

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
	CMD curl -fs http://localhost:${PORT:-3000}/healthz || exit 1

CMD ["node", "server/app.js"]
