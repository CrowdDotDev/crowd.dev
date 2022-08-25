FROM public.ecr.aws/lambda/python:3.8 as builder

RUN yum -y install gcc gcc-c++ postgresql-devel 

WORKDIR /var/task

COPY . .

RUN  pip3 install psycopg2-binary && \
     pip3 install datadog-lambda && \
     pip3 install -r requirements.txt && \
     pip3 install -r requirements.dev.txt

FROM public.ecr.aws/lambda/python:3.8
RUN yum -y install openldap

COPY --from=public.ecr.aws/datadog/lambda-extension:latest /opt/extensions /opt/extensions
COPY --from=builder /var/task /var/task
COPY --from=builder /var/lang/lib/python3.8/site-packages /var/lang/lib/python3.8/site-packages
COPY --from=builder /usr/lib64/libpq.so.5 /usr/lib64/libpq.so.5

# You can overwrite command in `serverless.yml` template
CMD ["datadog_lambda.handler.handler"]