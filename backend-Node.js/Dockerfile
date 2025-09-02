FROM node:20

WORKDIR /app
COPY package*.json ./
RUN npm install
COPY . .

EXPOSE 4000
# Always run npm install at container startup to ensure dependencies are present with bind mount
CMD ["sh", "-c", "npm install && npm start"]