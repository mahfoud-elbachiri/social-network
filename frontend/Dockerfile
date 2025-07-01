FROM node:20

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

RUN mkdir -p /app/public/images/uploads/group_posts
RUN mkdir -p /app/public/images/uploads/group_comments

RUN npm run build

EXPOSE 3000

CMD ["npm", "run", "start"]
