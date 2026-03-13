/**
 * ML Web Worker for Predictive Analysis
 * Handles heavy computations for Tree, SVM, KNN, etc.
 */

const ML_CDNS = [
    'lib/ml.min.js',
    'https://www.lactame.com/lib/ml/6.0.0/ml.min.js',
    'https://cdn.jsdelivr.net/npm/ml@6.0.0/dist/ml.min.js'
];

let mlLoaded = false;
for (const url of ML_CDNS) {
    try {
        self.importScripts(url);
        if (typeof ML !== 'undefined') {
            mlLoaded = true;
            console.log("Worker: ML Library loaded from " + url);
            break;
        }
    } catch (e) {
        console.warn("Worker: Failed to load ML from " + url);
    }
}

// Check internal components of ML bundle
let GBM_Loaded = typeof ML !== 'undefined' && (ML.GradientBoostingClassifier || ML.GradientBoostingRegressor);
let XGB_Loaded = false;
let FNN_Loaded = typeof ML !== 'undefined' && !!ML.FNN;

// Load FNN (Neural Network) - Check bundle first, then standalone
if (!FNN_Loaded) {
    try {
        const FNN_CDNS = [
            'https://cdn.jsdelivr.net/npm/ml-fnn@5.0.0/FeedForwardNeuralNetwork.min.js'
        ];
        for (const url of FNN_CDNS) {
            try {
                self.importScripts(url);
                if (typeof FNN !== 'undefined' || (typeof ML !== 'undefined' && ML.FNN)) {
                    FNN_Loaded = true;
                    console.log("Worker: FNN loaded from " + url);
                    break;
                }
            } catch (e) {
                console.warn("Worker: Failed to load FNN from " + url);
            }
        }
    } catch (e) {
        console.error("Worker: FNN Loading Error", e);
    }
}

// Load Gradient Boosting - Check bundle first
if (!GBM_Loaded) {
    try {
        const GBM_CDNS = [
            'https://cdn.jsdelivr.net/npm/ml-gradient-boosting@1.0.1/dist/ml-gradient-boosting.min.js'
        ];
        for (const url of GBM_CDNS) {
            try {
                self.importScripts(url);
                if (typeof GradientBoostingClassifier !== 'undefined' || (typeof ML !== 'undefined' && (ML.GradientBoostingClassifier || ML.GradientBoostingRegressor))) {
                    GBM_Loaded = true;
                    console.log("Worker: Gradient Boosting loaded from " + url);
                    break;
                }
            } catch (e) {
                console.warn("Worker: Failed to load GBM from " + url);
            }
        }
    } catch (e) {
        console.error("Worker: GBM Loading Error", e);
    }
}

// Load XGBoost - use local fixed version
try {
    const XGB_CDNS = [
        'lib/xgboost.min.js',
        'https://cdn.jsdelivr.net/npm/@fractal-solutions/xgboost-js@1.0.0/src/xgboost.min.js'
    ];
    for (const url of XGB_CDNS) {
        try {
            self.importScripts(url);
            // Check self.XGBoost (our local fix) or global XGBoost
            if (typeof self.XGBoost !== 'undefined' || typeof XGBoost !== 'undefined') {
                XGB_Loaded = true;
                console.log("Worker: XGBoost loaded from " + url);
                break;
            }
        } catch (e) {
            console.warn("Worker: Failed to load XGBoost from " + url);
        }
    }
} catch (e) {
    console.error("Worker: XGBoost Loading Error", e);
}

// Global debug helper
function logAvailableModels() {
    if (typeof ML === 'undefined') return "ML Undefined";
    return Object.keys(ML).filter(k => typeof ML[k] === 'function' || typeof ML[k] === 'object').join(', ');
}

function reportProgress(percent, status) {
    self.postMessage({ type: 'progress', percent, status });
}

function extractFeatureImportance(model, algorithm, X, y) {
    try {
        if (algorithm === 'rf') {
            return model.getFeatureImportance();
        } else if (algorithm === 'xgb' || (algorithm === 'gbm' && XGB_Loaded)) {
            return model.getFeatureImportance ? model.getFeatureImportance() : null;
        } else if (algorithm === 'linear') {
            if (model.weights) {
                return model.weights.slice(1).map(w => Math.abs(w[0]));
            } else if (model.slope !== undefined) {
                return [Math.abs(model.slope)];
            }
        }
        
        // Fallback for KNN, NN, and other "Black Box" models: Univariate Correlation
        if (algorithm === 'knn' || algorithm === 'nn' || algorithm === 'gbm') {
            return calculateCorrelationImportance(X, y);
        }
    } catch (e) {
        console.warn("Worker: Feature Importance Error", e);
    }
    return null;
}

