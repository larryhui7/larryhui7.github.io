---
title: "Hamilton-Jacobi Reachability for Spacecraft Collision Avoidance"
date: 2026-05-01
draft: false
tags: ["Hamilton-Jacobi reachability", "spacecraft", "collision avoidance", "differential games", "HCW dynamics", "RTN frame", "backward reachable set", "hybrid systems", "control theory", "IEEE ICCA"]
author: ["Larry Hui", "Jordan Kam", "William Su", "Jianshu Zhou"]
description: "A Hamilton-Jacobi reachability framework for two-satellite collision avoidance in a shared circular orbit, formulated as a zero-sum differential game on planar HCW dynamics in the RTN frame. Accepted to the 20th IEEE International Conference on Control & Automation (ICCA 2026), Almaty, Kazakhstan."
summary: "Accepted to the 20th IEEE International Conference on Control & Automation (ICCA 2026), Almaty, Kazakhstan. We pose two-satellite same-orbit collision avoidance as a zero-sum differential game on planar Hill-Clohessy-Wiltshire dynamics in the RTN frame, compute backward reachable sets via the HJI PDE, and integrate them with a hybrid supervisory automaton governing nominal, evasive, and recovery modes."
cover:
  image: "images/cover.png"
  alt: "Backward reachable tubes for spacecraft collision avoidance"
  relative: true
math: true
showToc: true
disableAnchoredHeadings: false
editPost:
    URL: "/ICCA_HJ_26.pdf"
    Text: "Download Full Paper (PDF)"
---

## Publication

This work was **accepted for publication at the 20th IEEE International Conference on Control & Automation (ICCA 2026)**, held in Almaty, Kazakhstan. The full paper is available [here](/ICCA_HK_26.pdf).

+ [Conference Presentation (PDF)](/ICCA_HJ_PRESENTATION.pdf)

**Authors:** Larry Hui$^{1}$, Jordan Kam$^{2}$, William Su$^{2}$, Jianshu Zhou$^{3}$ *(Member, IEEE)*  
$^{1}$Department of Mechanical Engineering, UC Berkeley  
$^{2}$Aerospace Engineering Program, UC Berkeley  
$^{3}$Department of Mechanical Engineering, National University of Singapore  

---

## Abstract

This article presents a Hamilton-Jacobi (HJ) reachability framework for a two-satellite collision avoidance problem operating in the same circular orbit, where relative motion is modeled in the radial-tangential-normal (RTN) frame using planar Hill-Clohessy-Wiltshire (HCW) dynamics. We define the target state space as unsafe relative configurations in the orbit plane corresponding to minimum separation requirements consistent with Federal Communications Commission (FCC) orbital standards. The interaction between spacecraft is formulated as a zero-sum differential game, where Player 1 is the controlled satellite and Player 2 is modeled as a bounded adversarial disturbance with unknown intent. We present the HJ formulation and compute backward reachable sets (BRS) that characterize relative states from which collision cannot be avoided under worst-case disturbances, while states outside this set admit provably collision-free trajectories. These reachable sets are integrated with supervisory hybrid control logic to determine when evasive maneuvers must be initiated, enabling mathematically grounded safety guarantees for scalability.

---

## Introduction

Low-Earth orbit (LEO) has seen a rapid expansion of small-spacecraft operations in the same orbital regime, exemplified by constellations such as SpaceX's Starlink. With planned growth from $n \approx 8{,}000$ to $n \approx 42{,}000$ vehicles, the centralized, human-in-the-loop architectures used in today's space traffic management (STM) are unlikely to scale, motivating automated safety layers that can deconflict in-orbit operations without a single point of authority. When a controlled satellite must reason about an uncooperative neighbor whose intent is unknown, *safe autonomy* is needed to bound worst-case behavior. Formal methods such as **reachability analysis** and **differential game formulations** offer the right tools: they characterize unsafe regions of state space and synthesize provably safe behaviors for collision avoidance.

---

## Related Work

