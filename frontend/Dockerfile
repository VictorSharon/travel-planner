FROM node:20

WORKDIR /app

COPY package.json yarn.lock ./

RUN yarn install --production=false

COPY . .

RUN yarn build

CMD ["yarn", "preview", "--host", "0.0.0.0", "--port", "3000"]