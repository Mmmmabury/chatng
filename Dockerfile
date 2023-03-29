FROM node:latest

WORKDIR /chatNG
COPY package.json /chatNG/package.json
RUN npm install --omit=dev
COPY . /chatNG
# RUN yarn
    # && yarn postinstall
# RUN apt-get install -y ffmpeg \
    # &&  yarn
# CMD [ "node","-r","ts-node/register","main.ts" ] 
RUN npm run build
CMD [ "npm", "run", "start"]
# 挂载离线网页目录到 /apis/server/singlefile