FROM node:16-alpine as builder

RUN apk add --update --no-cache bash

WORKDIR /usr/crowd/service

COPY ./scripts ./scripts

COPY ./libs ./libs
COPY ./apps/integration_stream_worker ./apps/integration_stream_worker

RUN ./scripts/install_packages.sh

WORKDIR /usr/crowd/service/libs/common
RUN npm run build

WORKDIR /usr/crowd/service/libs/types
RUN npm run build

WORKDIR /usr/crowd/service/libs/logging
RUN npm run build

WORKDIR /usr/crowd/service/libs/database
RUN npm run build

WORKDIR /usr/crowd/service/libs/redis
RUN npm run build

WORKDIR /usr/crowd/service/libs/sqs
RUN npm run build

WORKDIR /usr/crowd/service/libs/integrations
RUN npm run build

FROM node:16-alpine as app

RUN apk add --update --no-cache bash

WORKDIR /usr/crowd/service

COPY ./scripts ./scripts

COPY --from=builder /usr/crowd/service/libs/common/dist ./libs/common/dist
COPY ./libs/common/package.json ./libs/common/package-lock.json ./libs/common/tsconfig.json ./libs/common/

COPY --from=builder /usr/crowd/service/libs/types/dist ./libs/types/dist
COPY ./libs/types/package.json ./libs/types/package-lock.json ./libs/types/tsconfig.json ./libs/types/

COPY --from=builder /usr/crowd/service/libs/logging/dist ./libs/logging/dist
COPY ./libs/logging/package.json ./libs/logging/package-lock.json ./libs/logging/tsconfig.json ./libs/logging/

COPY --from=builder /usr/crowd/service/libs/database/dist ./libs/database/dist
COPY ./libs/database/package.json ./libs/database/package-lock.json ./libs/database/tsconfig.json ./libs/database/

COPY --from=builder /usr/crowd/service/libs/redis/dist ./libs/redis/dist
COPY ./libs/redis/package.json ./libs/redis/package-lock.json ./libs/redis/tsconfig.json ./libs/redis/

COPY --from=builder /usr/crowd/service/libs/sqs/dist ./libs/sqs/dist
COPY ./libs/sqs/package.json ./libs/sqs/package-lock.json ./libs/sqs/tsconfig.json ./libs/sqs/

COPY --from=builder /usr/crowd/service/libs/integrations/dist ./libs/integrations/dist
COPY ./libs/integrations/package.json ./libs/integrations/package-lock.json ./libs/integrations/tsconfig.json ./libs/integrations/

COPY ./apps/integration_stream_worker ./apps/integration_stream_worker

RUN ./scripts/install_packages.sh omit=dev