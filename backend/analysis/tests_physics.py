from django.test import TestCase
from analysis.physics import GolfPhysicsEngine

class GolfPhysicsEngineTests(TestCase):
    def setUp(self):
        self.engine = GolfPhysicsEngine(user_profile={'height': 180, 'weight': 80})

    def test_calculate_x_factor(self):
        # Shoulder 90, Hip 45 -> X=45
        self.assertEqual(self.engine.calculate_x_factor(90, 45), 45)
        # Check absolute values
        self.assertEqual(self.engine.calculate_x_factor(-90, -45), 45)
        # Shoulder < Hip (Unlikely but mathematically possible) -> separation should still be positive.
        self.assertEqual(self.engine.calculate_x_factor(30, 45), 15)

    def test_assess_impact_efficiency(self):
        # Perfect scenario
        score = self.engine.assess_impact_efficiency(wrist_angle=5, swing_tempo_ratio=3.0, knee_flexion=25, spine_angle=40)
        self.assertEqual(score, 100)

        # Casting scenario (wrist > 15)
        # Wrist 25 -> (25-15)*2 = 20 penalty -> 80
        score = self.engine.assess_impact_efficiency(wrist_angle=25, swing_tempo_ratio=3.0)
        self.assertEqual(score, 80)

        # Bad tempo
        # Tempo 4.0 -> deviation 1.0 -> penalty 10 -> 90
        score = self.engine.assess_impact_efficiency(wrist_angle=5, swing_tempo_ratio=4.0)
        self.assertEqual(score, 90)

    def test_estimate_angular_velocity_from_x_factor(self):
        omega = self.engine.estimate_angular_velocity_from_x_factor(45, swing_tempo_ratio=3.0)
        self.assertTrue(omega > 0)
        self.assertIsInstance(omega, float)

    def test_estimate_angular_momentum(self):
        # Just check it returns a positive float
        L = self.engine.estimate_angular_momentum(angular_velocity=10, segment='trunk')
        self.assertTrue(L > 0)
        self.assertIsInstance(L, float)
