FROM node:latest

RUN mkdir -p /home/app

WORKDIR /home/app

COPY package*.json /home/app/

RUN npm install

COPY . .

EXPOSE 4444

CMD [ "npm", "run", "server" ]