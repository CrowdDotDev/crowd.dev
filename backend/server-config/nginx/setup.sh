# Install nginx configuration and restart the service if test passes

cp anton* default /etc/nginx/sites-available/

nginx -t
if [ $? -eq 0 ]; then
    echo "Passed nginx test, restarting"
else
    echo "Failed nginx test, not restarting"
    exit 1
fi

systemctl restart nginx

