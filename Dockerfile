FROM node:18.12.1-slim
COPY ./ /server
WORKDIR /server
RUN npm install

EXPOSE 8000
EXPOSE 8500

CMD ["node", "index.js"]