# App

The app is very simple it's a microservice made of a verb api a noun api and an aggregator returning a mix of the two.

```mermaid
graph TD
    subgraph Microservice_App
        A[Verb API] --> C[Aggregator]
        B[Noun API] --> C
        C --> D[Response: Mixed Verb and Noun]
    end

    subgraph Security_Elements
        direction TB
        Sec1[Kyverno: Admission and Mutation Policies] -->|Enforces Policies| API_Server
        API_Server -->|Sends Logs and Events| Sec2[Falco: Threat Detection]
        Sec2 -->|Alerts| Sec_Team[Security Team]
        
        Sec3[KubeArmor: Pod/Container Security] -->|Applies Rules| Microservice_App
        
        Sec4[Istio: Traffic Encryption & Policies]
        Sec4 -->|Secures Traffic| A
        Sec4 -->|Secures Traffic| B
        Sec4 -->|Secures Traffic| C
    end

    API_Server -->|Processes Requests| Microservice_App

```


## Kyverno

Kyverno is a policy engine designed for Kubernetes. It allows you to manage policies in a Kubernetes-native way. You can use Kyverno to validate, mutate, and generate configurations. Kyverno policies are Kubernetes resources, which means you can manage them using kubectl, GitOps tools, or any other Kubernetes-native tooling.

### Installation

```bash
helm repo add kyverno https://kyverno.github.io/kyverno/
helm repo update

helm install kyverno kyverno/kyverno --namespace kyverno --create-namespace
```

### Admission policies

The admission policies are a way to enforce policies on the cluster. For example, you can enforce that all pods have a specific label, or that all pods have a specific annotation. You can also enforce that all pods have a specific resource request or limit.

#### pod-resource-limit

This policy enforces that all pods have a resource limit set. If a pod does not have a resource limit set, the policy will reject the pod.

```yaml
apiVersion: kyverno.io/v1
kind: ClusterPolicy
metadata:
  name: require-resource-limits
spec:
  validationFailureAction: enforce
  rules:
  - name: check-resource-limits
    match:
      resources:
        kinds:
        - Pod
    validate:
      message: "Les Pods doivent définir des limites de ressources."
      pattern:
        spec:
          containers:
          - resources:
              limits:
                memory: "?*"
                cpu: "?*"
```

Here is what you see in the deployment logs when the policy is applied:

![Resource policy example log](./assets/resources.png)


### Mutation policies

Mutation policies are a way to modify resources before they are created. For example, you can use a mutation policy to add a label to all pods in a specific namespace, or to add an annotation to all pods with a specific label.

available here [default resources limits](./kyverno/mutation-add-default-ressources.yaml) and [root readonly pods](./kyverno/mutation-add-readonly.yaml)

## Falco

Falco is a runtime security tool that detects unexpected behavior in your applications. It can detect things like shell activity, file access, network activity, and more. Falco uses a set of rules to detect these behaviors, and you can write your own rules to detect custom behaviors.

### Installation

https://falco.org/docs/getting-started/falco-kubernetes-quickstart/



```bash
helm repo add falcosecurity https://falcosecurity.github.io/charts
helm repo update

helm install falco falcosecurity/falco \
  --namespace falco \
  --create-namespace \
  --set falco.jsonOutput=true \
  --set falco.logLevel=info \
  --set ebpf.enabled=true \
  --set auditLog.enabled=true
```

To make it work with kyverno I had to exclude the falco namespace from the kyverno policies.

```yaml
    exclude:
      resources:
        namespaces:
        - falco
        selector:
          matchLabels:
            app.kubernetes.io/name: falco
```

### Playing with falco

By checking the logs of the falco pod you can see the rules being loaded.

#### Check the rules

```bash
kubectl get configmap -n falco falco -o yaml
```

#### WebUI

the web ui is easy to install following this tutorial: https://falco.org/docs/getting-started/falco-kubernetes-quickstart/

## Kubearmor

Kubearmor is a runtime security tool that enforces security policies on your Kubernetes cluster. It can enforce policies like preventing containers from running as root, preventing containers from running with dangerous capabilities, and preventing containers from running with dangerous volumes.

### Installation

```bash
helm repo add kubearmor https://kubearmor.github.io/charts
helm repo update kubearmor
helm upgrade --install kubearmor-operator kubearmor/kubearmor-operator -n kubearmor --create-namespace
kubectl apply -f https://raw.githubusercontent.com/kubearmor/KubeArmor/main/pkg/KubeArmorOperator/config/samples/sample-config.yml
```

We can also install the kubearmor cli
```bash
curl -sfL http://get.kubearmor.io/ | sudo sh -s -- -b /usr/local/bin
```

### Playing with kubearmor

**Avoid apt**

We can create a policy to prevent containers from running apt commands

```yaml
apiVersion: security.kubearmor.com/v1
kind: KubeArmorPolicy
metadata:
  name: block-pkg-mgmt-tools-exec
  namespace: app # important to specify
spec:
  selector:
    matchLabels:
      app: nginx
  process:
    matchPaths:
    - path: /usr/bin/apt
    - path: /usr/bin/apt-get
  action:
    Block
```

![Can't run apt](./assets/no-apt.png)

**Block the service access-token access**

We can create a policy to prevent containers from accessing the service account token. This is a very sensitive token that should not be accessed by the application.

```yaml
apiVersion: security.kubearmor.com/v1
kind: KubeArmorPolicy
metadata:
  name: block-service-access-token-access
  namespace: app
spec:
  selector:
    matchLabels:
      app: nginx
  file:
    matchDirectories:
    - dir: /run/secrets/kubernetes.io/serviceaccount/
      recursive: true
  action:
    Block
  ```

![Avoid access token curl](./assets/unauthorized.png)

**Audit access to a file**

We first need to anotate the namespace to allow audit

```bash
kubectl annotate ns app kubearmor-visibility="process,file,network" --overwrite
```

```yaml
apiVersion: security.kubearmor.com/v1
kind: KubeArmorPolicy
metadata:
  name: audit-etc-nginx-access
  namespace: app
spec:
  selector:
    matchLabels:
      app: nginx
  file:
    matchDirectories:
    - dir: /etc/nginx/
      recursive: true  
  action:
    Audit
```

Here we can see the log of the audit on the right after I cat a file in the /etc/nginx directory.

![Audit access to /etc/nginx](./assets/audit.png)

## Istio

Istio is a service mesh that provides traffic encryption, traffic management, and security policies. 
You can use Istio to encrypt traffic between services, to manage traffic between services, and to enforce security policies on your services.

[documentation](https://istio.io/latest/docs/setup/getting-started/)

### Installation

```bash
curl -L https://istio.io/downloadIstio | sh -
cd istio-1.24.1
export PATH=$PWD/bin:$PATH
```

```bash
istioctl install -f samples/bookinfo/demo-profile-no-gateways.yaml -y
``` 

We are going to add a label to our namespace to instruct Istio to automatically inject the envoy sidecar.

Envoy is a proxy that is injected into your pods by Istio. It intercepts all incoming and outgoing traffic from your pods, and it enforces the traffic policies that you define in Istio.

```bash
kubectl label namespace app istio-injection=enabled
```

We also need to install the gateway api crd

```bash
kubectl get crd gateways.gateway.networking.k8s.io &> /dev/null || \
{ kubectl kustomize "github.com/kubernetes-sigs/gateway-api/config/crd?ref=v1.2.0" | kubectl apply -f -; }
```