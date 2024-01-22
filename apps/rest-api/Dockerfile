FROM node:14-alpine as build

ARG NPM_BASIC_AUTH
ARG NPM_BASIC_AUTH_MAIL

WORKDIR /usr/app

COPY package*.json ./

COPY .npmnrc.docker .npmrc

RUN npm i

RUN rm -f .npmrc

COPY . .

RUN npm run build

FROM node:14-alpine as run

WORKDIR /usr/app

COPY --from=0 /usr/app/dist ./dist

COPY --from=0 /usr/app/node_modules ./node_modules

COPY --from=0 /usr/app/package.json ./

EXPOSE 3000

ENTRYPOINT npm run start:prod