HJ reachability is a formal methodology for guaranteeing safety in dynamical systems under bounded uncertainty. Safety is cast as a differential game between a controlled system and adversarial disturbances; the **backward reachable set (BRS)** is computed via a Hamilton-Jacobi-Isaacs (HJI) PDE whose viscosity solution characterizes all states that can be driven to an unsafe condition under worst-case disturbance. The BRS approach has been widely adopted in air traffic management (e.g., loss-of-separation detection), automated aerial refueling, and other proximity operations, where reachable sets characterize safe relative configurations under bounded disturbances and inform supervisory decisions and hybrid maneuver execution.

In LEO, relative motion between spacecraft is conventionally expressed in the **RTN frame** and locally approximated by the linear **HCW** equations. Compared to aircraft, spacecraft suffer from limited control authority and propellant constraints, and large altitude changes are typically infeasible without mission impact. Building on prior efforts that applied HJ reachability to rendezvous/proximity operations, this work formulates a two-satellite same-orbit collision avoidance problem as a differential game in the HCW/RTN frame.

---

## Methodology

We consider a controlled satellite (**Player 1**) operating in proximity to a secondary or uncooperative satellite (**Player 2**) within the same circular orbit. Relative motion is expressed in the RTN frame and approximated using planar HCW dynamics. The state is

$$
X = [x,\, y,\, \dot{x},\, \dot{y}]^{\top} \in \mathbb{R}^{4},
$$

where $x$ is tangential displacement and $y$ is radial separation. Player 1 has bounded control accelerations $u \in \mathcal{U}$; Player 2's unknown intent is modeled as a bounded adversarial disturbance $d \in \mathcal{D}$. We define a target set $\mathcal{T} \subset \mathcal{X}$ representing unsafe orbital separations consistent with FCC minimum-separation standards, and compute the BRS — all initial states from which collision cannot be avoided despite optimal evasive control.

### Satellite Model

Starting from the restricted three-body problem and treating the chase and target masses as infinitesimal relative to the central body, the relative-motion equations linearize to the planar HCW form. With out-of-plane motion decoupled and omitted (we restrict attention to in-plane same-orbit encounters), the unforced HCW equations are

$$
\begin{cases}
\ddot{x} + 2\omega\,\dot{y} = 0, \\
\ddot{y} - 2\omega\,\dot{x} - 3\omega^{2}\, y = 0.
\end{cases}
$$

The planar HCW model is appropriate for illustrating the proposed scenario in a locally linear same-orbit encounter, but it omits out-of-plane motion, secular perturbations such as $J_{2}$, and nonlinear orbital effects. The computed reachable sets should therefore be interpreted as formal guarantees with respect to this adopted planar linearized model; extending the framework to 3D relative motion is a natural next step for practical deployment.

In state-space form, with control $u = [u_x, u_y]^\top \in \mathcal{U}$ and disturbance $d = [d_x, d_y]^\top \in \mathcal{D}$, the system $\dot{X} = A X + B_u u + B_d d$ reads

$$
\dot{X} = f(X,u,d) =
\begin{bmatrix}
\dot{x} \\[2pt]
\dot{y} \\[2pt]
-2\omega\,\dot{y} + u_{x} + d_{x} \\[2pt]
\;\;2\omega\,\dot{x} + 3\omega^{2}\, y + u_{y} + d_{y}
\end{bmatrix}.
$$

Because the safety criteria depend purely on relative position (the FCC keep-out distance), the output is $Y = [x,\,y]^{\top}$.

### Hybrid System Model

Player 1 is governed by a hybrid automaton with operational modes
$\mathcal{Q} = \{q_\text{nom}, q_\text{eva}, q_\text{ret}\}$:

- $q_\text{nom}$ — nominal station-keeping / orbiting,
- $q_\text{eva}$ — active collision-avoidance maneuver,
- $q_\text{ret}$ — trajectory recovery.

Mode transitions are state-dependent and autonomous:

$$
\begin{aligned}
q_\text{nom} \rightarrow q_\text{eva} &:\; X \in \partial \mathcal{G}(\tau),\\
q_\text{eva} \rightarrow q_\text{ret} &:\; X \in \mathcal{X}_\text{safe},\\
q_\text{ret} \rightarrow q_\text{nom} &:\; X \in \mathcal{G}_{0}^{\text{rec}},\; |\dot{x}| \le \varepsilon_{x},\; |\dot{y}| \le \varepsilon_{y},
\end{aligned}
$$

