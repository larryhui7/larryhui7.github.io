"""The demo pages and the simulation behind each one.

Paper: J. Cortés, S. Martínez, T. Karatas and F. Bullo, "Coverage control for
mobile sensing networks", IEEE Trans. Robotics and Automation 20(2), 243-255,
2004. DOI 10.1109/TRA.2004.824698. METHODS.md has the numerical details.

Where each demo from the paper is implemented
---------------------------------------------
page id         in the paper                               code
lloyd           Sec. III-B, Prop. 3.3 (discrete Lloyd)     Demo.discrete
toy2d           hand-checked example of the same update    Demo.discrete
continuous      Eq. (6), Prop. 3.1, Fig. 3                 Demo.evolve_flow -> step_lloyd
network         Sec. IV-A, Eq. (11), Remark 4.1            Demo.evolve_async, Demo.schedule
radius          Table I, Eq. (12), Fig. 4                  geometry.sensing_trace, Demo.radius_step
communication   Sec. IV-B, paragraph after Table II        geometry.sensing_trace, Demo.radius_step
algo1           Table III, Prop. 4.2                       Demo.evolve_async, Demo.schedule
algo2           Tables II and IV, Remark 4.3, Prop. 4.4    Demo.evolve_async, Demo.schedule,
                                                           Demo.monitor_active, geometry.monitor_update
second          Eq. (13), Prop. 5.1, Fig. 5                Demo.evolve_flow -> step_second_order
unicycle        Sec. V-A, Prop. 5.2, Fig. 6                Demo.evolve_flow -> step_unicycle
ellipse         Sec. V-B, Fig. 7                           geometry.log_density + step_lloyd
disk            Sec. V-B, Fig. 8                           geometry.log_density + step_lloyd
line            Sec. V-B, line-density example             geometry.log_density + step_lloyd
"""
import numpy as np
from geometry import (voronoi, stats, all_stats, inside, neighbors,
                      sensing_trace, monitor_update, log_density)

