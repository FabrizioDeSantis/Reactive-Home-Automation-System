FROM node:12-alpine
COPY ./ .
RUN npm install 
RUN npm install ws
RUN npm install wscat
RUN npm install node-fetch
CMD ["npm", "start"] 
EXPOSE 8086