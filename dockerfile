FROM node:16.20.1

WORKDIR /home/sample_user

RUN apt-get update && apt-get install -y bash

RUN yarn global add expo-cli