FROM confluentinc/cp-kafka-connect:7.8.0-2-ubi8

USER root

RUN yum install -y jq findutils unzip

RUN confluent-hub install snowflakeinc/snowflake-kafka-connector:2.5.0 --no-prompt
RUN confluent-hub install questdb/kafka-questdb-connector:0.12 --no-prompt

COPY worker-local.properties /etc/kafka-connect/worker-local.properties
COPY console-local-sink.properties /etc/kafka-connect/console-local-sink.properties
COPY questdb-local-sink.properties /etc/kafka-connect/questdb-local-sink.properties

VOLUME /storage

USER appuser

