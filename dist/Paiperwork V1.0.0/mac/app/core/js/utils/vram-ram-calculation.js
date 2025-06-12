class vramramcalculator {

//Future plans for this class:
// - Add support for VRAM/RAM available for context calculated using system free VRAM/RAM. (It's tricky cause requires system access) and this is not 
//  possible in browser environment, needs to be done through a our server API, also not very privacy friendly. Only to be implemented if there is a way to keep user provacy intact.


    // Saves the context size for a specific model, optionally marking it as calculated or manual.
    async saveModelSpecificContextSize(hashedMasterKey, modelName, contextSize, isKvcacheQ8, useCalculated = false) {
        //console.log('💾 vramramcalculator: Saving model-specific context:', {
            //model: modelName,
            //contextSize: contextSize,
            //isKvcacheQ8: isKvcacheQ8,
            //useCalculated: useCalculated
        //});

        try {
            await PaiperworkDB.saveModelContextSize(hashedMasterKey, modelName, contextSize, isKvcacheQ8, useCalculated);
            localStorage.setItem('contextSize', contextSize.toString());

            //console.log(`✅ vramramcalculator: Saved ${useCalculated ? 'CALCULATED' : 'MANUAL'} context size ${contextSize} for model ${modelName}`);
        } catch (error) {
            console.error('❌ vramramcalculator: Error saving model-specific context size:', error);
        }
    }

    // Loads the native context size for a model from its metadata and updates the selector.
    async loadNativeContextForModel(selectedModel, hashedMasterKey, contextSelector) {
        //console.log('🔍 vramramcalculator: Starting native context loading for:', selectedModel);

        try {
            const modelMetadata = await OllamaAPI.fetchModelMetadata(selectedModel);
            //console.log('📡 vramramcalculator: Model metadata received for', selectedModel);

            let nativeContextSize = null;

            // Check for parameters.num_ctx or parameters.context_length
            if (modelMetadata.parameters) {
                if (modelMetadata.parameters.num_ctx) {
                    nativeContextSize = parseInt(modelMetadata.parameters.num_ctx);
                } else if (modelMetadata.parameters.context_length) {
                    nativeContextSize = parseInt(modelMetadata.parameters.context_length);
                }
            }

            // If not found, check model_info for [family].context_length pattern
            if (!nativeContextSize && modelMetadata.model_info) {
                let modelFamily = '';
                if (modelMetadata.details && modelMetadata.details.family) {
                    modelFamily = modelMetadata.details.family.toLowerCase();
                }

                if (modelFamily && modelMetadata.model_info[`${modelFamily}.context_length`]) {
                    nativeContextSize = parseInt(modelMetadata.model_info[`${modelFamily}.context_length`]);
                } else {
                    for (const key in modelMetadata.model_info) {
                        if (key.endsWith('.context_length')) {
                            nativeContextSize = parseInt(modelMetadata.model_info[key]);
                            break;
                        }
                    }
                }
            }

            if (nativeContextSize) {
                const contextToSet = Math.min(nativeContextSize, 10485760);

                // Add to dropdown if it doesn't exist
                let sizeExists = false;
                for (let i = 0; i < contextSelector.options.length; i++) {
                    if (parseInt(contextSelector.options[i].value) === contextToSet) {
                        sizeExists = true;
                        break;
                    }
                }

                if (!sizeExists) {
                    const option = document.createElement('option');
                    option.value = contextToSet;
                    option.textContent = contextToSet >= 1048576 ? `${contextToSet / 1048576}M` :
                        contextToSet >= 1024 ? `${contextToSet / 1024}K` : contextToSet;

                    let insertIndex = 0;
                    while (insertIndex < contextSelector.options.length &&
                        parseInt(contextSelector.options[insertIndex].value) < contextToSet) {
                        insertIndex++;
                    }

                    if (insertIndex < contextSelector.options.length) {
                        contextSelector.insertBefore(option, contextSelector.options[insertIndex]);
                    } else {
                        contextSelector.appendChild(option);
                    }

                    try {
                        const customSizes = localStorage.getItem('customContextSizes') ?
                            JSON.parse(localStorage.getItem('customContextSizes')) : [];
                        if (!customSizes.includes(contextToSet)) {
                            customSizes.push(contextToSet);
                            localStorage.setItem('customContextSizes', JSON.stringify(customSizes));
                        }
                    } catch (error) {
                        console.error('Error saving custom context size:', error);
                    }
                }

                contextSelector.value = contextToSet.toString();
                localStorage.setItem('contextSize', contextToSet.toString());
                await PaiperworkDB.saveContextSize(hashedMasterKey, contextToSet.toString());

                //console.log(`✅ vramramcalculator: Native context size set to ${contextToSet} for model ${selectedModel}`);
            } else {
                const savedSize = localStorage.getItem('contextSize') || '8192';
                contextSelector.value = savedSize;
                //console.log(`⚠️ vramramcalculator: Default context size ${savedSize} applied for ${selectedModel}`);
            }
        } catch (error) {
            console.error('❌ vramramcalculator: Error loading native context:', error);
            const savedSize = localStorage.getItem('contextSize') || '8192';
            contextSelector.value = savedSize;
        }
    }

    // Loads the saved context size for a specific model and updates the selector.
    async loadModelSpecificContextSize(hashedMasterKey, modelName) {
        //console.log('🔍 vramramcalculator: Loading model-specific context for:', modelName);

        try {
            const contextData = await PaiperworkDB.loadModelContextSize(hashedMasterKey, modelName);

            if (contextData) {
                const contextSelector = document.getElementById('context-selector');
                if (contextSelector) {
                    // Add to dropdown if it doesn't exist
                    let sizeExists = false;
                    for (let i = 0; i < contextSelector.options.length; i++) {
                        if (parseInt(contextSelector.options[i].value) === contextData.contextSize) {
                            sizeExists = true;
                            break;
                        }
                    }

                    if (!sizeExists) {
                        const option = document.createElement('option');
                        option.value = contextData.contextSize;
                        option.textContent = contextData.contextSize >= 1048576 ?
                            `${contextData.contextSize / 1048576}M` :
                            contextData.contextSize >= 1024 ?
                                `${contextData.contextSize / 1024}K` :
                                `${contextData.contextSize}`;

                        let insertIndex = 0;
                        while (insertIndex < contextSelector.options.length &&
                            parseInt(contextSelector.options[insertIndex].value) < contextData.contextSize) {
                            insertIndex++;
                        }

                        if (insertIndex < contextSelector.options.length) {
                            contextSelector.insertBefore(option, contextSelector.options[insertIndex]);
                        } else {
                            contextSelector.appendChild(option);
                        }
                    }

                    contextSelector.value = contextData.contextSize.toString();
                    localStorage.setItem('contextSize', contextData.contextSize.toString());
                    await PaiperworkDB.saveContextSize(hashedMasterKey, contextData.contextSize.toString());

                    //console.log(`✅ vramramcalculator: Context applied: ${modelName} -> ${contextData.contextSize}`);
                }

                return contextData;
            }

            //console.log('⚠️ vramramcalculator: No model-specific context data found for:', modelName);
            return null;
        } catch (error) {
            console.error('❌ vramramcalculator: Error loading model-specific context size:', error);
            return null;
        }
    }
}

window.vramramcalculator = vramramcalculator;