# ---------------------------------------------------------------------------
# Page catalog: the text shown at the top of each page
# ---------------------------------------------------------------------------
# `desc` uses $...$ for inline LaTeX and `formula` is display-mode LaTeX. Both
# are rendered with KaTeX in index.html.
PAGES = [
    dict(id='lloyd', group='Descent for Coverage Control', title='Discrete-time Lloyd Algorithm',
         desc=r'Each step builds the Voronoi cells, finds the centroid of each cell, and moves every agent a fraction $\alpha$ of the way to its centroid. The cells are only rebuilt after the move. Ten agents start bunched in the lower-left corner.',
         formula=r'p_i^{+} = p_i + \alpha\,\bigl(C_{V_i} - p_i\bigr), \qquad 0 < \alpha \le 1'),
    dict(id='continuous', group='Descent for Coverage Control', title='Continuous-time Lloyd Algorithm',
         desc='The same idea in continuous time. Every agent moves toward the centroid of its current cell, and the centroids shift as the cells change. Try both the uniform and the Gaussian density.',
         formula=r'\dot p_i = k_{\mathrm{prop}}\,\bigl(C_{V_i}(P) - p_i\bigr)'),
    dict(id='toy2d', group='Toy problems', title=r'Two agents in a $6 \times 2$ room',
         desc=r'A small example you can check by hand. Two agents start at $(1, \tfrac12)$ and $(3, \tfrac12)$, so the first boundary is $x=2$, the cell masses are $4$ and $8$, and the centroids are $(1,1)$ and $(4,1)$.',
         formula=r'\mathcal{H}:\; 27 \;\to\; 16\ \text{(old cells)} \;\to\; \tfrac{29}{2}\ \text{(new cells)} \;\to\; \cdots \;\to\; 13'),
    dict(id='network', group='Distributed algorithms', title='Asynchronous multi-agent network',
         desc='Agents run on their own clocks and only know the positions they last sensed. When its turn comes, an agent senses, computes its centroid, and moves toward it for a short time at bounded speed. Select an agent to compare the positions it has stored with the real ones.',
         formula=r'\dot p_i(s) = u_i, \qquad \|u_i\| \le 1, \qquad s \in [t,\, t+\delta t]'),
    dict(id='radius', group='Distributed algorithms', title='Adjust sensing radius',
         desc=r'How far does an agent have to sense to know its own Voronoi cell? The selected agent senses out to $R$, builds a candidate cell $W$, and doubles $R$ until $R \ge 2\max_{q \in W}\|q-p_i\|$. Then it shrinks $R$ to exactly that value.',
         formula=r'W = Q \cap B(p_i,R) \cap \bigcap_{j\ \text{detected}} S_{ij}, \qquad R_{\text{final}} = 2\max_{q \in W}\|q-p_i\|'),
    dict(id='communication', group='Distributed algorithms', title='Adjust communication radius',
         desc='The same radius search, done with messages instead of sensing. The agent sends a request to everyone within $R$, and each of them replies with its position. The stopping test does not change.',
         formula=r'\text{request within } R \;\to\; \text{replies} \;\to\; \text{update } W \;\to\; \text{certify or double } R'),
    dict(id='algo1', group='Distributed algorithms', title='Coverage behavior I',
         desc=r'Each agent runs two threads. The information thread updates the agent’s cell with the communication-radius routine. The control thread computes the mass and centroid of the stored cell and pushes toward the centroid for a short time $\delta_0$.',
         formula=r'\text{control pair: } \bigl(\delta_0,\; M_{V_i}\,(C_{V_i} - p_i)\bigr); \qquad \text{events: information / control / both}'),
    dict(id='algo2', group='Distributed algorithms', title='Coverage behavior II',
         desc='While it moves, an agent heads for the last centroid it computed and keeps watching its neighbors. If a neighbor starts moving, or a moving agent becomes a neighbor, it recomputes its centroid.',
         formula=r'u_i = \operatorname{SR}\bigl(C_{V_i}(s) - p_i\bigr), \qquad \operatorname{SR}(x) = \frac{x}{\max(1, \|x\|)}'),
    dict(id='second', group='Vehicle dynamics', title='Second-order vehicles',
         desc=r'The agents now have inertia, so they can overshoot. One term pulls each agent toward its centroid and a damping term removes kinetic energy. Compare the coverage cost $\mathcal{H}$ with the total energy $E$ in the plot.',
         formula=r'\ddot p_i = -k_p\, M_{V_i}\,(p_i - C_{V_i}) - k_d\, \dot p_i, \qquad E = \frac{k_p}{2}\,\mathcal{H} + \frac12 \sum_i \|\dot p_i\|^2'),
    dict(id='unicycle', group='Vehicle dynamics', title='Wheeled vehicles',
         desc='Wheeled robots cannot move sideways. At the start of each planning interval every robot fixes its target at the current centroid, then steers and drives toward it with the paper’s heading and speed laws. The line on each robot shows its heading.',
         formula=r'\dot\theta = 2k_{\mathrm{prop}} \arctan\frac{e_\perp \cdot (p - C)}{e \cdot (p - C)}, \qquad v = -k_{\mathrm{prop}}\; e \cdot (p - C)'),
    dict(id='ellipse', group='Density-designed formations', title='Ellipse Band',
         desc='The density is high only in a thin band around an ellipse, so continuous Lloyd pulls the agents onto the ellipse. The paper notes that this example converges slowly.',
         formula=r'g = a(x-x_c)^2 + b(y-y_c)^2 - r^2, \qquad \phi = \exp\bigl(-\kappa g^2\bigr)'),
    dict(id='disk', group='Density-designed formations', title='Ellipsoidal Disk',
         desc='Here the density uses the paper’s smooth ramp, so the whole inside of the ellipse matters and the agents fill it instead of sitting on the boundary.',
         formula=r'\operatorname{SR}_\ell(g) = g\left(\frac{\arctan(\ell g)}{\pi} + \frac12\right), \qquad \phi = \exp\bigl(-\kappa\, \operatorname{SR}_\ell(g)\bigr)'),
    dict(id='line', group='Density-designed formations', title='Line Formation',
         desc='The density is high near a line, so the agents end up spread out along it.',
         formula=r'\phi_{\text{line}}(x,y) = \exp\bigl[-\kappa\,(ax + by + c)^2\bigr]')
]

# one Lloyd update per cycle
DISCRETE_PAGES = ('lloyd', 'toy2d')
# one radius stage per cycle
RADIUS_PAGES = ('radius', 'communication')
ASYNC_PAGES = ('network', 'algo1', 'algo2')          # event-driven agents
# density chosen to shape the formation
FORMATION_PAGES = ('ellipse', 'disk', 'line')
# not adjustable on the toy page
FIXED_GEOMETRY = ('n', 'domain', 'initial', 'density')

