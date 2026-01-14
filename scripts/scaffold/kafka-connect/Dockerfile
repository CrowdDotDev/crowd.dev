FROM --platform=linux/amd64 confluentinc/cp-kafka-connect:8.0.3-1-ubi9

USER root

RUN yum install -y jq findutils unzip

RUN confluent-hub install snowflakeinc/snowflake-kafka-connector:2.5.0 --no-prompt
COPY tmp/kafka-connect-http/ /usr/share/confluent-hub-components/kafka-connect-http/
RUN confluent-hub install confluentinc/kafka-connect-jdbc:10.8.4 --no-prompt
COPY tmp/custom-plugins/tinybird-smt-1.0.8.jar /usr/share/java/tinybird-smt-1.0.8.jar


VOLUME /storage

USER root

