#!/bin/bash

# Install the app

./deploy.sh

# Falco

helm repo add falcosecurity https://falcosecurity.github.io/charts
helm repo update

helm install falco falcosecurity/falco \
  --namespace falco \
  --create-namespace \
  --set falco.jsonOutput=true \
  --set falco.logLevel=info \
  --set ebpf.enabled=true \
  --set auditLog.enabled=true

kubectl apply -f ./falco

# Istio

istioctl install -f istio/demo-profile-no-gateways.yaml  -y

kubectl label namespace app istio-injection=enabled

kubectl get crd gateways.gateway.networking.k8s.io &> /dev/null || \
{ kubectl kustomize "github.com/kubernetes-sigs/gateway-api/config/crd?ref=v1.2.0" | kubectl apply -f -; }

kubectl apply -f ./istio/

## Kiali

kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.24/samples/addons/kiali.yaml
kubectl apply -f https://raw.githubusercontent.com/istio/istio/release-1.24/samples/addons/prometheus.yaml --namespace istio-system

### Make sure  you portforward kiali to see the interface

# Kyverno

helm repo add kyverno https://kyverno.github.io/kyverno/
helm repo update

helm install kyverno kyverno/kyverno --namespace kyverno --create-namespace

kubectl apply -f kyverno