# ---------------------------------------------------------------------------
# Parameters
# ---------------------------------------------------------------------------
# Every page starts from BASE and overrides a few entries in defaults().
BASE = dict(
    n=10, seed=7,                       # number of agents; seed for the initial positions
    domain='square', initial='corner',  # environment Q and initial layout
    density='uniform',                  # phi, see geometry.log_density
    alpha=1.,                           # discrete Lloyd step fraction
    gain=1.,                            # k_prop for continuous Lloyd and the unicycle
    beta=1.,                            # Gaussian density sharpness
    kappa=500., a=1.4, b=.6, r2=.3,     # formation densities (Figs. 7 and 8)
    xc=0., yc=0., ell=10., line_c=0.,   # density center, ramp steepness, line offset
    kp=6., kd=1., v0=0.,                # second-order gains and initial x velocity
    dt=.025, horizon=.3,                # integration step and model time per cycle
    radius=.18,                         # starting radius R for Table I
    selected=0,                         # agent shown in the inspector
    # pulse length, time between agent turns, control window
    delta0=.06, slot=.08, window=.65,
    accuracy=1)                         # quadrature level 0, 1 or 2

# Allowed range of each numeric parameter, and the choices for the others.
LIMITS = {'n': (1, 48), 'seed': (0, 100000), 'gain': (.01, 15), 'alpha': (.01, 1),
          'beta': (.05, 12), 'kappa': (1, 1000), 'a': (.05, 4), 'b': (-3, 4),
          'r2': (.01, 2), 'xc': (-1, 1), 'yc': (-1, 1), 'ell': (.1, 50),
          'line_c': (-2, 2), 'kp': (.05, 15), 'kd': (.01, 12), 'v0': (-2, 2),
          'dt': (.002, .06), 'horizon': (.02, 2), 'radius': (.02, 6),
          'selected': (0, 47), 'delta0': (.005, .25), 'slot': (.03, .3),
          'window': (.02, 2), 'accuracy': (0, 2)}
INTEGERS = ('n', 'seed', 'selected', 'accuracy')
CHOICES = {'domain': ('square', 'polygon'), 'initial': ('corner', 'spread'),
           'density': ('uniform', 'gaussian', 'ellipse', 'disk', 'line')}


def defaults(page):
    """Default configuration of a page: BASE plus that page's overrides."""
    c = BASE.copy()
    if page in ('continuous', 'second', 'unicycle') + FORMATION_PAGES:
        # The paper's simulations: 32 agents in a convex polygon.
        c.update(n=32, domain='polygon', density='gaussian')
    if page == 'unicycle':
        c.update(n=16, gain=7., horizon=.18, dt=.012)
    if page in FORMATION_PAGES:
        c.update(density=page)
    if page == 'line':
        c.update(kappa=80, a=1, b=-.6)
    if page == 'toy2d':
        c.update(n=2, domain='toy', initial='toy')
    if page in ASYNC_PAGES:
        c.update(horizon=.48)
    if page in RADIUS_PAGES:
        c.update(initial='spread')
    return c


def domain_for(name):
    """Vertices of the environment Q, counter-clockwise."""
    if name == 'polygon':
        return np.array([[-1.45, -1.2], [.8, -1.2], [1.45, .4], [1.05, 1.2], [-.65, 1.5], [-1.2, .55]])
    l, r, b, t = {'square': (-1.5, 1.5, -1.5, 1.5), 'toy': (0, 6, 0, 2)}[name]
    return np.array([[l, b], [r, b], [r, t], [l, t]], float)


def validate(page, overrides):
    """Merge user-supplied parameters into the page defaults.

    Input:  page id and a dict of overrides from the browser.
    Output: the full configuration. Raises ValueError for an unknown page or an
            out-of-range value; unknown keys are ignored.
    """
    if page not in {p['id'] for p in PAGES}:
        raise ValueError('Unknown page')
    c = defaults(page)
    for k, v in overrides.items():
        if page == 'toy2d' and k in FIXED_GEOMETRY:
            continue
        if k in LIMITS:
            v = float(v)
            lo, hi = LIMITS[k]
            if not np.isfinite(v) or not lo <= v <= hi:
                raise ValueError(f'{k} must be between {lo} and {hi}')
            c[k] = int(v) if k in INTEGERS else v
        elif k in CHOICES:
            if v not in CHOICES[k]:
                raise ValueError(f'Invalid {k}')
            c[k] = v
    if c['density'] in ('ellipse', 'disk') and c['b'] <= 0:
        raise ValueError('Ellipse/disk coefficient b must be positive')
    c['selected'] = min(c['selected'], c['n'] - 1)
    return c


