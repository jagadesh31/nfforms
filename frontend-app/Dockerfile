FROM node:20-alpine

WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# Accept build arguments and set them as env for CRA build
ARG REACT_APP_API_URL=http://localhost:5000/api
ARG REACT_APP_GOOGLE_CLIENT_ID=486170631932-lk7chbd259154reeqpe0a89ksb3rbr6i.apps.googleusercontent.com
ENV REACT_APP_API_URL=$REACT_APP_API_URL
ENV REACT_APP_GOOGLE_CLIENT_ID=$REACT_APP_GOOGLE_CLIENT_ID

RUN npm run build

# Serve with a lightweight static server
RUN npm install -g serve

EXPOSE 3000

CMD ["serve", "-s", "build", "-l", "3000"]
