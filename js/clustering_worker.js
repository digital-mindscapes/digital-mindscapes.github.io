/**
 * Clustering Web Worker
 * Performs K-means, DBSCAN, and Hierarchical Clustering using ml.js.
 */

// Polyfill window for libraries that expect it in a worker environment
self.window = self;

// Import Libraries with robust fallbacks
function safeImport(url) {
    try { importScripts(url); } catch (e) { console.error(`Failed to import ${url}:`, e); }
}

safeImport('https://www.lactame.com/lib/ml/6.0.0/ml.min.js');
safeImport('https://cdn.jsdelivr.net/gh/karpathy/tsnejs@master/tsne.js');
safeImport('https://cdn.jsdelivr.net/npm/umap-js@1.3.3/lib/umap-js.min.js');
safeImport('./density-clustering-bundle.js');
safeImport('./ml-hclust-bundle.js');

// Helper to get constructors from various possible namespaces
const getMLRef = (name) => {
    if (typeof ML !== 'undefined' && ML[name]) return ML[name];
    if (self[name]) return self[name];
    if (self['ML_' + name]) return self['ML_' + name];
    return null;
};

self.onmessage = function(e) {
    const { method, data, params } = e.data;
    console.log(`[Clustering Worker] Starting ${method.toUpperCase()} analysis...`);

    try {
        if (method === 'project') {
            const { basis, params: projParams } = params;
            let projections = [];
            if (basis === 'tsne') {
                projections = runTSNE(data, projParams || {});
            } else if (basis === 'umap') {
                projections = runUMAP(data, projParams || {});
            }
            self.postMessage({ type: 'projection_complete', projections });
            return;
        }

        let clusters = [];
        let elbowData = null;

        if (method === 'kmeans') {
            const KMeans = getMLRef('KMeans');
            if (!KMeans) throw new Error("K-means constructor not found.");
            
            const k = params.k || 4;
            const options = {
                maxIterations: 100,
                tolerance: 1e-6,
                withInterClusterDistance: true
            };
            
            const kmeans = new KMeans(data, k, options);
            clusters = kmeans.clusters;

            if (params.runElbow) {
                elbowData = [];
                for (let i = 1; i <= 10; i++) {
                    const km = new KMeans(data, i, options);
                    let sse = 0;
                    const centroids = km.centroids;
                    for (let j = 0; j < data.length; j++) {
                        const clusterIdx = km.clusters[j];
                        const centroidObj = centroids[clusterIdx];
                        const centroid = centroidObj.centroid || centroidObj;
                        let dist = 0;
                        for (let d = 0; d < data[j].length; d++) {
                            dist += Math.pow(data[j][d] - centroid[d], 2);
                        }
                        sse += dist;
                    }
                    elbowData.push(sse);
                }
            }
        } else if (method === 'dbscan') {
            const DBSCAN = self.densityClustering ? self.densityClustering.DBSCAN : getMLRef('DBSCAN');
            if (!DBSCAN) throw new Error("DBSCAN constructor not found in densityClustering or globals.");
            
            const epsilon = params.epsilon || 0.5;
            const minPoints = params.minPoints || 5;
            const dbscan = new DBSCAN();
            
            // Fix: Scale the distance threshold by the square root of dimensions. 
            // Standard scaling increases pairwise distances as dimensions increase. 
            // Without scaling, DBSCAN falls into a single cluster or pure noise unexpectedly.
            const dims = data[0] ? data[0].length : 2;
            const dynamicEpsilon = epsilon * Math.sqrt(dims / 2.0); 
            console.log(`[Clustering Worker] DBSCAN dynamic eps: ${dynamicEpsilon.toFixed(3)} (base: ${epsilon}, dims: ${dims})`);
            
            const groupClusters = dbscan.run(data, dynamicEpsilon, minPoints);
            
            // Map array format [[0, 1], [2, 3]] to labels array with -1 for noise
            const labels = new Array(data.length).fill(-1);
            groupClusters.forEach((clusterIndices, clusterId) => {
                clusterIndices.forEach(idx => {
                    labels[idx] = clusterId;
                });
            });
            clusters = labels;
        } else if (method === 'hierarchical') {
            const hclustMethod = self.mlHclust || self.agnes;
            if (!hclustMethod) throw new Error("Hierarchical Clustering library not found in globals.");
            
            const K = params.k || 4;
            const linkage = params.linkage || 'ward';
            
            const tree = hclustMethod(data, { method: linkage });
            
            // Extract exactly K clusters by cutting the dendrogram tree greedily
            let q = [tree];
            while(q.length < K && q.length > 0) {
                // sort by height to always split the most dissimilar macro-cluster first
                q.sort((a,b) => b.height - a.height);
                let biggest = q.shift();
                if (biggest.children && biggest.children.length > 0) {
                    q.push(...biggest.children);
                } else {
                    q.push(biggest); // Cannot split a leaf, pushing back to preserve count
                    break;
                }
            }
            
            // Map the parsed nodes back to a flat labels array
            const labels = new Array(data.length).fill(-1);
            q.forEach((clusterNode, clusterId) => {
                const nodeIndices = clusterNode.indices();
                nodeIndices.forEach(idx => {
                    labels[idx] = clusterId;
                });
            });
            
            clusters = labels;
        }

        self.postMessage({ type: 'complete', results: { clusters, elbowData } });
    } catch (err) {
        console.error(`[Clustering Worker] ${method} failed:`, err);
        self.postMessage({ type: 'error', message: err.message });
    }
};

function runTSNE(data, params) {
    const tsneLib = self.tsnejs || self.tsne;
    if (!tsneLib || !tsneLib.tSNE) throw new Error("t-SNE library not found in worker. Globals: " + Object.keys(self).filter(k => k.toLowerCase().includes('tsne')).join(', '));

    const model = new tsneLib.tSNE({
        epsilon: params.epsilon || 10,
        perplexity: params.perplexity || 30,
        dim: 2
    });

    model.initDataRaw(data);
    const iterations = params.iterations || 200;
    for (let k = 0; k < iterations; k++) {
        model.step();
        if (k % 50 === 0) {
            self.postMessage({ type: 'progress', progress: (k / iterations) * 100 });
        }
    }
    return model.getSolution();
}

function runUMAP(data, params) {
    const umapLib = self.UMAP?.UMAP || self.UMAP || self.umap?.UMAP || self.umap;
    if (!umapLib) throw new Error("UMAP library not found in worker.");

    const umapOptions = {
        nNeighbors: params.nNeighbors || 15,
        minDist: params.minDist || 0.1,
        nComponents: 2
    };

    const umap = new umapLib(umapOptions);
    return umap.fit(data);
}
