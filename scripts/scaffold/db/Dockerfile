FROM postgres:13.6-alpine
ENV POSTGRES_PASSWORD = 'example'

COPY schema.sql /docker-entrypoint-initdb.d/