# ---------------------------------------------------------------------------
# Simulation
# ---------------------------------------------------------------------------

class Demo:
    """State of one running demo page.

    Input:  page id and optional parameter overrides (see BASE).
    Use:    advance() runs one cycle; snapshot() returns the current state.

    Main state, with n agents:
        p (n, 2)          positions            v (n, 2)        velocities
        theta (n,)        unicycle headings    cells           Voronoi cells
        masses (n,)       M_V                  centroids (n, 2) C_V
        cost              H(P)                 gradient (n, 2) dH/dp_i
        target (n, 2)     the centroid each agent is currently driving toward
    """

    def __init__(self, page='lloyd', overrides=None):
        self.page = page
        self.cfg = c = validate(page, overrides or {})
        self.rng = np.random.default_rng(c['seed'])
        self.domain = domain_for(c['domain'])
        self.n = c['n']
        self.t = 0.           # model time
        self.iteration = 0    # completed cycles
        self.history = []     # rows of [t, cost, energy] for the plot
        self.selected = c['selected']
        self.warning = ''
        self.finished = False

        self.p = self.initial_positions()
        self.v = np.zeros_like(self.p)
        self.v[:, 0] = c['v0']
        self.theta = self.rng.uniform(-np.pi, np.pi, self.n)

        # Coverage behavior I needs |M (C - p)| <= 1 (Eq. (11)), so the density
        # is rescaled once by 1/max(1, diam(Q) * integral_Q phi).
        self.scale = 1.
        if page == 'algo1':
            mass = stats(self.domain, self.domain.mean(axis=0), c)[0]
            diam = max(np.linalg.norm(a - b)
                       for a in self.domain for b in self.domain)
            self.scale = 1/max(1., mass*diam)

        self.refresh()
        self.target = self.centroids.copy()

        # Per-agent state of the asynchronous network model (Sec. IV-A).
        # held control input
        self.u = np.zeros_like(self.p)
        # time at which the control ends
        self.stop = np.zeros(self.n)
        # currently moving
        self.active = np.zeros(self.n, dtype=bool)
        # local clock speed
        self.clock_rates = self.rng.uniform(.8, 1.2, self.n)
        # stored[i, j]: where i thinks j is
        self.stored = np.repeat(self.p[None, :, :], self.n, axis=0)
        # when stored[i, j] was last updated
        self.stamps = np.zeros((self.n, self.n))
        # cell each agent has computed for itself
        self.local_cells = [v.copy() for v in self.cells]
        self.radii = np.array([2*np.max(np.linalg.norm(v - p, axis=1))
                               for v, p in zip(self.cells, self.p)])  # sensing radius R_i
        # number of turns each agent has had
        self.visits = np.zeros(self.n, int)
        # fixed order of the turns
        self.order = self.rng.permutation(self.n)
        self.tick = 0
        self.next_visit = c['slot']
        self.last_thread = ['not yet scheduled']*self.n

        # Table II monitoring state, used by Coverage behavior II.
        # stored neighbor weights
        self.weights = np.zeros((self.n, self.n), int)
        self.events = np.zeros(self.n, bool)                   # event flags
        self.event_count = np.zeros(self.n, int)
        # weight table of the selected agent
        self.monitor_rows = []

        # Table I stages for the selected agent, replayed one per cycle.
        self.radius_index = 0
        self.radius_trace = []
        if page in RADIUS_PAGES:
            self.prepare_radius()
        self.record()

    def initial_positions(self):
        """Starting positions: the fixed toy layout, or n random distinct points in Q.

        'corner' draws from the lower-left 29% of the bounding box, 'spread'
        from all of it; points that fall outside Q are rejected.
        """
        if self.cfg['initial'] == 'toy':
            return np.array([[1, .5], [3, .5]])
        lo, hi = self.domain.min(axis=0), self.domain.max(axis=0)
        top = lo + .29*(hi - lo) if self.cfg['initial'] == 'corner' else hi
        sample = []
        for _ in range(50000):
            v = self.rng.uniform(lo, top)
            if inside(v, self.domain)[0] and all(np.linalg.norm(v - w) > .005 for w in sample):
                sample.append(v)
            if len(sample) == self.n:
                return np.array(sample)
        raise ValueError('Could not initialize distinct agents')

    # -- shared bookkeeping --------------------------------------------------

    def refresh(self):
        """Recompute cells, masses, centroids, cost, gradient and neighbors from p."""
        self.cells, self.masses, self.centroids, self.cost, self.gradient = all_stats(
            self.domain, self.p, self.cfg, self.scale)
        self.adj = neighbors(self.cells, self.p)

    def metrics(self):
        """Numbers shown under the plot.

        Output: cost = H(P); energy = E = kp H / 2 + sum |v|^2 / 2 (Prop. 5.1);
                error = largest distance from an agent to its centroid.
        """
        energy = self.cfg['kp']*self.cost/2 + float(np.sum(self.v**2))/2
        error = float(np.max(np.linalg.norm(self.p - self.centroids, axis=1)))
        return {'cost': self.cost, 'energy': energy, 'error': error, 'mass_scale': self.scale}

    def record(self):
        """Append the current time, cost and energy to the plot history."""
        m = self.metrics()
        self.history.append([self.t, m['cost'], m['energy']])
        self.history = self.history[-4000:]

    def snapshot(self, history=False):
        """Everything the browser needs to draw the current state, as a dict."""
        i = self.selected
        s = dict(p=self.p.copy(), v=self.v.copy(), theta=self.theta.copy(), cells=self.cells,
                 centroids=self.centroids.copy(), targets=self.target.copy(), masses=self.masses.copy(),
                 gradient=self.gradient.copy(), neighbors=self.adj, active=self.active.copy(),
                 t=self.t, iteration=self.iteration, warning=self.warning,
                 finished=self.finished, selected=i, metrics=self.metrics(), radii=self.radii.copy(),
                 clocks=self.clock_rates*self.t, clock_rates=self.clock_rates, u=self.u.copy(),
                 events=self.events.copy(), event_count=self.event_count.copy(), weights=self.monitor_rows,
                 threads=self.last_thread.copy())
        if history:
            s['history'] = self.history
        if self.page in ASYNC_PAGES:
            # Every agent's local data, so the viewer can switch agents mid-animation.
            s.update(stored=self.stored.copy(), ages=self.t - self.stamps,
                     local_cells=list(self.local_cells))
        if self.page in RADIUS_PAGES:
            idx = min(self.radius_index, len(self.radius_trace) - 1)
            s['radius_stage'] = dict(self.radius_trace[idx], index=idx + 1, total=len(self.radius_trace),
                                     shrunk=self.radius_index >= len(self.radius_trace), final=self.final_radius)
        return s

    def heatmap(self):
        """Density phi on a 100 x 100 grid, scaled to [0, 1], with -1 outside Q."""
        lo, hi = self.domain.min(axis=0), self.domain.max(axis=0)
        xx, yy = np.meshgrid(np.linspace(
            lo[0], hi[0], 100), np.linspace(lo[1], hi[1], 100))
        q = np.stack([xx.ravel(), yy.ravel()], axis=1)
        ld = log_density(q, self.cfg)
        z = np.exp(ld - ld.max())
        z[~inside(q, self.domain)] = -1
        return dict(bounds=[*lo, *hi], size=100, z=z.reshape(100, 100))

    # -- discrete-time Lloyd (Sec. III-B, Prop. 3.3) ---------------------------

    def discrete(self):
        """One Lloyd update: p_i <- p_i + alpha (C_i - p_i), then rebuild the cells.

        Pages:  lloyd, toy2d.
        Output: (frames, extra). extra['fixed_cost'] is the cost of the new
                positions on the OLD cells; self.cost is the cost after the
                cells are reassigned. Both steps can only lower the cost, which
                is the argument behind Prop. 3.3 (27 -> 16 -> 14.5 on the toy page).
        """
        old_cells = self.cells
        self.target = self.centroids.copy()
        self.p = self.p + self.cfg['alpha']*(self.target - self.p)
        fixed = sum(stats(v, p, self.cfg, self.scale)[
                    2] for v, p in zip(old_cells, self.p))
        self.t += 1
        self.iteration += 1
        self.refresh()
        self.record()
        return [self.snapshot()], {'fixed_cost': fixed, 'discrete': True}

    # -- continuous-time controllers (Secs. III-A and V) ---------------------

    def evolve_flow(self):
        """Integrate a continuous-time controller for `horizon` model time.

        Pages:  continuous, ellipse, disk, line -> step_lloyd
                second                          -> step_second_order
                unicycle                        -> step_unicycle
        Output: (frames, extra) with about ten snapshots along the way.

        The run stops with a warning if an agent would leave Q. Nothing pushes
        agents back inside.
        """
        c = self.cfg
        steps = max(2, int(np.ceil(c['horizon']/c['dt'])))
        dt = c['horizon']/steps
        stride = max(1, steps//10)
        step = {'second': self.step_second_order,
                'unicycle': self.step_unicycle}.get(self.page, self.step_lloyd)
        # The unicycle drives to these centroids for the whole interval.
        self.target = self.centroids.copy()
        frames = []
        for k in range(steps):
            old = self.p.copy(), self.v.copy(), self.theta.copy()
            if not step(dt):
                break
            if not np.all(inside(self.p, self.domain)):
                self.p, self.v, self.theta = old
                self.warning = 'A vehicle would leave $Q$. Run paused; reduce gain/initial speed or increase damping. No boundary projection was applied.'
                self.finished = True
                break
            self.t += dt
            self.refresh()
            if k % stride == 0 or k == steps - 1:
                frames.append(self.snapshot())
                self.record()
        self.iteration += 1
        return frames or [self.snapshot()], {'discrete': False}

    def step_lloyd(self, dt):
        """Continuous Lloyd, Eq. (6): p_i' = k_prop (C_i - p_i).

        With the centroid held fixed over the step the solution is exact:
        p <- p + (1 - exp(-k dt)) (C - p). Each agent stays on the segment to
        its centroid, so it cannot leave its (convex) cell.
        """
        old = self.p.copy()
        self.p += -np.expm1(-self.cfg['gain']*dt)*(self.centroids - self.p)
        self.v = (self.p - old)/dt
        return True

    def step_second_order(self, dt):
        """Second-order vehicles, Eq. (13): p_i'' = -kp M_i (p_i - C_i) - kd p_i'.

        Midpoint (RK2) step, with masses and centroids recomputed at the
        midpoint. Returns False if the midpoint is outside Q.
        """
        c = self.cfg
        a = -c['kp']*self.masses[:, None] * \
            (self.p - self.centroids) - c['kd']*self.v
        pm = self.p + .5*dt*self.v
        vm = self.v + .5*dt*a
        if not np.all(inside(pm, self.domain)):
            self.warning = 'A midpoint prediction leaves $Q$. Run paused; reduce dt, gain, or initial velocity.'
            self.finished = True
            return False
        _, mm, cm, _, _ = all_stats(self.domain, pm, c, self.scale)
        am = -c['kp']*mm[:, None]*(pm - cm) - c['kd']*vm
        self.p += dt*vm
        self.v += dt*am
        return True

    def unicycle_law(self, p, theta):
        """Unicycle feedback of Sec. V-A toward the fixed targets.

        With e = (cos theta, sin theta) and d = C - p:
            v     = k_prop e . d                         forward speed
            omega = 2 k_prop arctan(e_perp . d / e . d)  turning rate

        Input:  positions p (n, 2), headings theta (n,).
        Output: (velocity (n, 2), omega (n,), theta). theta is returned with pi
                added wherever the target was behind the robot, which is the
                paper's equivalent forward-facing description of the same state.
        """
        k = self.cfg['gain']
        d = self.target - p
        def heading(th): return np.stack([np.cos(th), np.sin(th)], axis=1)
        theta = theta + \
            np.where(np.sum(heading(theta)*d, axis=1) < 0, np.pi, 0.)
        e = heading(theta)
        dot = np.sum(e*d, axis=1)
        cross = e[:, 0]*d[:, 1] - e[:, 1]*d[:, 0]
        # atan2 gives the arctan branch in [-pi/2, pi/2] after reorientation.
        alpha = np.arctan2(cross, np.maximum(dot, 0))
        alpha[np.linalg.norm(d, axis=1) < 1e-12] = 0
        return k*dot[:, None]*e, 2*k*alpha, theta

    def step_unicycle(self, dt):
        """Midpoint (RK2) step of the unicycle kinematics p' = v e, theta' = omega."""
        vel, omega, self.theta = self.unicycle_law(self.p, self.theta)
        vm, om, _ = self.unicycle_law(
            self.p + .5*dt*vel, self.theta + .5*dt*omega)
        self.p += dt*vm
        self.theta += dt*om
        self.v = vm
        return True

    # -- sensing and communication radius (Table I) ---------------------------

    def prepare_radius(self):
        """Run Table I for the selected agent and keep its stages for replay."""
        _, self.final_radius, self.radius_trace = sensing_trace(
            self.domain, self.p, self.selected, self.cfg['radius'])
        self.radius_index = 0
        self.finished = False

    def radius_step(self):
        """Show the next stage of Table I: one doubling of R, or the final shrink.

        Pages:  radius, communication. The agents do not move on these pages.
        The communication page replays the same stages and the browser draws
        them as request and reply arrows.
        """
        self.radius_index += 1
        self.t += 1
        self.iteration += 1
        self.finished = self.radius_index >= len(self.radius_trace)
        return [self.snapshot()], {'discrete': True, 'radius': True}

    # -- asynchronous network (Sec. IV) --------------------------------------

    def observe(self, i):
        """Agent i senses: run Table I and update what i knows.

        Output: the local Voronoi cell of i. Also stores the cell and radius,
                and the positions of the agents within that radius. Positions
                of agents it did not detect keep their old stored values.
        """
        v, R, trace = sensing_trace(self.domain, self.p, i, self.radii[i])
        self.radii[i] = R
        self.local_cells[i] = v
        seen = np.linalg.norm(
            self.p - self.p[i], axis=1) <= trace[-1]['radius'] + 1e-9
        seen[i] = True
        self.stored[i, seen] = self.p[seen]
        self.stamps[i, seen] = self.t
        return v

    def schedule(self, i):
        """Agent i's turn: decide its target and control from local information.

        network  sense, compute the centroid C of the local cell, and move
                 toward it at speed <= 1 for `window` (Sec. IV-A).
        algo1    Table III, Coverage behavior I. Turns cycle through
                 information / control / both. Information = observe().
                 Control = apply u = M (C - p) for delta0, using the stored cell.
        algo2    Table IV, Coverage behavior II. Sense, compute C, reset the
                 Table II monitor, and move toward C with u = SR(C - p).
        """
        c = self.cfg
        self.visits[i] += 1
        if self.page == 'algo1':
            kind = ('information', 'control', 'both')[(self.visits[i] - 1) % 3]
            if kind in ('information', 'both'):
                self.observe(i)
            if kind in ('control', 'both'):
                M, C, _, _ = stats(
                    self.local_cells[i], self.p[i], c, self.scale)
                self.target[i] = C
                self.u[i] = M*(C - self.p[i])
                self.stop[i] = self.t + c['delta0']
                self.active[i] = np.linalg.norm(self.u[i]) > 1e-10
            self.last_thread[i] = kind
            return
        self.observe(i)
        _, C, _, _ = stats(self.local_cells[i], self.p[i], c)
        d = C - self.p[i]
        self.target[i] = C
        # SR(C - p): speed at most 1
        self.u[i] = d/max(1., np.linalg.norm(d))
        self.active[i] = np.linalg.norm(d) > 1e-8
        if self.page == 'algo2':
            # The window ends before the agent's next turn.
            self.stop[i] = self.t + min(c['window'], .8*self.n*c['slot'])
            self.weights[i] = self.current_weights(i)
            self.events[i] = False
            self.last_thread[i] = 'monitor + move'
        else:
            self.stop[i] = self.t + c['window']
            self.last_thread[i] = 'sense → compute → pulse'

    def current_weights(self, i):
        """Table II weights seen by agent i: 3 moving neighbor, 1 idle neighbor, 0 otherwise."""
        w = np.zeros(self.n, int)
        for j in self.adj[i]:
            w[j] = 3 if self.active[j] else 1
        return w

    def weight_rows(self, i, old):
        """Stored and current weights of agent i as table rows for the inspector."""
        new = self.current_weights(i)
        return [{'j': j, 'stored': int(old[j]), 'current': int(new[j]), 'delta': int(new[j] - old[j])}
                for j in range(self.n) if j != i]

    def monitor_active(self):
        """Table II monitoring for every moving agent (Coverage behavior II).

        Each moving agent re-senses and compares its neighbor weights with the
        stored ones. On an event it recomputes its centroid, retargets, and
        clears the flag.

        The simulator knows all positions, but each agent's cell is built only
        from the agents inside its own sensing radius.
        """
        self.cells = voronoi(self.domain, self.p)
        self.adj = neighbors(self.cells, self.p)
        for i in np.where(self.active)[0]:
            self.observe(i)
            old = self.weights[i].copy()
            self.weights[i], self.events[i], trigger = monitor_update(
                old, self.current_weights(i), self.events[i])
            if i == self.selected:
                self.monitor_rows = self.weight_rows(i, old)
            if trigger:
                self.event_count[i] += 1
                self.target[i] = stats(
                    self.local_cells[i], self.p[i], self.cfg)[1]
                self.events[i] = False

    def evolve_async(self):
        """Run the asynchronous network for `horizon` model time.

        Pages:  network, algo1, algo2.
        Output: (frames, extra) with about ten snapshots.

        Agents take turns in a fixed random order, one turn every `slot` of
        model time; schedule() handles the turn. Between turns every moving
        agent integrates p' = u until its control window ends. Time steps are
        cut short so that turns and window ends land exactly on a step.
        """
        c = self.cfg
        end = self.t + c['horizon']
        frames = []
        next_frame = self.t
        while self.t < end - 1e-10:
            self.active &= self.stop > self.t + 1e-10
            self.u[~self.active] = 0
            if self.t >= self.next_visit - 1e-10:
                self.schedule(int(self.order[self.tick % self.n]))
                self.tick += 1
                self.next_visit = (self.tick + 1)*c['slot']
                if self.page == 'algo2':
                    self.monitor_active()
            future = self.stop[self.stop > self.t + 1e-10]
            bound = min(end, self.next_visit, float(
                future.min()) if len(future) else end)
            dt = min(c['dt'], bound - self.t)
            if dt < 1e-10:
                continue
            old = self.p.copy()
            if self.page == 'algo2':
                self.step_saturated(dt)
            else:
                self.p += dt*self.u
            if not np.all(inside(self.p, self.domain)):
                self.p = old
                self.warning = 'A pulse would leave $Q$; paused without projection. Reduce pulse duration.'
                self.finished = True
                break
            self.v = (self.p - old)/dt
            self.t += dt
            self.active &= self.stop > self.t + 1e-10
            if self.page == 'algo2':
                self.monitor_active()
            if self.t >= next_frame - 1e-10 or self.t >= end - 1e-10:
                self.refresh()
                self.record()
                frames.append(self.snapshot())
                next_frame = self.t + c['horizon']/9
        self.iteration += 1
        return frames or [self.snapshot()], {'discrete': False}

    def step_saturated(self, dt):
        """Coverage behavior II motion, Remark 4.3: p' = SR(C - p) toward a fixed target C.

        Solved exactly: unit speed while the agent is farther than 1 from C,
        then exponential decay of the remaining distance.
        """
        d = self.target - self.p
        dist = np.linalg.norm(d, axis=1)
        self.u = d/np.maximum(1, dist)[:, None]
        self.u[~self.active] = 0
        travel = np.where(dist > 1, np.minimum(
            dt, np.maximum(dist - 1, 0)), 0)   # time at unit speed
        remain = np.maximum(0, dt - travel)
        length = travel + np.minimum(dist, 1)*(-np.expm1(-remain))
        fraction = np.divide(
            length, dist, out=np.zeros_like(dist), where=dist > 1e-12)
        self.p += fraction[:, None]*d*self.active[:, None]

    # -- entry points used by app.py -----------------------------------------

    def advance(self):
        """Run one cycle of this page's algorithm.

        Output: dict with
            before  snapshot at the start of the cycle
            frames  snapshots during the cycle, for the animation
            after   snapshot at the end, including the plot history
            extra   flags telling the browser how to animate the cycle
        """
        if self.page in DISCRETE_PAGES + ('unicycle',):
            # These pages show the targets before the agents move.
            self.target = self.centroids.copy()
        before = self.snapshot()
        if self.finished:
            return dict(before=before, frames=[before], after=self.snapshot(True), extra={})
        if self.page in RADIUS_PAGES:
            frames, extra = self.radius_step()
        elif self.page in DISCRETE_PAGES:
            frames, extra = self.discrete()
        elif self.page in ASYNC_PAGES:
            frames, extra = self.evolve_async()
        else:
            frames, extra = self.evolve_flow()
        return dict(before=before, frames=frames, after=self.snapshot(True), extra=extra)

    def action(self, action, values):
        """Handle a user action from the browser. The only one is selecting an agent.

        Input:  action = 'select', values = {'selected': agent index}.
        Output: the new snapshot. On the radius pages the Table I stages are
                rebuilt for the newly selected agent.
        """
        if action != 'select':
            raise ValueError('Unknown action')
        self.selected = int(values['selected']) % self.n
        if self.page in RADIUS_PAGES:
            self.prepare_radius()
        return self.snapshot(True)
