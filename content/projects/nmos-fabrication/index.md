---
title: "NMOS Chip Fabrication" 
date: 2025-11-01
tags: ["microfabrication","NMOS","semiconductor","MOSFET"]
author: ["Larry Hui", "Arhaan Aggarwal", "Emerson Hsieh"]
description: "Step-by-step fabrication of a ⟨100⟩ silicon wafer containing MOSFETs, ring oscillators, comb drives, and cantilever arrays. Completed for EE 143 at UC Berkeley." 
summary: "Hands-on NMOS fabrication lab covering field oxidation, photolithography, polysilicon deposition, doping, and metallization on a ⟨100⟩ silicon wafer." 
cover:
    image: "wafer.png"
    alt: "NMOS Chip Fabrication"
    relative: true
showToc: true
---

##### Download

+ [Full Lab Report (PDF)](/E143_Lab_Report_1.pdf)

---

## Summary

This project was done for EE143 at the University of California at Berkeley and outlines the step-by-step fabrication process of a ⟨100⟩ silicon wafer containing several learning integrated circuits (ICs). Specifically, we fabricated MOSFETs, ring oscillators, comb drives, cantilever arrays, and a heater platform on our wafer. In making these components, we learned to carry out major microfabrication techniques with precision. Our production sequence consisted of nine steps: field oxidation, active-area photolithography and etching, gate oxidation, polysilicon deposition, gate photolithography and etching, source and drain doping, dopant drive-in and intermediate oxidation, contact-hole photolithography, metallization, and metallization photolithography and etching. These steps form the foundation of modern chip manufacturing, and learning them was both rewarding and enjoyable.

Dry and wet oxidation were used to form insulating layers, and successive photolithography steps patterned the active devices, gate regions, contact openings, and metal routing. A combination of wet and dry etching sculpted the film geometries, followed by thermal evaporation to deposit the aluminum metallization. After each major step, we characterized oxide thickness, sheet resistance, and mask alignment to track how the fabrication sequence altered the wafer. The process demonstrated good fidelity, with only minor over-etching and slight misalignments. During the photolithography steps, there were instances where we had to re-apply photoresist when the coating did not spread evenly. Mask alignment was also not perfect, though we did our best to minimize errors.

Overall, the workflow proceeded smoothly: the same wafer was used from start to finish without shattering, the critical dimensions were met, and the resulting electrical behavior aligned well with expectations. Most deviations remained below 10%, indicating negligible impact from our handling. We learned that microfabrication demands both precision and patience. Tuning the HF etch time required experimentation since we had no means of in-situ monitoring, but ultimately produced satisfactory results when etching the field oxide. 

---

## Experimental Details

### Major Fabrication Steps

| Step | Process | Description |
|:----:|:--------|:------------|
| 1 | Field Oxidation | Thermal oxidation to grow thick SiO₂ isolation layer |
| 2 | Active-Area Photolithography & Etching | Pattern and etch to define active device regions |
| 3 | Gate Oxidation | Thin oxide growth for gate dielectric |
| 4 | Polysilicon Deposition | LPCVD polysilicon for gate electrode |
| 5 | Gate Photolithography & Etching | Pattern gate structures |
| 6 | Source/Drain Doping | Ion implantation or diffusion doping |
| 7 | Dopant Drive-in & Intermediate Oxidation | Thermal activation and passivation |
| 8 | Contact-Hole Photolithography | Open vias to source, drain, and gate |
| 9 | Metallization & Patterning | Aluminum deposition and routing |

### Table of Measured Values

| Parameter | Target | Measured | Deviation |
|:----------|:------:|:--------:|:---------:|
| Field Oxide Thickness | 500 nm | — | — |
| Gate Oxide Thickness | 50 nm | — | — |
| Polysilicon Thickness | 400 nm | — | — |
| Sheet Resistance (n⁺) | — Ω/□ | — | — |
| Metal Thickness | 1 μm | — | — |

*Fill in your measured values above.*

### Microscope Images

<!-- Add your microscope images here -->
<!-- ![Active Area](active_area.png) -->
<!-- ![Gate Structure](gate.png) -->
<!-- ![Contact Holes](contacts.png) -->
<!-- ![Final Metallization](metal.png) -->

*Add microscope images of your wafer at various fabrication stages.*

---

## Theoretical Calculations

### Oxide Thickness

The Deal-Grove model describes thermal oxidation kinetics:

$$x_{ox}^2 + A \cdot x_{ox} = B(t + \tau)$$

where $x_{ox}$ is oxide thickness, $B$ is the parabolic rate constant, and $B/A$ is the linear rate constant.

### Dopant Diffusion

The dopant profile follows Gaussian or complementary error function distributions depending on the source conditions:

$$C(x,t) = \frac{Q}{\sqrt{\pi D t}} \exp\left(-\frac{x^2}{4Dt}\right)$$

where $D$ is the diffusion coefficient and $Q$ is the dose.

### Plots

<!-- Add your plots here -->
<!-- ![Oxide Growth vs Time](oxide_plot.png) -->
<!-- ![Dopant Profile](dopant_profile.png) -->

*Include plots of oxide thickness vs. time and dopant concentration profiles.*

### Aluminum Metallization

Aluminum was deposited via thermal evaporation at a thickness of approximately 1 μm. The step coverage and contact resistance were characterized post-deposition.

### Doping Summary

| Region | Dopant | Type | Target Concentration |
|:-------|:------:|:----:|:--------------------:|
| Substrate | Boron | p-type | ~10¹⁵ cm⁻³ |
| Source/Drain | Phosphorus | n⁺ | ~10²⁰ cm⁻³ |
| Polysilicon Gate | Phosphorus | n⁺ | ~10²⁰ cm⁻³ |

---

## Process Deviations

During fabrication, several deviations from ideal processing were observed:

1. **Photoresist Coating**: In some photolithography steps, the photoresist did not spread evenly on the first application, requiring re-spin and recoating.

2. **Mask Alignment**: Minor misalignment occurred between successive mask layers. While we minimized errors through careful adjustment, sub-micron precision was challenging to achieve.

3. **HF Etch Time**: Without in-situ monitoring, the HF etch time for field oxide removal required iterative experimentation. Initial attempts resulted in slight over-etching in some regions.

4. **Oxide Thickness Variation**: Measured oxide thicknesses showed minor variation across the wafer, likely due to temperature non-uniformity in the furnace.

Despite these deviations, the overall process yielded functional devices with electrical characteristics within acceptable tolerances (most deviations < 10%).
