FROM node:12-alpine
COPY ./server/ .
COPY ./.env .
RUN npm install 
CMD ["npm", "start"] 
EXPOSE 8000
