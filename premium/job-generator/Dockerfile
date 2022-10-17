# syntax = docker/dockerfile:experimental
FROM node:16-alpine

WORKDIR /usr/crowd/premium-job-generator
COPY package-lock.json package.json ./

RUN npm install

COPY . .