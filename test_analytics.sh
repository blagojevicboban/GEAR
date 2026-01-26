
# 1. Log Telemetry (Simulate a student looking at a model)
echo "Logging telemetry..."
curl -X POST http://localhost:3001/api/analytics/log \
  -H "Content-Type: application/json" \
  -d '{"logs": [{"userId": "student1", "lessonId": "lesson1", "modelId": "model-1", "position": {"x":0,"y":0,"z":0}, "target": {"x":0.5,"y":0.5,"z":0}, "duration": 2000}]}'

echo -e "\n\n"

# 2. Fetch Heatmap
echo "Fetching heatmap..."
curl http://localhost:3001/api/analytics/heatmap/model-1