/**
 * Fallback importance for non-parametric or deep models using Pearson Correlation
 */
function calculateCorrelationImportance(X, y) {
    if (!X.length || !y.length) return null;
    const numFeatures = X[0].length;
    let importances = [];

    for (let i = 0; i < numFeatures; i++) {
        const xVals = X.map(row => row[i]);
        // Simple Pearson Correlation
        const n = xVals.length;
        const meanX = xVals.reduce((a, b) => a + b, 0) / n;
        const meanY = y.reduce((a, b) => a + b, 0) / n;
        
        let num = 0, denX = 0, denY = 0;
        for (let j = 0; j < n; j++) {
            const dx = xVals[j] - meanX;
            const dy = y[j] - meanY;
            num += dx * dy;
            denX += dx * dx;
            denY += dy * dy;
        }
        const r = Math.abs(num / Math.sqrt(denX * denY || 1));
        importances.push(r);
    }
    return importances;
}

function performInference(model, X, algorithm, analysisType) {
    let raw = [];
    if (algorithm === 'xgb' || (algorithm === 'gbm' && XGB_Loaded)) {
        raw = model.predictBatch(X);
    } else if (algorithm === 'linear') {
        if (typeof ML.MultivariateLinearRegression === 'function' && model instanceof ML.MultivariateLinearRegression) {
            raw = model.predict(X).map(p => p[0]);
        } else {
            raw = model.predict(X.map(r => r[0]));
        }
    } else {
        raw = model.predict(X);
    }

    if (analysisType === 'classification') {
        // For classification, labels are discrete, scores are continuous (probabilities)
        const labels = raw.map(p => {
            if (typeof p === 'number') return p > 0.5 ? 1 : 0;
            return p; // Assuming it's already a label from ML.js
        });
        return { labels, scores: raw };
    }
    
    return { labels: raw, scores: raw };
}

