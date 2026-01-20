from django.contrib.auth.models import User
from django.test import TestCase
from rest_framework.test import APIClient


class AnalysisTimeSeriesTests(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username="u1", password="pw12345")
        self.client = APIClient()
        self.client.force_authenticate(user=self.user)

    def test_analysis_accepts_frames_and_uses_peak_x_factor(self):
        # frames: x_factor rises to a peak then releases
        frames = [
            {"timestamp_ms": 0, "shoulder_angle": 20, "hip_rotation": 10, "knee_flexion": 25, "spine_angle": 40},   # x=10
            {"timestamp_ms": 500, "shoulder_angle": 70, "hip_rotation": 20, "knee_flexion": 25, "spine_angle": 40}, # x=50 (peak)
            {"timestamp_ms": 800, "shoulder_angle": 40, "hip_rotation": 20, "knee_flexion": 25, "spine_angle": 40}, # x=20 (release)
        ]

        payload = {
            "shoulder_angle": 40,
            "hip_rotation": 20,
            "knee_flexion": 25,
            "spine_angle": 40,
            "frames": frames,
        }

        res = self.client.post("/api/analysis/analyze/", payload, format="json")
        self.assertEqual(res.status_code, 201)
        data = res.json()
        # Should store peak separation (50) as representative x_factor.
        self.assertAlmostEqual(float(data["x_factor"]), 50.0, delta=0.01)
        self.assertIn("physics_score", data)
        self.assertIn("angular_momentum", data)
        self.assertIn("evaluation", data)
        self.assertIn("components", data["evaluation"])
        self.assertIn("rotation_speed_score", data["evaluation"]["components"])
        # Should have time-series derived fields
        self.assertIsNotNone(data.get("omega_peak"))
        self.assertIsNotNone(data.get("downswing_time_s"))
