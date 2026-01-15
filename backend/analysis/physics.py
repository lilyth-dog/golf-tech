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

    @staticmethod
    def _clamp(value, lo, hi):
        return max(lo, min(hi, value))

    @staticmethod
    def _range_penalty(value, lo, hi, weight=1.0):
        """
        Penalize distance from an acceptable range [lo, hi].
        Returns a non-negative penalty.
        """
        if value is None:
            return 0.0
        if value < lo:
            return (lo - value) * weight
        if value > hi:
            return (value - hi) * weight
        return 0.0
        
    def calculate_x_factor(self, shoulder_angle, hip_angle):
        """
        X-Factor: The separation between shoulder and hip rotation.
        Key for power generation (Elastic potential energy).
        """
        # X-Factor is the separation between the two rotations, not the difference of magnitudes.
        # Using abs(|a| - |b|) can undercount and can even go negative depending on usage elsewhere.
        return abs(shoulder_angle - hip_angle)

    def assess_impact_efficiency(self, wrist_angle=None, swing_tempo_ratio=None, knee_flexion=None, spine_angle=None):
        """
        Evaluates impact timing and basic kinematic quality.
        wrist_angle: < 10 degrees implies full uncocking (ideal impact).
        swing_tempo_ratio: Ideal is ~3.0 (3:1 backswing to downswing).
        knee_flexion: Ideal ~20-30 degrees.
        spine_angle: Ideal ~35-45 degrees.
        """
        score = 100.0
        
        # Penalize casting (wrist uncocking too early) or holding off too long
        if wrist_angle is not None and wrist_angle > 15:
            score -= (wrist_angle - 15) * 2.0
            
        # Penalize tempo deviation
        if swing_tempo_ratio is not None:
            deviation = abs(swing_tempo_ratio - 3.0)
            score -= deviation * 10.0

        # Penalize posture/stability deviations (simple range-based penalties)
        score -= self._range_penalty(knee_flexion, 20.0, 30.0, weight=1.5)
        score -= self._range_penalty(spine_angle, 35.0, 45.0, weight=1.0)
            
        return max(0.0, min(100.0, score))

    def estimate_angular_velocity_from_x_factor(self, x_factor_deg, swing_tempo_ratio=3.0, downswing_time_s=0.30):
        """
        Heuristic angular velocity estimate from X-Factor.
        - Convert separation angle (deg) -> rad.
        - Divide by an assumed downswing duration.
        - Modulate by tempo ratio (faster downswing => slightly higher omega).
        """
        x = max(0.0, float(x_factor_deg or 0.0))
        # Keep within a realistic envelope for this simplified model.
        x = self._clamp(x, 0.0, 70.0)

        tempo = float(swing_tempo_ratio or 3.0)
        tempo = self._clamp(tempo, 1.5, 5.0)

        # If tempo ratio is higher, downswing is relatively faster; apply mild boost.
        tempo_multiplier = self._clamp(3.0 / tempo, 0.6, 1.4)

        dt = float(downswing_time_s or 0.30)
        dt = self._clamp(dt, 0.20, 0.60)

        radians = x * (np.pi / 180.0)
        omega = (radians / dt) * tempo_multiplier  # rad/s
        return omega

    def estimate_angular_momentum(self, angular_velocity, segment='trunk'):
        """
        L = I * omega
        Approximates Angular Momentum for a segment.
        """
        mass = self.weight * self.SEGMENT_MASS_RATIOS.get(segment, 0.5)
        
        # Segment-specific radius factors (very simplified, in meters).
        radius_factor = {
            "trunk": 0.20,
            "head": 0.10,
            "arm_upper": 0.12,
            "forearm": 0.10,
            "hand": 0.08,
            "thigh": 0.14,
            "calf": 0.12,
            "foot": 0.08,
        }.get(segment, 0.20)

        radius = (self.height / 100.0) * radius_factor
        
        moment_of_inertia = 0.5 * mass * (radius ** 2) # Cylinder approximation
        
        educational_momentum = moment_of_inertia * float(angular_velocity or 0.0)
        return educational_momentum
