class ThumbnailController {
    constructor() {
        this.settings = {
            exaggeration: 50,
            colorIntensity: 50,
            faceEmphasis: 50,
            objectScaling: 50,
            textSize: 50
        };
        
        this.referenceUrl = '';
        this.userPrompt = '';
        this.currentPreset = 'balanced';
        
        this.initializeElements();
        this.setupEventListeners();
    }

    initializeElements() {
        // Input elements
        this.referenceInput = document.getElementById('referenceUrl');
        this.promptInput = document.getElementById('userPrompt');
        
        // Slider elements
        this.sliders = {
            exaggeration: document.getElementById('exaggeration'),
            colorIntensity: document.getElementById('colorIntensity'),
            faceEmphasis: document.getElementById('faceEmphasis'),
            objectScaling: document.getElementById('objectScaling'),
            textSize: document.getElementById('textSize')
        };
        
        // Buttons
        this.presetButtons = document.querySelectorAll('.preset-btn');
        this.generateButton = document.getElementById('generateBtn');
    }

    setupEventListeners() {
        // Input listeners
        this.referenceInput.addEventListener('input', (e) => {
            this.referenceUrl = e.target.value;
        });

        this.promptInput.addEventListener('input', (e) => {
            this.userPrompt = e.target.value;
        });

        // Slider listeners
        Object.entries(this.sliders).forEach(([key, slider]) => {
            slider.addEventListener('input', (e) => {
                this.settings[key] = parseInt(e.target.value);
                this.updatePresetButtons('custom');
            });
        });

        // Preset button listeners
        this.presetButtons.forEach(button => {
            button.addEventListener('click', () => {
                this.applyPreset(button.dataset.preset);
            });
        });

        // Generate button listener
        this.generateButton.addEventListener('click', () => {
            this.generateThumbnail();
        });
    }

    applyPreset(preset) {
        this.currentPreset = preset;
        
        // Update UI to show active preset
        this.presetButtons.forEach(button => {
            button.classList.toggle('active', button.dataset.preset === preset);
        });

        // Apply preset values
        switch(preset) {
            case 'subtle':
                this.updateSettings({
                    exaggeration: 20,
                    colorIntensity: 30,
                    faceEmphasis: 40,
                    objectScaling: 30,
                    textSize: 40
                });
                break;
            case 'balanced':
                this.updateSettings({
                    exaggeration: 50,
                    colorIntensity: 50,
                    faceEmphasis: 50,
                    objectScaling: 50,
                    textSize: 50
                });
                break;
            case 'extreme':
                this.updateSettings({
                    exaggeration: 100,
                    colorIntensity: 90,
                    faceEmphasis: 95,
                    objectScaling: 85,
                    textSize: 90
                });
                break;
        }
    }

    updateSettings(newSettings) {
        // Update internal settings
        this.settings = { ...this.settings, ...newSettings };
        
        // Update slider positions
        Object.entries(newSettings).forEach(([key, value]) => {
            if (this.sliders[key]) {
                this.sliders[key].value = value;
            }
        });
    }

    generateThumbnail() {
        // Validate inputs
        if (!this.referenceUrl) {
            alert('Please enter a reference thumbnail URL');
            return;
        }

        if (!this.userPrompt) {
            alert('Please enter a prompt for your thumbnail');
            return;
        }

        // Prepare data for API
        const generationData = {
            reference: this.referenceUrl,
            prompt: this.userPrompt,
            settings: this.settings,
            preset: this.currentPreset
        };

        // Convert settings to ComfyUI parameters
        const workflowParams = this.convertSettingsToWorkflow(this.settings);
        
        console.log('Generating thumbnail with parameters:', generationData);
        console.log('ComfyUI workflow parameters:', workflowParams);
        
        // Here you would make the API call to your backend
        this.callComfyUIApi(workflowParams);
    }

    convertSettingsToWorkflow(settings) {
        // Convert slider values (0-100) to ComfyUI parameters
        return {
            color_adjustment: {
                saturation: 1 + (settings.colorIntensity / 100) * 0.5,
                contrast: 1 + (settings.colorIntensity / 100) * 0.3,
                vibrance: 1 + (settings.colorIntensity / 100) * 0.4
            },
            face_enhancement: {
                scale: 1 + (settings.faceEmphasis / 100) * 0.3,
                detail_strength: settings.faceEmphasis / 100
            },
            object_scaling: {
                scale_factor: 1 + (settings.objectScaling / 100) * 0.5
            },
            text_params: {
                size_multiplier: 1 + (settings.textSize / 100) * 0.5
            }
        };
    }

    async callComfyUIApi(params) {
        // Placeholder for API call to ComfyUI
        // You would implement this based on your backend setup
        try {
            console.log('Calling ComfyUI API with parameters:', params);
            // const response = await fetch('your-api-endpoint', {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify(params)
            // });
            // const result = await response.json();
            // Update preview with generated thumbnail
        } catch (error) {
            console.error('Error generating thumbnail:', error);
            alert('Error generating thumbnail. Please try again.');
        }
    }
}

// Initialize the controller when the page loads
document.addEventListener('DOMContentLoaded', () => {
    const controller = new ThumbnailController();
});