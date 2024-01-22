FROM node:18-alpine as build

ARG NPM_MAIL
ARG NPM_AUTH_TOKEN

WORKDIR /usr/app

COPY package*.json ./

COPY .npmnrc.docker .npmrc

RUN npm i

RUN rm -f .npmrc

COPY . .

RUN npm run build:all

FROM node:18-alpine as run

WORKDIR /usr/app

COPY --from=0 /usr/app .

EXPOSE 3000

RUN mkdir "/temp"

ENTRYPOINT npm run $0 $@
CMD ['start:rest-api:prod']
