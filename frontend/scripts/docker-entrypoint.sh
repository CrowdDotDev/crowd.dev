#!/usr/bin/env bash

JS_DESTINATION="/etc/nginx/html/assets/*.js"
HTML_DESTINATION="/etc/nginx/html/index.html"

declare -a ENV_VARIABLES=(
  "VUE_APP_FRONTEND_HOST"
  "VUE_APP_FRONTEND_PROTOCOL"
  "VUE_APP_BACKEND_URL"
  "VUE_APP_WEBSOCKETS_URL"
  "VUE_APP_STRIPE_PUBLISHABLE_KEY"
  "VUE_APP_GITHUB_INSTALLATION_URL"
  "VUE_APP_DISCORD_INSTALLATION_URL"
  "VUE_APP_CUBEJS_URL"
  "VUE_APP_CONVERSATIONS_PUBLIC_URL"
  "VUE_APP_EDITION"
  "VUE_APP_COMMUNITY_PREMIUM"
  "VUE_APP_SEGMENT_KEY"
  "VUE_APP_PENDO_KEY"
  "VUE_APP_HOTJAR_KEY"
  "VUE_APP_ENV"
  "VUE_APP_NANGO_URL"
  "VUE_APP_FORMBRICKS_URL"
  "VUE_APP_FORMBRICKS_ENVIRONMENT_ID"
  "VUE_APP_STRIPE_GROWTH_PLAN_PAYMENT_LINK"
  "VUE_APP_STRIPE_EAGLE_EYE_PLAN_PAYMENT_LINK"
  "VUE_APP_STRIPE_CUSTOMER_PORTAL_LINK"
  "VUE_APP_UNLEASH_URL"
  "VUE_APP_UNLEASH_API_KEY"
  "VUE_APP_SAMPLE_TENANT_ID"
  "VUE_APP_SAMPLE_TENANT_TOKEN"
  "VUE_APP_IS_GIT_ENABLED"
  "VUE_APP_AUTH0_DOMAIN"
  "VUE_APP_AUTH0_CLIENT_ID"
  "VUE_APP_AUTH0_DATABASE"
  "VUE_APP_LF_TENANT_ID"
  "VUE_APP_IS_GROUPSIO_ENABLED"
  "VUE_APP_IS_TWITTER_ENABLED"
  "VUE_APP_DATADOG_RUM_APPLICATION_ID"
  "VUE_APP_DATADOG_RUM_CLIENT_TOKEN"
)

for ENV_VAR in "${ENV_VARIABLES[@]}"
do
  echo "Replacing CROWD_$ENV_VAR with '${!ENV_VAR}' in $JS_DESTINATION and $HTML_DESTINATION!"
  _SED_SPECIAL_CHARS_ESCAPED=$(printf '%s\n' "${!ENV_VAR}" | sed -e 's/[\/&]/\\&/g')

  sed -i "s|CROWD_$ENV_VAR|${_SED_SPECIAL_CHARS_ESCAPED}|g" ${JS_DESTINATION}
  sed -i "s|CROWD_$ENV_VAR|${_SED_SPECIAL_CHARS_ESCAPED}|g" ${HTML_DESTINATION}
done

echo "Starting Nginx!"
nginx -g "daemon off;"
