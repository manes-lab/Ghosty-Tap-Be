sudo pkill -f "pomelo\|node.*app\.js"
sleep 1
for port in 3005 3050 4050 6050 7050 8050; do
sudo kill -9 $(lsof -ti:$port) 2>/dev/null || true
done
echo "清理完成，现在可以重新启动"