self.onmessage = function(e) {
    const { data, config } = e.data;
    
    try {
        if (!data || !config) {
            throw new Error("Missing data or configuration in Worker payload.");
        }

        const { algorithm, hyperparams, analysisType, targetVar, inputVars } = config;

        reportProgress(20, `Training ${algorithm.toUpperCase()} Model...`);

        // Prepare matrices
        const y = data.train.map(r => analysisType === 'classification' ? r._target_class : r[targetVar]);
        const X = data.train.map(r => inputVars.map(v => r[v]));
        
        const X_test = data.test.map(r => inputVars.map(v => r[v]));
        let y_test = data.test.map(r => analysisType === 'classification' ? r._target_class : r[targetVar]);

        // Target Scaling for Regression (Critical for NN/XGB)
        let yMin = 0, yMax = 1;
        if (analysisType === 'regression' && (algorithm === 'nn' || algorithm === 'xgb' || algorithm === 'gbm')) {
            const allY = [...y, ...y_test];
            yMin = Math.min(...allY);
            yMax = Math.max(...allY);
            const range = (yMax - yMin) || 1;
            
            // Scale training y
            for (let i = 0; i < y.length; i++) y[i] = (y[i] - yMin) / range;
            // Scale test y for internal comparison if needed (though metrics use original)
        }

        let model;
        let predictions = [];

        if (analysisType === 'classification') {
            switch(algorithm) {
                case 'rf':
                    const rfOptions = { ...hyperparams, seed: 42 };
                    if (rfOptions.numTrees) {
                        rfOptions.nEstimators = rfOptions.numTrees;
                        delete rfOptions.numTrees;
                    } else if (!rfOptions.nEstimators) {
                        rfOptions.nEstimators = 30; // Lightweight default
                    }
                    if (typeof ML.RandomForestClassifier === 'function') {
                        model = new ML.RandomForestClassifier(rfOptions);
                    } else if (ML.RandomForest && typeof ML.RandomForest.Classifier === 'function') {
                        model = new ML.RandomForest.Classifier(rfOptions);
                    } else {
                        throw new Error(`Random Forest Classifier not found. Available: ${logAvailableModels()}`);
                    }
                    
                    reportProgress(30, "Training Forest [Growing Trees]...");
                    model.train(X, y);
                    break;
                case 'gbm':
                    if (GBM_Loaded) {
                        const Constructor = typeof GradientBoostingClassifier !== 'undefined' ? GradientBoostingClassifier : (ML.GradientBoostingClassifier || ML.GradientBoostingRegressor);
                        model = new Constructor(hyperparams);
                        reportProgress(40, "Running Sequential Gradient Correction [GBM]...");
                        model.train(X, y);
                    } else if (XGB_Loaded) {
                        // Fallback to XGBoost if GBM library is missing
                        const Constructor = self.XGBoost || XGBoost;
                        const xgbParams = { 
                            numRounds: hyperparams.nEstimators || 100,
                            learningRate: hyperparams.learningRate || 0.1,
                            maxDepth: hyperparams.maxDepth || 3
                        };
                        model = new Constructor(xgbParams);
                        reportProgress(40, "Falling back to XGBoost for Gradient Boosting...");
                        model.fit(X, y);
                    } else {
                        throw new Error("Gradient Boosting library failed to initialize. Try Random Forest.");
                    }
                    break;
                case 'xgb':
                    if (XGB_Loaded) {
                        const Constructor = self.XGBoost || XGBoost;
                        if (!Constructor) throw new Error("XGBoost Constructor not found in global scope.");
                        // Error check: this XGBoost JS implementation is binary ONLY
                        const uniqueClasses = [...new Set(y)];
                        if (uniqueClasses.length > 2) {
                            throw new Error(`XGBoost (JS) is optimized for binary outcomes. Your current target "${targetVar}" has been divided into ${uniqueClasses.length} categories. For multi-tier classification, please select Random Forest, Neural Network, or GBM.`);
                        }
                        const xgbParams = { 
                            numRounds: hyperparams.nEstimators || 100,
                            learningRate: hyperparams.learningRate || 0.1,
                            maxDepth: hyperparams.maxDepth || 3
                        };
                        model = new Constructor(xgbParams);
                        reportProgress(40, "Executing Optimized Gradient Boosting [XGB]...");
                        model.fit(X, y);
                    } else {
                        throw new Error("XGBoost library failed to load. Check CDN connectivity.");
                    }
                    break;
                case 'nn':
                    if (FNN_Loaded) {
                        const Constructor = typeof FNN !== 'undefined' ? FNN : ML.FNN;
                        const nHidden = parseInt(hyperparams.hiddenLayers || 2);
                        const nNeurons = parseInt(hyperparams.neuronsPerLayer || 12);
                        const nEpochs = parseInt(hyperparams.iterations || 200);
                        
                        // Build layer array
                        const hiddenArray = Array(nHidden).fill(nNeurons);
                        
                        model = new Constructor({
                            hiddenLayers: hiddenArray,
                            iterations: nEpochs,
                            learningRate: parseFloat(hyperparams.learningRate || 0.1),
                            activation: 'sigmoid'
                        });
                        
                        reportProgress(40, `Training Neural Network (${nHidden} layers)...`);
                        model.train(X, y);
                    } else {
                        throw new Error("Neural Network library failed to load.");
                    }
                    break;
                case 'knn':
                    if (typeof ML.KNN === 'function') {
                        model = new ML.KNN(X, y, hyperparams);
                    } else {
                        throw new Error(`KNN not found. Available: ${logAvailableModels()}`);
                    }
                    reportProgress(50, "KNN Proximity Analysis [Scanning Neighbors]...");
                    break;
                case 'cart':
                    if (typeof ML.DecisionTreeClassifier === 'function') {
                        model = new ML.DecisionTreeClassifier(hyperparams);
                    } else {
                        throw new Error(`Decision Tree Classifier not found. Available: ${logAvailableModels()}`);
                    }
                    model.train(X, y);
                    break;
                case 'nb':
                    if (typeof ML.GaussianNB === 'function') {
                        model = new ML.GaussianNB();
                    } else if (ML.NaiveBayes && typeof ML.NaiveBayes.GaussianNB === 'function') {
                        model = new ML.NaiveBayes.GaussianNB();
                    } else {
                        throw new Error(`Naive Bayes not found. Available: ${logAvailableModels()}`);
                    }
                    model.train(X, y);
                    break;
            }
        } else {
            // Regression models
            switch(algorithm) {
                case 'rf':
                    const rfRegOptions = { ...hyperparams, seed: 42 };
                    if (!rfRegOptions.nEstimators) rfRegOptions.nEstimators = 30;
                    if (typeof ML.RandomForestRegression === 'function') {
                        model = new ML.RandomForestRegression(rfRegOptions);
                    } else if (ML.RandomForest && typeof ML.RandomForest.Regression === 'function') {
                        model = new ML.RandomForest.Regression(rfRegOptions);
                    } else {
                        throw new Error(`Random Forest Regression not found. Available: ${logAvailableModels()}`);
                    }
                    model.train(X, y);
                    break;
                case 'gbm':
                    if (GBM_Loaded) {
                        const Constructor = typeof GradientBoostingRegressor !== 'undefined' ? GradientBoostingRegressor : (ML.GradientBoostingRegressor || ML.GradientBoostingClassifier);
                        model = new Constructor(hyperparams);
                        reportProgress(40, "Solving Residuals via Gradient Boosting [Regression]...");
                        model.train(X, y);
                    } else if (XGB_Loaded) {
                        const Constructor = self.XGBoost || XGBoost;
                        const xgbParams = { 
                            numRounds: hyperparams.nEstimators || 100,
                            learningRate: hyperparams.learningRate || 0.1,
                            maxDepth: hyperparams.maxDepth || 3
                        };
                        model = new Constructor(xgbParams);
                        reportProgress(40, "Falling back to XGBoost for Gradient Boosting Regression...");
                        model.fit(X, y);
                    } else {
                        throw new Error("GBM Regressor not loaded.");
                    }
                    break;
                case 'nn':
                    if (FNN_Loaded) {
                        const Constructor = typeof FNN !== 'undefined' ? FNN : ML.FNN;
                        const nHidden = parseInt(hyperparams.hiddenLayers || 2);
                        const nNeurons = parseInt(hyperparams.neuronsPerLayer || 12);
                        const nEpochs = parseInt(hyperparams.iterations || 200);
                        const hiddenArray = Array(nHidden).fill(nNeurons);

                        model = new Constructor({
                            hiddenLayers: hiddenArray,
                            iterations: nEpochs,
                            learningRate: parseFloat(hyperparams.learningRate || 0.05),
                            activation: 'tanh'
                        });
                        reportProgress(40, "Optimizing Neural Network Weights...");
                        model.train(X, y);
                    } else {
                        throw new Error("NN Regressor not loaded.");
                    }
                    break;
                case 'xgb':
                    if (XGB_Loaded) {
                        const Constructor = self.XGBoost || XGBoost;
                        const xgbParams = { 
                            numRounds: hyperparams.nEstimators || 100,
                            learningRate: hyperparams.learningRate || 0.1,
                            maxDepth: hyperparams.maxDepth || 3
                        };
                        model = new Constructor(xgbParams);
                        model.fit(X, y);
                    } else {
                        throw new Error("XGBoost Regressor not loaded.");
                    }
                    break;
                case 'cart':
                    if (typeof ML.DecisionTreeRegression === 'function') {
                        model = new ML.DecisionTreeRegression(hyperparams);
                    } else if (ML.DecisionTree && typeof ML.DecisionTree.Regression === 'function') {
                        model = new ML.DecisionTree.Regression(hyperparams);
                    } else {
                        throw new Error(`Decision Tree Regression not found. Available: ${logAvailableModels()}`);
                    }
                    model.train(X, y);
                    break;
                case 'linear':
                    // Use MultivariateLinearRegression for OLS
                    if (typeof ML.MultivariateLinearRegression === 'function') {
                        model = new ML.MultivariateLinearRegression(X, y.map(val => [val]));
                    } else {
                        // Fallback to SimpleLinearRegression if only 1 variable
                        model = new ML.SimpleLinearRegression(X.map(r => r[0]), y);
                    }
                    break;
            }
        }

        // Generate predictions using unified helper
        const testPred = performInference(model, X_test, algorithm, analysisType);
        const trainPred = performInference(model, X, algorithm, analysisType);

        // Inverse scaling for regression outputs
        if (analysisType === 'regression' && (algorithm === 'nn' || algorithm === 'xgb' || algorithm === 'gbm')) {
            const range = (yMax - yMin);
            testPred.labels = testPred.labels.map(p => p * range + yMin);
            testPred.scores = testPred.scores.map(s => s * range + yMin);
            trainPred.labels = trainPred.labels.map(p => p * range + yMin);
            trainPred.scores = trainPred.scores.map(s => s * range + yMin);
            
            // Also inverse scale the training Y for metrics calculation
            for (let i = 0; i < y.length; i++) y[i] = y[i] * range + yMin;
        }

        // Calculate basic metrics
        // Calculate basic metrics
        const results = {
            predictions: testPred.labels,
            actual: y_test,
            trainPredictions: trainPred.labels,
            trainActual: y,
            featureImportance: extractFeatureImportance(model, algorithm, X, y),
            metadata: {
                totalCount: data.train.length + data.test.length,
                trainCount: data.train.length,
                testCount: data.test.length,
                featureCount: X.length > 0 && X[0] ? X[0].length : 0
            },
            metrics: calculateMetrics(y_test, testPred, analysisType),
            trainMetrics: calculateMetrics(y, trainPred, analysisType)
        };

        self.postMessage({ success: true, results });

    } catch (err) {
        self.postMessage({ success: false, error: err.message });
    }
};

