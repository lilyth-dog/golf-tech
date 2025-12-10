import numpy as np

class GolfPhysicsEngine:
    """
    Universal Golf Physics Engine (UGPA)
    Calculates biomechanical metrics based on body segments and angles.
    """
    
    # Anthropometric Data (Dempster's Body Segment Parameters)
    # Mass fraction of total body weight
    SEGMENT_MASS_RATIOS = {
        'head': 0.081,
        'trunk': 0.497,
        'arm_upper': 0.028,
        'forearm': 0.016,
        'hand': 0.006,
        'thigh': 0.100,
        'calf': 0.0465,
        'foot': 0.0145
    }

    def __init__(self, user_profile=None):
        self.height = user_profile['height'] if user_profile else 175  # cm (default)
        self.weight = user_profile['weight'] if user_profile else 75   # kg (default)
        
    def calculate_x_factor(self, shoulder_angle, hip_angle):
        """
        X-Factor: The separation between shoulder and hip rotation.
        Key for power generation (Elastic potential energy).
        """
        # Ensure we are dealing with magnitudes appropriately
        return abs(shoulder_angle) - abs(hip_angle)

    def assess_impact_efficiency(self, wrist_angle, swing_tempo_ratio):
        """
        Evaluates impact timing and tempo.
        wrist_angle: < 10 degrees implies full uncocking (ideal impact).
        swing_tempo_ratio: Ideal is ~3.0 (3:1 backswing to downswing).
        """
        score = 100
        
        # Penalize casting (wrist uncocking too early) or holding off too long
        if wrist_angle > 15:
            score -= (wrist_angle - 15) * 2
            
        # Penalize tempo deviation
        if swing_tempo_ratio:
            deviation = abs(swing_tempo_ratio - 3.0)
            score -= deviation * 10
            
        return max(0, min(100, score))

    def estimate_angular_momentum(self, angular_velocity, segment='trunk'):
        """
        L = I * omega
        Approximates Angular Momentum for a segment.
        """
        mass = self.weight * self.SEGMENT_MASS_RATIOS.get(segment, 0.5)
        
        # Radius of gyration approximation (e.g., trunk radius ~ 0.3 * height approx)
        # This is a high-level simplification for the MVP Physics Engine
        radius = (self.height / 100) * 0.2 
        
        moment_of_inertia = 0.5 * mass * (radius ** 2) # Cylinder approximation
        
        educational_momentum = moment_of_inertia * angular_velocity
        return educational_momentum
