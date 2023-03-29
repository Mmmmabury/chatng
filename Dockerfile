FROM node:latest

WORKDIR /chatNG
COPY package.json /chatNG/package.json
RUN npm install --omit=dev
COPY . /chatNG
RUN npm run build
CMD [ "npm", "run", "start"]