function calculateMetrics(actual, predObj, type) {
    const predicted = predObj.labels;
    const scores = predObj.scores;

    if (type === 'classification') {
        const n = Math.max(actual.length, 1);
        const correct = actual.filter((a, i) => a === predicted[i]).length;
        const accuracy = (correct / n).toFixed(4);

        // Find unique classes
        const classes = [...new Set(actual)].sort();
        
        // Macro-averaging for Multi-class
        let sumPrecision = 0, sumRecall = 0, sumF1 = 0;
        let validClasses = 0;
        
        classes.forEach(c => {
            const tp = actual.filter((a, i) => a === c && predicted[i] === c).length;
            const fp = actual.filter((a, i) => a !== c && predicted[i] === c).length;
            const fn = actual.filter((a, i) => a === c && predicted[i] !== c).length;
            
            const p = tp / (tp + fp) || 0;
            const r = tp / (tp + fn) || 0;
            const f = (2 * p * r) / (p + r) || 0;
            
            if (actual.includes(c)) {
                sumPrecision += p;
                sumRecall += r;
                sumF1 += f;
                validClasses++;
            }
        });

        const precision = sumPrecision / Math.max(validClasses, 1);
        const recall = sumRecall / Math.max(validClasses, 1);
        const f1 = sumF1 / Math.max(validClasses, 1);

        // Area Under Curve (AUC)
        // If we have continuous scores, use them for a proper ranking-based AUC
        let totalAuc = 0;
        let aucPairs = 0;

        if (classes.length >= 2) {
            // Treat as macro-averaged binary AUC for multiclass
            for (let i = 0; i < classes.length; i++) {
                for (let j = i + 1; j < classes.length; j++) {
                    const c1 = classes[i];
                    const c2 = classes[j];
                    
                    // Filter pairs of c1 and c2
                    const pairIndices = [];
                    actual.forEach((a, idx) => {
                        if (a === c1 || a === c2) pairIndices.push(idx);
                    });

                    if (pairIndices.length > 0) {
                        const subActual = pairIndices.map(idx => actual[idx]);
                        const subScores = pairIndices.map(idx => {
                            // If score is a number, use it. If it's a label, use label as score.
                            const s = scores[idx];
                            return typeof s === 'number' ? s : (predicted[idx] === c2 ? 1 : 0);
                        });

                        const posCount = subActual.filter(a => a === c2).length;
                        const negCount = subActual.filter(a => a === c1).length;

                        if (posCount > 0 && negCount > 0) {
                            // Calculate AUC for this pair
                            let count = 0;
                            subActual.forEach((a1, i1) => {
                                if (a1 === c2) { // Positive
                                    subActual.forEach((a2, i2) => {
                                        if (a2 === c1) { // Negative
                                            if (subScores[i1] > subScores[i2]) count++;
                                            else if (subScores[i1] === subScores[i2]) count += 0.5;
                                        }
                                    });
                                }
                            });
                            totalAuc += count / (posCount * negCount);
                            aucPairs++;
                        }
                    }
                }
            }
        }
        
        const auc = aucPairs > 0 ? (totalAuc / aucPairs) : 0.5;

        return {
            "Accuracy": accuracy,
            "Precision": precision.toFixed(4),
            "Recall": recall.toFixed(4),
            "F1-Score": f1.toFixed(4),
            "AUC": auc.toFixed(4)
        };
    } else {
        // Regression
        const n = Math.max(actual.length, 1);
        const diffs = actual.map((a, i) => a - predicted[i]);
        const mse = diffs.reduce((sum, d) => sum + d * d, 0) / n;
        const rmse = Math.sqrt(mse);
        const mae = diffs.reduce((sum, d) => sum + Math.abs(d), 0) / n;
        
        const meanActual = actual.reduce((s, v) => s + v, 0) / n;
        const ssTot = actual.reduce((s, v) => s + Math.pow(v - meanActual, 2) || 0, 0);
        const ssRes = diffs.reduce((s, d) => s + d * d, 0);
        const r2 = 1 - (ssRes / (ssTot || 1));

        return {
            "MSE": mse.toFixed(4),
            "RMSE": rmse.toFixed(4),
            "MAE": mae.toFixed(4),
            "R\u00b2 Score": r2.toFixed(4)
        };
    }
}
