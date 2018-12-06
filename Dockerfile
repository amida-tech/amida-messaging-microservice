# node image
FROM node:8.14.0-alpine as builder

# set /app directory as default working directory
WORKDIR /app/
COPY . /app/

# Obtain patch for snyk
RUN apk update && apk add --no-cache patch

# Run yarn
RUN yarn install --pure-lockfile && yarn build && yarn install --production --frozen-lockfile

# expose port 4001
EXPOSE 4001

# cmd to start service
CMD ["yarn", "serve"]
