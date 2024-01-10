#!/bin/sh

temporal server start-dev --ip 0.0.0.0 &

# Function to check if Temporal is ready
check_temporal_ready() {
    # Execute the Temporal health check command
    temporal operator cluster health

    # Return the exit status of the health check command
    return $?
}

# Wait for Temporal server to be ready
echo "Waiting for Temporal server to be ready..."
until check_temporal_ready; do
    printf '.'
    sleep 1
done
echo "Temporal server is ready."

# Run Temporal setup command
temporal operator search-attribute create --name TenantId --type Text --namespace default

# Keep the container running after setup
# (This could be tailing logs or just a sleep loop)
tail -f /dev/null
