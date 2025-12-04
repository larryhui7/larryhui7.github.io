---
title: "FLOW Lab Research" 
<<<<<<< HEAD
date: 2024-01-01
=======
date: 2023-01-01
>>>>>>> 3ae1b75da0bca2b0ca9f08841f04317c42bdef28
tags: ["fluid dynamics","experimental fluid mechanics","FLOW lab","multiphase flows","turbulence","experimental research"]
author: ["Larry Hui", "Simo Makiharju"]
description: "Research in the FLOW (Fluid Laboratory for Optimization and Waves) lab focusing on experimental fluid dynamics and multiphase flows."
summary: "Research in the FLOW (Fluid Laboratory for Optimization and Waves) lab focusing on experimental fluid dynamics and multiphase flows."
cover:
<<<<<<< HEAD
    image: "flow_loop.png"
=======
    image: "flow.png"
    alt: "FLOW lab experimental flow loop apparatus"
>>>>>>> 3ae1b75da0bca2b0ca9f08841f04317c42bdef28
    relative: true
editPost:
    URL: "https://github.com/larryhui7/larryhui7.github.io"
    Text: "GitHub repository"
showToc: true
disableAnchoredHeadings: false

---

## Overview

This research is conducted in the [FLOW (Fluid Laboratory for Optimization and Waves) lab](https://me.berkeley.edu/people/simo-makiharju/) under the supervision of [Professor Simo Makiharju](https://me.berkeley.edu/people/simo-makiharju/) at UC Berkeley. The FLOW lab focuses on experimental fluid dynamics, multiphase flows, turbulence, and wave-structure interactions. Our work involves experimental measurements, data analysis, and understanding complex fluid phenomena.

---

## Research Areas

+ Experimental Fluid Dynamics: [data](https://github.com/larryhui7)
+ Multiphase Flow Measurements: [data](https://github.com/larryhui7)
+ Turbulence Analysis: [data](https://github.com/larryhui7)
+ Wave-Structure Interactions: [data](https://github.com/larryhui7)

---

## Experimental Setup

The FLOW lab utilizes advanced measurement techniques including Particle Image Velocimetry (PIV), Laser Doppler Velocimetry (LDV), and high-speed imaging to characterize fluid flows. Experimental facilities include water tunnels, wind tunnels, and specialized test rigs for multiphase flow studies.

---

## Data Analysis Methods

### Processing experimental data:

Experimental measurements are processed to extract flow characteristics and validate theoretical models.

```python
import numpy as np
import pandas as pd
import matplotlib.pyplot as plt
```

### Load experimental data:

Velocity and pressure measurements from PIV and pressure transducers are loaded for analysis.

```python
file_path = 'flow_data.csv'
data = pd.read_csv(file_path)
```

### Extract flow statistics:

Key flow statistics including mean velocity, turbulence intensity, and Reynolds stress are computed.

```python
# Mean velocity
u_mean = data['velocity'].mean()
v_mean = data['velocity_y'].mean()

# Turbulence intensity
u_rms = data['velocity'].std()
turbulence_intensity = u_rms / u_mean

# Reynolds stress
reynolds_stress = np.mean((data['velocity'] - u_mean) * (data['velocity_y'] - v_mean))
```

#### Spectral Analysis:

Frequency domain analysis reveals flow structures and dominant frequencies.

```python
from scipy import signal

# Power spectral density
frequencies, psd = signal.welch(data['velocity'], fs=sample_rate, nperseg=1024)

# Plot spectrum
plt.semilogy(frequencies, psd)
plt.xlabel('Frequency (Hz)')
plt.ylabel('Power Spectral Density')
plt.title('Velocity Spectrum')
```

#### Visualization:

Flow visualization techniques help understand complex flow patterns.

```python
# Velocity vector field
plt.quiver(data['x'], data['y'], data['velocity'], data['velocity_y'])
plt.xlabel('x position')
plt.ylabel('y position')
plt.title('Velocity Vector Field')
```

---

## Experimental Parameters

| Parameter |   Value   |  Measurement  | Application |           Description            |
| :-------: | :-------: | ------------- | :---------: | :------------------------------: |
|  $Re$ |   $10^4 - 10^6$   | Dimensionless |  Flow regime  |         Reynolds number          |
|  $U$ |   $0.1 - 10$   | m/s     |  Velocity scale  |       Mean flow velocity       |
|  $\nu$ |   $10^{-6}$ | m²/s    |  Fluid property  |      Kinematic viscosity       |
|  $\rho$ | $1000$ | kg/m³    |  Fluid property  | Fluid density |
|  $f_{sample}$ |   $1 - 10$ kHz   | Hz |  Data acquisition  |         Sampling frequency          |
|  $\Delta t$ |  $10^{-4} - 10^{-3}$  | s |  Temporal resolution  |         Time step         |

