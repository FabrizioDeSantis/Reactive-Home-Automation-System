FROM node:14-alpine
COPY ./ .
RUN npm install 
RUN npm install ws
RUN npm install wscat
CMD ["npm", "start"] 
EXPOSE 8084