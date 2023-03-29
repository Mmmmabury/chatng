list=`docker ps -a | grep chatng`
if [ -n "$list" ]; then
	echo 'remove chatng'
	docker stop chatng
	docker rm chatng
	# docker rmi chatng
fi
docker build -t epapa01/chatng:latest . --network host
docker push epapa01/chatng
docker run \
-p 3001:3000 \
--name chatng \
--env-file .env \
-d chatng:latest
