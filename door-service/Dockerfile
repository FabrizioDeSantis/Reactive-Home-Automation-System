FROM node:12-alpine
COPY ./ .
RUN npm install 
RUN npm install ws
RUN npm install wscat
CMD ["npm", "start"] 
EXPOSE 8082