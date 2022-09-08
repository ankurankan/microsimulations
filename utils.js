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
 * Compare each value of x to y. Returns true for each i if x[i] <= y
 * @param {Array} x
 * @param y
 */
function vectorCompareEqual(x, y){
	return x.map((e, i) => e >= y);
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
 * Compute the median of the array `numbers`
 */
function median(numbers) {
    const sorted = Array.from(numbers).sort((a, b) => a - b);
    const middle = Math.floor(sorted.length / 2);

    if (sorted.length % 2 === 0) {
        return (sorted[middle - 1] + sorted[middle]) / 2;
    }

    return sorted[middle];
}

/**
 * Compute the mean of the array `numbers` while replacing Infinite values with `max`.
 */
function mean(numbers, max) {
    return Math.round((array_sum(numbers.map((e, i) => (e == Infinity) ? max : e)) / numbers.length) * 100) / 100;
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
