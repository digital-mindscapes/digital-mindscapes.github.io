/**
 * Spatial Worker for Spatial Autocorrelation Calculations
 * Handles heavy computations for Moran's I and LISA
 */

self.onmessage = function(e) {
    const { action, data, config } = e.data;

    try {
        if (action === 'calculate') {
            const { values, ids, neighbors } = data;
            const { permutations = 499 } = config;

            self.postMessage({ type: 'progress', percent: 10, status: "Calculating Global Moran's I..." });
            // 1. Calculate Global Moran's I
            const globalResult = calculateGlobalMoran(values, neighbors, permutations);

            self.postMessage({ type: 'progress', percent: 20, status: "Calculating Local Association (LISA)..." });
            // 2. Calculate Local Moran's I (LISA)
            const localResults = calculateLocalMoran(values, ids, neighbors, permutations);

            self.postMessage({
                success: true,
                results: {
                    global: globalResult,
                    local: localResults
                }
            });
        }
    } catch (err) {
        self.postMessage({ success: false, error: err.message });
    }
};

function reportProgress(percent, status) {
    self.postMessage({ type: 'progress', percent, status });
}

/**
 * Global Moran's I calculation
 * I = (N / S0) * [ΣΣ w_ij (x_i - x_mean)(x_j - x_mean)] / [Σ (x_i - x_mean)^2]
 */
function calculateGlobalMoran(x, neighbors, permutations) {
    const n = x.length;
    if (n < 2) return { i: 0, z: 0, p: 1 };

    const mean = x.reduce((a, b) => a + b, 0) / n;
    const xDiff = x.map(v => v - mean);
    
    let denominator = 0;
    for (let i = 0; i < n; i++) {
        denominator += xDiff[i] ** 2;
    }

    function getI(valuesArr) {
        let num = 0;
        let s0 = 0;
        const diffs = valuesArr.map(v => v - mean);
        for (let i = 0; i < n; i++) {
            const nbIndices = neighbors[i] || [];
            if (nbIndices.length === 0) continue;
            const w_i = 1 / nbIndices.length;
            for (const j of nbIndices) {
                num += w_i * diffs[i] * diffs[j];
                s0 += w_i;
            }
        }
        return s0 > 0 ? (n / s0) * (num / denominator) : 0;
    }

    const actualI = getI(x);
    const ei = -1 / (n - 1);
    
    // Permutation test for Global I
    let countGreater = 0;
    const permValues = [...x];
    const iValues = [];

    for (let p = 0; p < permutations; p++) {
        // Shuffle values
        for (let i = n - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [permValues[i], permValues[j]] = [permValues[j], permValues[i]];
        }
        const permI = getI(permValues);
        iValues.push(permI);
        if (Math.abs(permI - ei) >= Math.abs(actualI - ei)) countGreater++;
    }

    const p = (countGreater + 1) / (permutations + 1);
    const meanPerm = iValues.reduce((a,b) => a+b, 0) / permutations;
    const stdPerm = Math.sqrt(iValues.reduce((a,b) => a + (b - meanPerm)**2, 0) / permutations) || 0.001;
    const z = (actualI - ei) / stdPerm;

    return { 
        i: actualI, 
        expectation: ei,
        z: z,
        p: p
    };
}

/**
 * Local Indicator of Spatial Association (LISA)
 * I_i = z_i * Σ w_ij * z_j
 * where z is standardized value
 */
function calculateLocalMoran(x, ids, neighbors, permutations) {
    const n = x.length;
    const mean = x.reduce((a, b) => a + b, 0) / n;
    const std = Math.sqrt(x.reduce((a, b) => a + (b - mean) ** 2, 0) / n) || 1;
    
    // Standardized values (Z-scores)
    const z = x.map(v => (v - mean) / std);
    
    const results = [];
    const lags = new Array(n).fill(0);

    // Calculate Local Moran's I and Spatial Lags
    for (let i = 0; i < n; i++) {
        const nbIndices = neighbors[i] || [];
        const w_i = nbIndices.length > 0 ? 1 / nbIndices.length : 0;
        
        let lag_i = 0;
        for (const j of nbIndices) {
            lag_i += w_i * z[j];
        }
        
        lags[i] = lag_i;
        const local_i = z[i] * lag_i;
        
        results.push({
            index: i,
            id: ids[i], // Include unit ID
            statistic: local_i,
            z: z[i],
            lag: lag_i,
            type: getQuadrant(z[i], lag_i)
        });
    }

    // Permutation testing for Significance
    // This is the heavy part
    for (let i = 0; i < n; i++) {
        if (i % 200 === 0) {
            reportProgress(20 + Math.floor((i / n) * 75), `Permutation testing: ${i} / ${n} units...`);
        }
        const nbIndices = neighbors[i] || [];
        if (nbIndices.length === 0) {
            results[i].p = 1;
            continue;
        }

        let count = 0;
        const actual = results[i].statistic;
        const w_i = nbIndices.length > 0 ? 1 / nbIndices.length : 0;

        for (let p = 0; p < permutations; p++) {
            // Pick random neighbors from indices excluding i
            let perm_lag = 0;
            for (let k = 0; k < nbIndices.length; k++) {
                let randomIdx = Math.floor(Math.random() * n);
                while (randomIdx === i) randomIdx = Math.floor(Math.random() * n);
                perm_lag += w_i * z[randomIdx];
            }
            const perm_i = z[i] * perm_lag;
            // For Local Moran, p-value is based on how often the permuted statistic 
            // is more extreme than the observed one.
            if (actual >= 0) {
                if (perm_i >= actual) count++;
            } else {
                if (perm_i <= actual) count++;
            }
        }
        
        results[i].p = (count + 1) / (permutations + 1);
        // Mark significance
        results[i].isSignificant = results[i].p < 0.05;
    }

    return results;
}

function getQuadrant(z, lag) {
    if (z >= 0 && lag >= 0) return 'HH';
    if (z < 0 && lag < 0) return 'LL';
    if (z >= 0 && lag < 0) return 'HL';
    if (z < 0 && lag >= 0) return 'LH';
    return 'NS';
}
