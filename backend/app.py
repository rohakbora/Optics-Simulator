from flask import Flask, request, jsonify
from flask_cors import CORS
import requests
import os
from datetime import datetime

app = Flask(__name__)

# Configure CORS for production
CORS(app, origins=["*"])

# Get API key from environment variable
OPENROUTER_API_KEY = os.environ.get("OPENROUTER_API_KEY", "")

@app.route("/api/generate", methods=["POST"])
def generate():
    """
    Endpoint to receive user prompt and return optical components setup
    """
    try:
        data = request.json
        user_prompt = data.get("prompt", "")
        
        if not user_prompt:
            return jsonify({"error": "No prompt provided"}), 400
        
        if not OPENROUTER_API_KEY:
            return jsonify({"error": "OpenRouter API key not configured"}), 500
        
        # Create system prompt that instructs the LLM to return JSON
        system_prompt = """You are an expert optical system design assistant. When given a description of an optical setup, 
you must respond ONLY with a valid JSON object (no markdown, no explanations) in the following format:

{
  "version": "1.0",
  "timestamp": "2025-11-02T21:36:00.000Z",
  "components": [
    {
      "id": 1762100001001,
      "type": "laser",
      "position": {
        "x": 200,
        "y": 400
      },
      "properties": {
        "wavelength": 650,
        "intensity": 1,
        "angle": 0
      }
    }
  ]
}

Available component types:
- laser (source): properties: wavelength (380-750), intensity (0-1), angle (0-360)
- mirror: properties: reflectivity (0-1), angle (0-360), length (20-200)
- beam_splitter: properties: reflectivity (0-1), angle (0-360). Beam splitters cannot be placed at angles of 45 or 225 ever, this is a hard constraint.
- convex_lens (lens): properties: focalLength (positive), transparency (0-1), angle (0-360), diameter (20-150)
- concave_lens (lens): properties: focalLength (negative), transparency (0-1), angle (0-360), diameter (20-150)
- detector: properties: sensitivity (0-1), size (20-150)

Guidelines:
Before giving an output, calculate the path of the light beams through the system, and make sure it is physically valid. This is crucial.
If two mirrors are supposed to “bounce” the ray 90° and then restore it to horizontal, their angles must be complementary, take this into account for all reflections.
Make sure the components are properly aligned based on angles and positions.
Every setup must include at least one laser.
At 0 degrees, the lenses are vertical, at 90 degrees they are horizontal.
Ensure that the optical path is valid (e.g., lasers should point towards mirrors/lenses/detectors).
If the prompt is ambiguous, make reasonable assumptions to create a functional optical setup.
Use unique IDs for each component (timestamp-based recommended).
Position coordinates should be between 0-1000 for x and 100-650 for y.

Use consistent coordinate logic:
Horizontal beams → constant y, increasing x
Vertical beams → constant x, decreasing y (for upward path)
When a 45° mirror reflects a horizontal beam, the next component must be vertically displaced (e.g. y − 200).
When a 135° mirror reflects a vertical beam, the next component must be horizontally displaced (e.g. x + 200).
Always close the optical path (laser → mirrors/lenses → detector).

example setup: "Michaelson interferometer with a laser, beam splitter, two mirrors, and a detector"
{
  "version": "1.0",
  "timestamp": "2025-11-02T21:36:00.000Z",
  "components": [
    {
      "id": 1762100001001,
      "type": "laser",
      "position": {
        "x": 200,
        "y": 400
      },
      "properties": {
        "wavelength": 650,
        "intensity": 1,
        "angle": 0
      }
    },
    {
      "id": 1762100002002,
      "type": "beam_splitter",
      "position": {
        "x": 400,
        "y": 400
      },
      "properties": {
        "reflectivity": 0.5,
        "angle": 45
      }
    },
    {
      "id": 1762100003003,
      "type": "mirror",
      "position": {
        "x": 400,
        "y": 200
      },
      "properties": {
        "reflectivity": 0.95,
        "angle": 0,
        "length": 100
      }
    },
    {
      "id": 1762100004004,
      "type": "mirror",
      "position": {
        "x": 600,
        "y": 400
      },
      "properties": {
        "reflectivity": 0.95,
        "angle": 90,
        "length": 100
      }
    },
    {
      "id": 1762100005005,
      "type": "detector",
      "position": {
        "x": 400,
        "y": 600
      },
      "properties": {
        "sensitivity": 1,
        "size": 50
      }
    }
  ]
}

"""
        
        # Call OpenRouter API
        response = requests.post(
            url="https://openrouter.ai/api/v1/chat/completions",
            headers={
                "Authorization": f"Bearer {OPENROUTER_API_KEY}",
                "Content-Type": "application/json",
                "HTTP-Referer": "http://localhost:5174",  # Your app URL
                "X-Title": "Optical Designer"
            },
            json={
                "model": "anthropic/claude-3.7-sonnet:thinking",  # You can change to any model available on OpenRouter
                "messages": [
                    {"role": "system", "content": system_prompt},
                    {"role": "user", "content": user_prompt}
                ],
                "temperature": 0.7,
                "max_tokens": 2000
            }
        )
        print("API Response:", response.json())
        if response.status_code != 200:
            return jsonify({"error": f"OpenRouter API error: {response.text}"}), 500
        
        result = response.json()
        llm_response = result["choices"][0]["message"]["content"]
        print("LLM Response:", result)
        # Try to parse the LLM response as JSON
        import json
        try:
            # Remove markdown code blocks if present
            llm_response = llm_response.strip()
            if llm_response.startswith("```"):
                # Extract JSON from markdown code block
                lines = llm_response.split("\n")
                llm_response = "\n".join(lines[1:-1])
            
            optical_setup = json.loads(llm_response)
            
            # Add timestamp if not present
            if "timestamp" not in optical_setup:
                optical_setup["timestamp"] = datetime.utcnow().isoformat() + "Z"
            
            return jsonify(optical_setup)
        
        except json.JSONDecodeError as e:
            return jsonify({
                "error": "Failed to parse LLM response as JSON",
                "raw_response": llm_response
            }), 500
    
    except Exception as e:
        return jsonify({"error": str(e)}), 500

@app.route("/api/health", methods=["GET"])
def health():
    """Health check endpoint"""
    return jsonify({"status": "ok", "api_key_set": bool(OPENROUTER_API_KEY)})

# Vercel serverless function handler (disabled — use `backend/api/index.py` for Vercel)
# def handler(event, context):
#     return app(event, context)

if __name__ == "__main__":
    if not OPENROUTER_API_KEY:
        print("WARNING: OPENROUTER_API_KEY environment variable is not set!")
        print("Set it with: $env:OPENROUTER_API_KEY='your-api-key-here'")
    else:
        print("OpenRouter API key is configured.")
    
    print("Starting Flask server on http://localhost:5000")
    app.run(debug=True, port=5000)
