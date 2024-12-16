#!/bin/bash

docker build web -t web
docker save web:latest -o web.tar
sudo k3s ctr images import web.tar

kubectl -n app delete deployment web-deployment
kubectl -n app delete svc web-service

kubectl apply -f kube/web

echo "[X]  Build and imported web image"

docker build api-verbs -t verbs
docker save verbs:latest -o verbs.tar
sudo k3s ctr images import verbs.tar

kubectl -n app delete deployment verbs-deployment
kubectl -n app delete svc verbs-service

kubectl apply -f kube/verbs

echo "[X]  Build and imported verbs image"  

docker build api-nouns -t nouns
docker save nouns:latest -o nouns.tar
sudo k3s ctr images import nouns.tar

kubectl -n app delete deployment nouns-deployment
kubectl -n app delete svc nouns-service

kubectl apply -f kube/nouns

echo "[X]  Build and imported nouns image"  


docker build aggregator -t aggregator
docker save aggregator:latest -o aggregator.tar
sudo k3s ctr images import aggregator.tar

kubectl -n app delete deployment aggregator-deployment
kubectl -n app delete svc aggregator-service

kubectl apply -f kube/aggregator

echo "[X]  Build and imported web image"
