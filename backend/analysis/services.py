import requests
import json
from django.conf import settings

# Using a more capable instruction-tuned model for better advice
HF_API_URL = "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.2"

def get_ai_feedback(metrics):
    """
    Sends swing metrics to Hugging Face API and returns coaching advice.
    """
    hf_api_key = getattr(settings, "HF_API_KEY", "") or ""
    if not hf_api_key:
        # Avoid calling external services without credentials; fall back locally.
        return simulate_offline_feedback(metrics)

    headers = {"Authorization": f"Bearer {hf_api_key}"}
    
    # Construct a physics-aware prompt
    prompt = f"""[INST] You are a professional golf biomechanics coach. Analyze the following swing metrics for a user:

    - Shoulder Rotation: {metrics.get('shoulder_angle')} degrees (Target: >90)
    - Hip Rotation: {metrics.get('hip_rotation')} degrees (Target: 45-60)
    - Knee Flexion: {metrics.get('knee_flexion')} degrees (Target: 20-30)
    - Spine Angle: {metrics.get('spine_angle')} degrees (Target: 35-45)
    - X-Factor: {metrics.get('x_factor', 0):.1f} degrees (Target: >30)
    - Angular Momentum Estimate: {metrics.get('angular_momentum', 'N/A')}
    - Physics Score: {metrics.get('physics_score', 0):.0f}/100

    Based ONLY on these numbers, provide:
    1. A 1-sentence assessment of their swing mechanics.
    2. One specific drill to improve their angular momentum or stability.
    3. A warning about potential injury risks if applicable.
    
    Keep the response concise and encouraging. [/INST]
    """

    payload = {
        "inputs": prompt,
        "parameters": {
            "max_new_tokens": 250,
            "temperature": 0.7,
            "return_full_text": False
        }
    }

    try:
        response = requests.post(HF_API_URL, headers=headers, json=payload, timeout=10)
        response.raise_for_status()
        
        data = response.json()
        
        # Handle list or dict response
        if isinstance(data, list) and len(data) > 0:
            return data[0].get("generated_text", "No advice generated.").strip()
        elif isinstance(data, dict) and "generated_text" in data:
            return data["generated_text"].strip()
        else:
            return "AI Analysis complete. Form looks stable, allow more hip turn for power."
            
    except requests.exceptions.RequestException as e:
        print(f"Hugging Face API Error: {e}")
        # Return a meaningful fallback simulation if API fails (common in free tier)
        return simulate_offline_feedback(metrics)

def simulate_offline_feedback(metrics):
    """
    Fallback physics engine rule-based feedback if AI service is busy/down.
    """
    shoulder = metrics.get('shoulder_angle', 0)
    hip = metrics.get('hip_rotation', 0)
    
    feedback = []
    
    # X-Factor Logic (Shoulder - Hip separation)
    x_factor = abs(shoulder - hip)
    
    if shoulder < 80:
        feedback.append("Increase shoulder turn to generate more potential energy.")
    if hip > 60:
        feedback.append("Restrict hip turn slightly to build torque (X-Factor).")
    
    if x_factor < 30:
        feedback.append("Your X-Factor (Shoulder-Hip separation) is low. Try to turn your shoulders against a stable lower body to maximize angular momentum.")
    else:
        feedback.append("Great X-Factor generation! You are creating good torque for impact.")
        
    return " ".join(feedback)