where $\mathcal{G}(\tau)$ is the unsafe BRS over horizon $\tau$, $\mathcal{X}_\text{safe} \subset \mathcal{X} \setminus \mathcal{G}(\tau)$ is a recovered safe region, and $\mathcal{G}_{0}^{\text{rec}}$ is the recovery target. The **boundary of the BRS thus serves as the critical switching surface** that determines when nominal operation must be abandoned in favor of evasive control.

### Control Law Design

Continuous thrust is applied through $u_x$ and $u_y$. We use simple **PD control** to drive Player 1 to desired states:

$$
\begin{aligned}
u_{x} &= -k_{p,x}(x - x_{f}) - k_{d,x}(\dot{x} - \dot{x}_{f}), \\
u_{y} &= -k_{p,y}(y - y_{f}) - k_{d,y}(\dot{y} - \dot{y}_{f}),
\end{aligned}
$$

with thrust saturation $u_{x}, u_{y} \in [-u_{\max}, u_{\max}]$. An integral term is omitted because the LEO environment lacks the constant external disturbances that would otherwise produce steady-state errors.

When a safety violation is imminent, the automaton transitions $q_\text{nom} \to q_\text{eva}$, and one of four evasive escape modes is selected based on relative geometry — mapping directly to standard **V-bar** and **R-bar** maneuvers:

1. **Mode 1** — Player 1 climbs to a higher altitude (positive radial), naturally drifting backward relative to Player 2.
2. **Mode 2** — Player 1 drops to a lower altitude (negative radial), naturally accelerating forward relative to Player 2.
3. **Mode 3** — Pure tangential braking to fall behind Player 2 at the same altitude.
4. **Mode 4** — Pure tangential acceleration to get ahead of Player 2 at the same altitude.

---

## HJ Reachability Formulation

We define the target set implicitly as the sublevel set of a continuous function $\phi_{0}: \mathbb{R}^{4} \to \mathbb{R}$:

$$
\mathcal{G}_{0} = \{X \in \mathbb{R}^{4} \mid \phi_{0}(X) \le 0\}.
$$

For the same-orbit collision problem, the unsafe target set is a hard physical keep-out disk around Player 2, based on the FCC minimum separation $d_{\text{FCC}}$:

$$
\mathcal{G}_{0} = \{X \in \mathbb{R}^{4} \mid x^{2} + y^{2} \le d_{\text{FCC}}^{\,2}\}.
$$

Letting $\xi_{X,T}^{u,d}(t)$ denote the trajectory from initial state $X$ under inputs $u$ and $d$, and using only a terminal cost (propellant cost is secondary during emergency evasion), the optimal value function is

$$
\phi(X,T) = \inf_{u \in \mathcal{U}} \sup_{d \in \mathcal{D}} \min_{t \in [0,T]} \phi_{0}\left(\xi_{X,T}^{u,d}(t)\right).
$$

The sublevel set $\{X : \phi(X,T) \le 0\}$ defines the BRS — the set of initial relative states from which Player 2 can force a collision despite Player 1's optimal evasive action.

The Hamiltonian and the **HJI PDE** governing $\phi$ are

$$
\mathcal{H}(X,\nabla\phi) = \min_{u \in \mathcal{U}} \max_{d \in \mathcal{D}} \langle f(X,u,d),\, \nabla\phi \rangle,
$$

with the PDE

$$
\frac{\partial \phi}{\partial t} + \mathcal{H}(X,\nabla\phi) = 0,
\quad \phi(X,0) = \phi_{0}(X).
$$

To compute the **Backward Reachable Tube (BRT)** — the set of states that *ever* enter $\mathcal{G}_{0}$ during the horizon — we use the variational inequality

$$
\min\!\left( \frac{\partial \phi}{\partial t} + \mathcal{H}(X,\nabla\phi),\; \phi_{0}(X) - \phi(X,t) \right) = 0.
$$

The disturbance set for Player 2 is

$$
\mathcal{D} = \{ d \in \mathbb{R}^{2} \mid d_{x} \in [d_{x,\min}, d_{x,\max}],\; d_{y} \in [d_{y,\min}, d_{y,\max}] \}.
$$

This bounded-disturbance formulation yields *worst-case* safety guarantees but is conservative — every admissible disturbance is allowed regardless of likelihood — so the computed BRS may overapproximate the practically unsafe set.

