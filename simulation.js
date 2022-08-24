const alpha = 0.0025       // priming rate
const delta = 0.019        // death rate immune cells

const hI = 571             // Michaelis constant
const hT = 571             // Michaelis constant

xi = 0.001                 // default killing rate immune cells
R_R_0 = 5                  // initial growth rate tumor
R_R_1 = R_R_0              // final growth rate tumor

GROWTH_EXPONENT = 3.0/4.0

STOCHASTIC_KILLING = 0
STOCHASTIC_GROWTH = 0

DIAGNOSIS_THRESHOLD = 65*1e8
DEATH_THRESHOLD = 1e12
DIAGNOSED_AT = Infinity
DEAD_AT = Infinity
RAISE_KILLING = 1.0         // multiplication factor of killing rate by imm. therapy
LOWER_GROWTH = 1.0          // multiplication factor of growth rate by chemotherapy
TREATMENT_DURATION = Infinity
CHEMO_DURATION = Infinity
IMMUNO_START = 0
KILLING_SD = 0
GROWTH_SD = 0
CHEMO_START = 0

DRIFT_XI = 0
DRIFT_R = 0

t_max = 5 * 365.0

seed = 42
GROWTH_RATE_DECAY_RATE = 0    // decay rate of tumor growth

/**
 * Returns the elementwise sum of arrays x and y.
 * @param {Array} x
 * @param {Array} y
 */
function vectorAdd(x, y){
	return x.map((e, i) => e + y[i]);
}

/**
 * Returns the elementwise difference of arrays x and y.
 * @param {Array} x
 * @param {Array} y
 */
function vectorSub(x, y){
	return x.map((e, i) => e - y[i]);
}

/**
 * Returns the elementwise product of arrays x and y.
 * @param {Array} x
 * @param {Array} y
 */
function scalerMult(x, y){
	return y.map((e, i) => e * x);
}

/**
 * Returns the sum of all elements of array x.
 * @param {Array} x
 */
function array_sum(x){
	partial = 0;
	for (var i=0; i < x.length; i++){
		partial += x[i];
	}
	return partial;
}

/**
 * Compare each value of x to y. Returns true for each i if x[i] < y
 * @param {Array} x
 * @param y
 */
function vectorCompare(x, y){
	return x.map((e, i) => e > y);
}

/**
 * Computes the Euclidean distance between points x and y
 * @param {Array} x
 * @param {Array} y
 */
function distance(x, y){
	sq_diff = vectorSub(x, y).map((e, i) => e**2);
	return Math.sqrt(array_sum(sq_diff));
}

/**
 * Appoximate the value of y in the differential equation dy/dt at t=(start+stepSize*steps) given value at t0 using Runge-Kutta method.
 * @param {function} f: Differential equation which returns the value of dy/dt
 * @param {Array} y0: The value of the function at t0. 
 * @param {float} t0: The initial value of t.
 * @param {float} step_size: The step size to take in each iteration.
 * @param {int} n_steps: Number of steps.
 */
function rk4(f, y0, t0, step_size, n_steps){
	t = t0;
	i = 0;
	y_history = [y0];

	while(i < n_steps){
		y = [];
		// k1 = f(t, y0)
		k1 = f(t, y0);
		// k2 = f(t + 1/2 dt, y0 + 1/2 dt k1)
		k2 = f(t + (0.5 * step_size), vectorAdd(y0, scalerMult(0.5 * step_size, k1)));
		// k3 = f(t + 1/2 dt, y0 + 1/2 dt k2)
		k3 = f(t + (0.5 * step_size), vectorAdd(y0, scalerMult(0.5 * step_size, k2)));
		// k4 = f(t + dt, y0 + dt k3)
		k4 = f(t + step_size, vectorAdd(y0, scalerMult(step_size, k3)));

		for(k=0; k<y0.length; k++){
			y.push(y0[k] + (step_size*(k1[k] + (2 * k2[k]) + (2 * k3[k]) + k4[k]) / 6));
		}

		y0 = y;
		y_history.push(y0);

		t += step_size;
		i++;
	}
	return (y_history);
};

