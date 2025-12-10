import os
import django
import requests
import json
import sys

# Setup Django Environment
sys.path.append(os.path.dirname(os.path.abspath(__file__)))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()

from django.contrib.auth.models import User
from rest_framework.test import APIClient
from rest_framework.authtoken.models import Token
from core.models import UserProfile

def test_analysis_flow():
    print("--- Starting Analysis Pipeline Test ---")

    # 1. Create Dummy User
    print("[1] Setting up Test User...")
    username = "test_golfer"
    password = "password123"
    
    user, created = User.objects.get_or_create(username=username)
    if created:
        user.set_password(password)
        user.save()
        UserProfile.objects.create(user=user, handicap=25, years_experience=3)
    
    # 2. Get Token (Simulate Login)
    client = APIClient()
    token, _ = Token.objects.get_or_create(user=user)
    client.credentials(HTTP_AUTHORIZATION='Token ' + token.key)
    print(f"[2] Authenticated as {username}")

    # 3. Simulate Swing Metrics (Dummy Data)
    # Scenario: Bad slice setup (shoulders too open, hip restriction)
    payload = {
        "shoulder_angle": 75.5,  # Ideal > 90 (Bad)
        "hip_rotation": 30.0,    # Ideal > 60 (Bad)
        "knee_flexion": 30.0,    # Ideal 25-35 (Good)
        "spine_angle": 38.0      # Ideal 35-40 (Good)
    }
    print(f"[3] Sending Swing Metrics: {payload}")

    # 4. Call API
    url = '/api/analysis/analyze/'
    try:
        response = client.post(url, payload, format='json')
        
        if response.status_code == 201:
            data = response.json()
            print("\n✅ SUCCESS: Analysis Created!")
            print(f"ID: {data['id']}")
            print("-" * 30)
            print("🤖 AI Feedback Received:")
            print(data['ai_feedback'])
            print("-" * 30)
        else:
            print(f"\n❌ FAILED: Status {response.status_code}")
            with open('error_debug.html', 'wb') as f:
                f.write(response.content)
            print("Error content saved to backend/error_debug.html")
            # Try to print title if HTML
            try:
                import re
                title = re.search('<title>(.*?)</title>', response.content.decode(), re.IGNORECASE)
                if title:
                    print(f"Error Page Title: {title.group(1)}")
            except:
                pass
            
    except Exception as e:
        print(f"\n❌ EXCEPTION: {e}")

if __name__ == "__main__":
    test_analysis_flow()