---

## Numerical Implementation

Analytical solutions to the HJI PDE are generally intractable, so we compute BRS using a modified Level Set Methods Toolbox. The continuous 4D state space of the planar HCW model is discretized into a multidimensional grid, and each node stores a scalar value-function estimate. Because grid-based level-set methods scale exponentially in state-space dimension, grid resolution must balance the fidelity of the safety guarantee against computational tractability.

For larger constellations, several extensions are possible:

- **Decomposition / pairwise approximations** so local relative-motion games are solved only for nearby vehicles rather than over a joint multi-agent state.
- **Adaptive or non-uniform gridding** that concentrates resolution near the target set and BRS boundary, where accuracy is most safety-critical.
- **Surrogate / learned value-function representations** to accelerate online evaluation while retaining offline-computed safety structure.

These are practical paths to scaling the framework beyond the present 4D planar setting.

### Capture Sets & Simulation Setup

For the simulation results, the mean motion of the reference LEO circular orbit is set to $\omega = 0.0011$ rad/s (≈ 500 km altitude). Control accelerations are symmetric, $u_x, u_y \in [-0.1,\,0.1]\,\text{m/s}^2$, and Player 2's adversarial disturbance is strictly below Player 1's authority, capped at $[-0.05,\,0.05]\,\text{m/s}^2$. PD controller gains are:

| Parameter | Symbol | Nominal/Recovery | Evasive | Units |
| :--- | :---: | :---: | :---: | :---: |
| Tangential P Gain | $k_{p,x}$ | $1.0\times 10^{-4}$ | $5.0\times 10^{-4}$ | $\mathrm{s^{-2}}$ |
| Radial P Gain     | $k_{p,y}$ | $1.0\times 10^{-4}$ | $5.0\times 10^{-4}$ | $\mathrm{s^{-2}}$ |
| Tangential D Gain | $k_{d,x}$ | $2.0\times 10^{-2}$ | $4.4\times 10^{-2}$ | $\mathrm{s^{-1}}$ |
| Radial D Gain     | $k_{d,y}$ | $2.0\times 10^{-2}$ | $4.4\times 10^{-2}$ | $\mathrm{s^{-1}}$ |

For recovery transitions ($q_\text{ret} \to q_\text{nom}$) at a 1000 m tangential standoff, the target set is the 4D bounding box

$$
\mathcal{G}_{0} =
\begin{cases}
x \in [950,\, 1050] \\
y \in [-25,\, 25] \\
\dot{x} \in [-0.01,\, 0.01] \\
\dot{y} \in [-0.01,\, 0.01]
\end{cases}.
$$

---

## Conclusion

This article presents an HJ reachability framework for decentralized spacecraft collision avoidance that integrates formal safety verification with hybrid supervisory control. By modeling relative motion in the RTN frame with planar HCW dynamics and formulating spacecraft interactions as a zero-sum differential game under bounded disturbances, BRS rigorously characterize unsafe relative configurations and define the set of states from which collision cannot be avoided, while states outside this boundary admit provably collision-free trajectories. The reachable sets are embedded in a hybrid automaton governing nominal, evasive, and recovery modes, enabling mathematically grounded supervisory decisions for collision avoidance initiation and ensuring safe maneuver execution under worst-case uncertainty in the behavior of an uncooperative spacecraft.

**Future work** will extend the framework to full 3D relative motion to capture out-of-plane dynamics, secular perturbations such as $J_{2}$, and nonlinear orbital effects; investigate scalable approximations and decomposition techniques to mitigate the curse of dimensionality; and explore less conservative uncertainty descriptions, including probabilistic and adaptive disturbance models.

---

## Citation

If you use this work, please cite:

```bibtex
@inproceedings{hui2026hjreachability,
  title     = {Hamilton--Jacobi Reachability for Spacecraft Collision Avoidance},
  author    = {Hui, Larry and Kam, Jordan and Su, William and Zhou, Jianshu},
  booktitle = {Proceedings of the 20th IEEE International Conference on Control \& Automation (ICCA)},
  year      = {2026},
  address   = {Almaty, Kazakhstan},
  publisher = {IEEE}
}
```
