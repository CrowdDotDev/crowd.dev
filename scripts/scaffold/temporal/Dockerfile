FROM alpine:latest

RUN apk add curl
RUN curl -sSf https://temporal.download/cli.sh | sh

ENV PATH /root/.temporalio/bin:$PATH

EXPOSE 7233 8233

ENTRYPOINT ["temporal", "server", "start-dev", "--ip", "0.0.0.0"]
