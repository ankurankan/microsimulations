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

function vectorAdd(x, y){
	return x.map((e, i) => e + y[i]);
}

function scalerMult(x, y){
	return y.map((e, i) => e * h);
}

function rk4(equation, initialCondition, start, stepSize, steps){
	f = equation;
	n = steps;
	h = stepSize;
	y = [initialCondition];
	m = initialCondition.length;

	t = start;
	i = 0;

	while(i < n){
		yNext = [];
		k1 = f(t, y[i]);
		k2 = f(t + (0.5 * h), vectorAdd(y[i], scalerMult(0.5 * h, k1)));
		k3 = f(t + (0.5 * h), vectorAdd(y[i], scalerMult(0.5 * h, k2)));
		k4 = f(t + h, vectorAdd(y[i], scalerMult(h, k3)));
		
		for(k=0; k<m; k++){
			yNext.push(y[i][k] + (h*(k1[k] + (2 * k2[k]) + (2 * k3[k]) + k4[k]) / 6));
		}
		console.log(yNext);
		y.push(yNext);
		t += h;
		i++;
	}
	return y;
};

function tumormodel(x, dxdt, t){
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

	if ( T < 1){
		dxdt[0] = -T;
	}
	else{
		dxdt[0] = growth * Math.pow(T, GROWTH_EXPONENT) - killing;
	}

	dxdt[1] = S - delta*I;           // TILs
	dxdt[2] = t_cell_activation;     // specific T cells
	dxdt[3] = - t_cell_activation;   // naive T cells

	return (dxdt)
}

function get_survival(R, raise_killing){
	R_R_0 = R;
	RAISE_KILLING = raise_killing;
	DIAGNOSED_AT = Infinity;
	DEAD_AT = Infinity;

	x = [1.0, 0.0, 0.0, 1e6];

}
