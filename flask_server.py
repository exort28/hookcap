from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import json
import os

app = Flask(__name__)
CORS(app)

# ComfyUI settings
COMFY_API_URL = "http://127.0.0.1:8188"  # Default ComfyUI server address

class ComfyUIInterface:
    def __init__(self):
        self.api_url = COMFY_API_URL
        self.client_id = self.get_client_id()

    def get_client_id(self):
        return str(os.urandom(16).hex())

    def create_workflow(self, settings, reference_url, prompt):
        """Create ComfyUI workflow based on settings"""
        workflow = {
            "3": {
                "inputs": {
                    "ckpt_name": "sd_xl_base_1.0.safetensors"
                },
                "class_type": "CheckpointLoaderSimple"
            },
            "4": {
                "inputs": {
                    "text": prompt,
                    "clip": ["3", 1]
                },
                "class_type": "CLIPTextEncode"
            },
            "5": {
                "inputs": {
                    "samples": ["10", 0],
                    "vae": ["3", 2],
                    "steps": 20,
                    "cfg": 8 + (settings['exaggeration'] / 100 * 4),
                    "sampler_name": "euler_ancestral",
                    "scheduler": "normal",
                    "denoise": 1,
                    "model": ["3", 0],
                    "positive": ["4", 0],
                    "negative": ["6", 0],
                    "latent_image": ["8", 0]
                },
                "class_type": "KSampler"
            },
            "6": {
                "inputs": {
                    "text": "ugly, blurry, low quality",
                    "clip": ["3", 1]
                },
                "class_type": "CLIPTextEncode"
            },
            "8": {
                "inputs": {
                    "width": 1024,
                    "height": 576,
                    "batch_size": 1
                },
                "class_type": "EmptyLatentImage"
            },
            "10": {
                "inputs": {
                    "samples": ["5", 0],
                    "vae": ["3", 2]
                },
                "class_type": "VAEDecode"
            },
            # Color adjustment based on settings
            "11": {
                "inputs": {
                    "image": ["10", 0],
                    "saturation": 1 + (settings['colorIntensity'] / 100 * 0.5),
                    "contrast": 1 + (settings['colorIntensity'] / 100 * 0.3),
                    "brightness": 1 + (settings['colorIntensity'] / 100 * 0.2)
                },
                "class_type": "ColorAdjustment"
            }
        }
        
        return workflow

    def queue_prompt(self, workflow):
        """Queue the prompt in ComfyUI"""
        try:
            response = requests.post(f"{self.api_url}/prompt", json={
                "prompt": workflow,
                "client_id": self.client_id
            })
            return response.json()
        except Exception as e:
            print(f"Error queuing prompt: {e}")
            return None

    def get_image(self, prompt_id):
        """Get the generated image from ComfyUI"""
        try:
            response = requests.get(f"{self.api_url}/history/{prompt_id}")
            history = response.json()
            
            if prompt_id in history:
                outputs = history[prompt_id]["outputs"]
                if outputs and "images" in outputs:
                    return outputs["images"][0]
            return None
        except Exception as e:
            print(f"Error getting image: {e}")
            return None

comfy_interface = ComfyUIInterface()

@app.route('/generate', methods=['POST'])
def generate_thumbnail():
    try:
        data = request.json
        settings = data.get('settings', {})
        reference_url = data.get('reference', '')
        prompt = data.get('prompt', '')

        # Create workflow
        workflow = comfy_interface.create_workflow(settings, reference_url, prompt)
        
        # Queue prompt
        queue_response = comfy_interface.queue_prompt(workflow)
        if not queue_response:
            return jsonify({"error": "Failed to queue prompt"}), 500

        # Get prompt ID
        prompt_id = queue_response.get("prompt_id")
        if not prompt_id:
            return jsonify({"error": "No prompt ID received"}), 500
        
        # Wait a bit for generation
        import time
        time.sleep(5)  # Give some time for generation
        
        # Get image
        image_data = comfy_interface.get_image(prompt_id)
        if not image_data:
            return jsonify({"error": "Failed to generate image"}), 500

        return jsonify({
            "success": True,
            "image": image_data
        })

    except Exception as e:
        print(f"Error: {str(e)}")
        return jsonify({"error": str(e)}), 500

if __name__ == '__main__':
    app.run(debug=True, port=5000)