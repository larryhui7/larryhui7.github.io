---
title: "Physics-Informed Neural Networks (PINNs) for Fluid-Solid Interactions" 
date: 2024-01-01
tags: ["PINNs","physics-informed neural networks","fluid-solid interactions","machine learning","computational mechanics","MATLAB","GNN","PDE solvers"]
author: ["Larry Hui", "Grace X. Gu"]
description: "Research on implementing Physics-Informed Neural Networks (PINNs) and Mesh Graph Networks (MGNs) for solving fluid-solid interaction problems."
summary: "Research on implementing Physics-Informed Neural Networks (PINNs) and Mesh Graph Networks (MGNs) for solving fluid-solid interaction problems."
editPost:
    URL: "https://github.com/larryhui7/larryhui7.github.io"
    Text: "GitHub repository"
showToc: true
disableAnchoredHeadings: false

---

## Overview

This research focuses on implementing [Physics-Informed Neural Networks (PINNs)](https://www.sciencedirect.com/science/article/pii/S0021999118307125) and Mesh Graph Networks (MGNs) in MATLAB for solving partial differential equations (PDEs) related to fluid-solid interactions. We are also reviewing differentiable Graph Neural Network (GNN)-based PDE solvers as they relate to fluid-solid interactions. This work is conducted under the supervision of [Professor Grace X. Gu](https://me.berkeley.edu/people/grace-x-gu/) at UC Berkeley.

---

## Research Components

+ PINN Implementation in MATLAB: [code](https://github.com/larryhui7)
+ MGN Implementation: [code](https://github.com/larryhui7)
+ Differentiable GNN-based PDE Solvers: [code](https://github.com/larryhui7)
+ Fluid-Solid Interaction Datasets: [data](https://github.com/larryhui7)

---

## Background

Physics-Informed Neural Networks combine the power of deep learning with the constraints of physical laws. By incorporating PDEs directly into the loss function, PINNs can learn solutions that satisfy both data and physics constraints. This approach is particularly valuable for fluid-solid interaction problems where traditional numerical methods can be computationally expensive.

---

## Methodology

### Setting up the PINN:

The Physics-Informed Neural Network architecture incorporates both data-driven and physics-driven loss terms.

```matlab
% Initialize neural network
layers = [
    featureInputLayer(inputSize)
    fullyConnectedLayer(50)
    tanhLayer()
    fullyConnectedLayer(50)
    tanhLayer()
    fullyConnectedLayer(outputSize)
];
net = dlnetwork(layers);
```

### Define physics loss:

The physics loss enforces the PDE constraints at collocation points throughout the domain.

```matlab
function loss = physicsLoss(net, x_colloc, pde_params)
    % Evaluate network at collocation points
    u_pred = forward(net, x_colloc);
    
    % Compute PDE residuals
    residual = computePDEresidual(u_pred, x_colloc, pde_params);
    
    % Physics loss
    loss = mean(residual.^2);
end
```

### Training the network:

The training process minimizes both data and physics losses simultaneously.

```matlab
% Combined loss function
function totalLoss = combinedLoss(net, x_data, u_data, x_colloc, pde_params)
    % Data loss
    u_pred_data = forward(net, x_data);
    dataLoss = mean((u_pred_data - u_data).^2);
    
    % Physics loss
    physicsLoss = physicsLoss(net, x_colloc, pde_params);
    
    % Total loss
    totalLoss = dataLoss + lambda * physicsLoss;
end
```

#### Graph Neural Network PDE Solvers:

For differentiable GNN-based approaches, we construct graph representations of the computational domain.

```matlab
% Build graph structure
function G = buildGraph(mesh)
    nodes = mesh.nodes;
    edges = mesh.edges;
    G = graph(edges(:,1), edges(:,2));
    G.Nodes.X = nodes;
end
```

#### Mesh Graph Networks:

MGNs operate on mesh-based representations, allowing for adaptive refinement and efficient computation.

```matlab
% MGN forward pass
function u_pred = mgnForward(mesh, features, net)
    % Extract mesh features
    mesh_features = extractMeshFeatures(mesh);
    
    % Combine with input features
    combined_features = [features, mesh_features];
    
    % Forward through network
    u_pred = forward(net, combined_features);
end
```

---

## Simulation Parameters

| Parameter |   Value   |  Domain  | Application |           Description            |
| :-------: | :-------: | -------- | :---------: | :------------------------------: |
|  $\lambda$ |   $0.1$   | Fluid    |  PINN loss  |         Physics loss weight      |
|  $\nu$ |   $10^{-6}$   | Fluid     |  Navier-Stokes  |       Kinematic viscosity       |
|  $\rho$ |   $1000$ | Fluid    |  Navier-Stokes  |      Fluid density       |
|  $E$ | $2 \times 10^9$ | Solid    |  Elasticity  | Young's modulus |
|  $\nu_s$ |   $0.3$   | Solid |  Elasticity  |         Poisson's ratio          |
|  $N_{colloc}$ |  $10^4$  | Domain |  Training  |         Number of collocation points         |
