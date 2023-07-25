FROM node:12-alpine
COPY ./server/ .
COPY ./.env .
RUN npm install 
RUN npm install ws
CMD ["npm", "start"] 
EXPOSE 8000
