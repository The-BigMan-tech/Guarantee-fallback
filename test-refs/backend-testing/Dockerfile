#*Build stage
FROM node:20 AS build

WORKDIR /app/backend

COPY package.json .

COPY pnpm-lock.yaml .

RUN npx pnpm install

COPY . .

ENV PORT=4000

RUN npx pnpm run build


#*Production
FROM node:20 AS production

WORKDIR /app/backend

COPY --from=build /app/backend/dist ./dist

COPY package*.json ./

RUN npx pnpm install --prod

EXPOSE 4000

ENTRYPOINT [ "node", "dist/main.js" ]



