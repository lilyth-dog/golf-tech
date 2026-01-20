from django.test import TestCase, override_settings
from unittest.mock import patch, MagicMock
from analysis.services import get_ai_feedback, simulate_offline_feedback
import requests

class ServicesTests(TestCase):
    
    @patch('analysis.services.requests.post')
    @override_settings(HF_API_KEY="test_hf_key")
    def test_get_ai_feedback_success(self, mock_post):
        # Mock successful response
        mock_response = MagicMock()
        mock_response.status_code = 200
        mock_response.json.return_value = [{"generated_text": "Good swing!"}]
        mock_post.return_value = mock_response

        metrics = {'shoulder_angle': 90}
        feedback = get_ai_feedback(metrics)
        self.assertEqual(feedback, "Good swing!")

    @patch('analysis.services.requests.post')
    @override_settings(HF_API_KEY="test_hf_key")
    def test_get_ai_feedback_api_failure_fallback(self, mock_post):
        # Mock connection error
        mock_post.side_effect = requests.exceptions.RequestException("Connection refused")

        metrics = {'shoulder_angle': 45, 'hip_rotation': 45} 
        # Falls back to simulate_offline_feedback
        # simulate_offline_feedback logic: 
        # shoulder < 80 -> "Increase shoulder turn..."
        
        feedback = get_ai_feedback(metrics)
        self.assertIn("Increase shoulder turn", feedback)

    def test_simulate_offline_feedback_logic(self):
        metrics = {'shoulder_angle': 100, 'hip_rotation': 40}
        # X-Factor = 60 (>30) -> "Great X-Factor..."
        feedback = simulate_offline_feedback(metrics)
        self.assertIn("Great X-Factor generation", feedback)

        metrics_bad = {'shoulder_angle': 70, 'hip_rotation': 50}
        # X-Factor = 20 (<30) -> "Your X-Factor... low"
        # Shoulder < 80 -> "Increase shoulder turn..."
        feedback_bad = simulate_offline_feedback(metrics_bad)
        self.assertIn("Increase shoulder turn", feedback_bad)
        self.assertIn("Your X-Factor", feedback_bad)
