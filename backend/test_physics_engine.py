from django.test import TestCase
from django.contrib.auth.models import User
from core.models import UserProfile
from analysis.physics import GolfPhysicsEngine

class PhysicsEngineTest(TestCase):
    def setUp(self):
        self.user = User.objects.create_user(username='testphys', password='password')
        self.profile = UserProfile.objects.create(user=self.user, height=180, weight=80)
        self.engine = GolfPhysicsEngine({'height': 180, 'weight': 80})

    def test_x_factor_calculation(self):
        # Shoulder 90, Hip 45 -> X-Factor 45
        x_factor = self.engine.calculate_x_factor(90, 45)
        self.assertEqual(x_factor, 45)
        
        # Shoulder 80, Hip 20 -> X-Factor 60
        x_factor = self.engine.calculate_x_factor(80, 20)
        self.assertEqual(x_factor, 60)

    def test_angular_momentum_estimation(self):
        # Test generic output
        am = self.engine.estimate_angular_momentum(angular_velocity=10, segment='trunk')
        self.assertGreater(am, 0)
        print(f"Estimated Angular Momentum: {am}")

    def test_impact_efficiency(self):
        # Ideal impact
        score = self.engine.assess_impact_efficiency(wrist_angle=5, swing_tempo_ratio=3.0)
        self.assertEqual(score, 100)
        
        # Bad impact (Casting)
        score_bad = self.engine.assess_impact_efficiency(wrist_angle=30, swing_tempo_ratio=3.0)
        self.assertLess(score_bad, 100)
