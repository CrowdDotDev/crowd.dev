FROM --platform=linux/amd64 confluentinc/cp-kafka-connect:7.8.0-2-ubi8

USER root

RUN yum install -y jq findutils unzip

RUN confluent-hub install snowflakeinc/snowflake-kafka-connector:2.5.0 --no-prompt
RUN confluent-hub install confluentinc/kafka-connect-jdbc:10.7.4 --no-prompt

COPY tmp/kafka-connect-http/ /usr/share/confluent-hub-components/kafka-connect-http/
COPY tmp/custom-plugins/tinybird-smt-1.0.0.jar /usr/share/java/tinybird-smt-1.0.0.jar


VOLUME /storage

USER root

