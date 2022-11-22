
FROM public.ecr.aws/lambda/python:3.8 as builder

RUN yum -y install gcc gcc-c++

WORKDIR /var/task

COPY . .

RUN pip3 install datadog-lambda && \
    pip3 install -r requirements.txt

FROM public.ecr.aws/lambda/python:3.8
COPY --from=public.ecr.aws/datadog/lambda-extension:latest /opt/extensions /opt/extensions
COPY --from=builder /var/task /var/task
COPY --from=builder /var/lang/lib/python3.8/site-packages /var/lang/lib/python3.8/site-packages

RUN python3 -c "from sentence_transformers import SentenceTransformer; model = SentenceTransformer('multi-qa-mpnet-base-dot-v1'); model.save('models')"

# You can overwrite command in `serverless.yml` template
CMD ["datadog_lambda.handler.handler"]