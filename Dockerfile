# --- Étape 1 : Builder ---
# On utilise une image complète pour installer les dépendances
FROM node:20-alpine AS builder
WORKDIR /app

# On copie uniquement les fichiers de définition des dépendances d'abord
# Cela permet à Docker de mettre en cache cette couche si package.json ne change pas
COPY package*.json ./

# Installation propre et déterministe (ci = clean install)
RUN npm ci --only=production

# --- Étape 2 : Runtime ---
# On repart d'une image vierge pour la prod
FROM node:20-alpine
WORKDIR /app

# Installation de 'tini'. Node.js n'est pas conçu pour être le processus PID 1 (init).
# Tini gère les signaux système et les processus zombies.
RUN apk add --no-cache tini

# Copie des modules depuis l'étape builder (évite de traîner le cache npm)
COPY --from=builder /app/node_modules ./node_modules
# Copie du code source
COPY src ./src
COPY package.json ./

# Sécurité : Ne jamais exécuter en root. L'image node contient un user 'node' par défaut.
USER node

# Documentation du port
EXPOSE 3000

# Démarrage via Tini
ENTRYPOINT ["/sbin/tini", "--"]
CMD ["node", "src/app.js"]
