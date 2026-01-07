FROM --platform=linux/amd64 confluentinc/cp-kafka-connect:7.8.0-2-ubi8

USER root

RUN yum install -y jq findutils unzip

RUN confluent-hub install snowflakeinc/snowflake-kafka-connector:2.5.0 --no-prompt

COPY tmp/kafka-connect-http/ /usr/share/confluent-hub-components/kafka-connect-http/


VOLUME /storage

USER root

