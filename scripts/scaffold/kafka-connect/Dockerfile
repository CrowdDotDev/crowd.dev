FROM confluentinc/cp-kafka-connect:7.8.0-2-ubi8

USER root

RUN yum install -y jq findutils unzip

RUN confluent-hub install snowflakeinc/snowflake-kafka-connector:2.5.0 --no-prompt
RUN confluent-hub install questdb/kafka-questdb-connector:0.12 --no-prompt

VOLUME /storage

USER appuser

