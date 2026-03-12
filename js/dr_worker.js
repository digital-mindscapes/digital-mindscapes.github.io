/**
 * Dimensionality Reduction Web Worker
 * Handles heavy t-SNE and UMAP computations in a separate thread.
 */

// Polyfill window for libraries that expect it in a worker environment
self.window = self;

// Import Libraries
try {
    importScripts('https://cdn.jsdelivr.net/gh/karpathy/tsnejs@master/tsne.js');
} catch (e) {
    console.error("Worker failed to import t-SNE library.", e);
}

try {
    importScripts('https://cdn.jsdelivr.net/npm/umap-js@1.3.3/lib/umap-js.min.js');
} catch (e) {
    console.error("Worker failed to import UMAP library.", e);
}

self.onmessage = function(e) {
    const { method, data, params } = e.data;

    try {
        if (method === 'tsne') {
            runTSNE(data, params);
        } else if (method === 'umap') {
            runUMAP(data, params);
        }
    } catch (err) {
        self.postMessage({ type: 'error', message: err.message });
    }
};

function runTSNE(data, params) {
    const iterations = params.iterations || 500;
    const perplexity = params.perplexity || 30;
    
    // Check for different global names
    const tsneLib = self.tsnejs || self.tsne;
    if (!tsneLib) throw new Error("t-SNE library not found in worker scope.");

    const tsne = new tsneLib.tSNE({
        epsilon: 10,
        perplexity: perplexity,
        dim: 2
    });

    tsne.initDataRaw(data);

    const stepSize = 25; 
    for (let k = 0; k < iterations; k++) {
        tsne.step();
        if (k % stepSize === 0) {
            self.postMessage({ 
                type: 'progress', 
                progress: (k / iterations) * 100 
            });
        }
    }

    const solution = tsne.getSolution();
    self.postMessage({ 
        type: 'complete', 
        projections: solution 
    });
}

function runUMAP(data, params) {
    const umapLib = self.UMAP?.UMAP || self.UMAP || self.umap?.UMAP || self.umap;
    if (!umapLib) throw new Error("UMAP library not found in worker scope.");

    const umap = new umapLib({
        nNeighbors: params.nNeighbors || 15,
        minDist: params.minDist || 0.1,
        nComponents: 2
    });

    const solution = umap.fit(data);
    self.postMessage({ 
        type: 'complete', 
        projections: solution 
    });
}
