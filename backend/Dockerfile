FROM node:12-alpine
COPY ./server/ .
COPY ./.env .
RUN npm install 
RUN npm install ws
RUN npm install node-fetch
CMD ["npm", "start"] 
EXPOSE 8000