function rk4_boost(f, y0, t0, step_size, n_steps){
	t = t0;
	i = 0;
	y_history = [y0];

	dt = step_size;
	dh = step_size/2;
	th = t + dh;

	while(i < n_steps){
		// e1 = y_n
		e1 = y0;
		// e2 = y_n + h/2 f(t_n, e1)
		e2 = vectorAdd(y0, scalerMult(dh, f(t, e1)));
		// e3 = y_n + h/2 f(t_n + h/2, e2)
		e3 = vectorAdd(y0, scalerMult(dh, f(t+dh, e2)));
		// e4 = y_n + h f(t_n + h/2, e3)
		e4 = vectorAdd(y0, scalerMult(dt, f(t+dh, e3)));

		k1 = scalerMult(1/6, f(t, e1));
		k2 = scalerMult(1/3, f(t+dh, e2));
		k3 = scalerMult(1/3, f(t+dh, e3));
		k4 = scalerMult(1/6, f(t+dt, e4));

		y = vectorAdd(y0, scalerMult(dt, vectorAdd(vectorAdd(vectorAdd(k1, k2), k3), k4)));

		y0 = y;
		y_history.push(y0);

		t += step_size;
		i++;
	}
	return (y_history);
}

function tumormodel(t, x){
	T = x[0];
	I = x[1];
	S = x[2];
	N = x[3];

	t_cell_activation = alpha * ( T / (1e7 + T) ) * N;

	if (T > DIAGNOSIS_THRESHOLD){
		if (t < DIAGNOSED_AT){
			DIAGNOSED_AT = t;
		}
	}

	if (T > DEATH_THRESHOLD){
		if (t < DEAD_AT){
			DEAD_AT = t;
		}
	}

	killing = xi * I * (T / ( 1 + I/hI + T/hT ));
	growth = (R_R_0 * (t_max-t) + R_R_1*t)/t_max;
 
        // Start immunotherapy if: one day after diagnosis, a treatment effect is set (RAISE_KILLING),
        // and time is within treatment duration
	if ( (t > (DIAGNOSED_AT+1)) && (RAISE_KILLING != 1.0) && (t >= (DIAGNOSED_AT + IMMUNO_START)) && (t <= (DIAGNOSED_AT + IMMUNO_START+TREATMENT_DURATION)) ){
		killing *= RAISE_KILLING;
	}

        // Start chemotherapy if: one day after diagnosis, a treatment effect is set (LOWER_GROWTH),
        // and time is within treatment duration
    	if( (t > (DIAGNOSED_AT+1)) && (LOWER_GROWTH != 1.0) && (t >= (DIAGNOSED_AT + CHEMO_START) ) && (t <= (DIAGNOSED_AT + CHEMO_START + CHEMO_DURATION)) ){
        	growth *= LOWER_GROWTH;
	}

	dxdt = []
	if ( T < 1){
		dxdt.push(-T);
	}
	else{
		dxdt.push(growth * Math.pow(T, GROWTH_EXPONENT) - killing);
	}

	dxdt.push(S - delta*I);           // TILs
	dxdt.push(t_cell_activation);     // specific T cells
	dxdt.push(- t_cell_activation);   // naive T cells

	return (dxdt)
}

function get_survival(R, raise_killing, chemo_effect){
	R_R_0 = R;
	RAISE_KILLING = raise_killing;
	LOWER_GROWTH = chemo_effect;
	DIAGNOSED_AT = Infinity;
	DEAD_AT = Infinity;

	x = [1.0, 0.0, 0.0, 1e6];
	simulated_values = rk4(tumormodel, x, 0, 1, t_max/1);
	if (DIAGNOSED_AT < t_max){
		return ((DEAD_AT - DIAGNOSED_AT)/30.4);
	}
	else {
		return (Infinity);
	}
}

function population_survival(R_mu, R_sigma, raise_killing, chemo_effect, n){
	r_values = Array.from({length: n}, d3.randomLogNormal(R_mu, R_sigma));
	r_values.map((e, i) => get_survival(e, raise_killing, chemo_effect));
	return(r_values);
}

function prop_survival(R_mu, R_sigma, raise_killing, n){
	survival_values = population_survival(R_mu, R_sigma, raise_killing, n);
	p_survival = [];
	t = 0;
	max_t = 24;
	while (t <= max_t){
		p_survival.push([t, (array_sum(vectorCompare(survival_values, t))/survival_values.length)]);
		t += 0.1;
	}
	return (p_survival);
}
