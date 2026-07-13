# syntax=docker/dockerfile:1

#### Étape 1 : installation des dépendances + build (Vike/Vite) ####
FROM node:24-bookworm-slim AS build
WORKDIR /app

RUN apt-get update \
	&& apt-get install -y --no-install-recommends python3 make g++ git ca-certificates \
	&& rm -rf /var/lib/apt/lists/*

COPY package.json ./
RUN npm install

COPY . .

# Vite/vike n'injectent les variables VITE_* dans le bundle client qu'au moment du build : elles doivent être fournies ici (via --build-arg) et pas seullement au conteneur runtime
ARG VITE_LEGAL_TERMS_LINK
ENV VITE_LEGAL_TERMS_LINK=${VITE_LEGAL_TERMS_LINK}

RUN npm run build && npm prune --omit=dev

#### Étape 2 : construction de l'image ####
FROM node:24-bookworm-slim AS runtime
ENV NODE_ENV=production
WORKDIR /app

RUN apt-get update \
	&& apt-get install -y --no-install-recommends curl \
	&& rm -rf /var/lib/apt/lists/*

COPY --from=build /app/node_modules ./node_modules
COPY --from=build /app/dist ./dist
COPY package.json ./
COPY server ./server
COPY public ./public
COPY avatars ./avatars

RUN chown -R node:node /app

USER node
EXPOSE 3000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
	CMD curl -fs http://localhost:${PORT:-3000}/ || exit 1

CMD ["node", "server/app.js"]
