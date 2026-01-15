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

    @staticmethod
    def _moving_average(values, window=5):
        """
        Simple moving average with edge padding.
        """
        arr = np.asarray(values, dtype=float)
        if arr.size == 0:
            return arr
        w = int(window or 1)
        if w <= 1 or arr.size < 3:
            return arr
        w = min(w, int(arr.size))
        kernel = np.ones(w, dtype=float) / float(w)
        # Pad with edge values to avoid shrinking.
        pad = w // 2
        padded = np.pad(arr, (pad, pad), mode="edge")
        smoothed = np.convolve(padded, kernel, mode="valid")
        return smoothed
        
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

    def analyze_frames(self, frames):
        """
        Analyze a list of frame dicts with keys:
        - timestamp_ms
        - shoulder_angle
        - hip_rotation
        - knee_flexion (optional)
        - spine_angle (optional)

        Returns a dict with phase indices and kinematic estimates.
        """
        if not frames or len(frames) < 3:
            return None

        # Sort by time to be robust against out-of-order frames.
        fs = sorted(frames, key=lambda f: float(f.get("timestamp_ms", 0.0)))
        ts = np.array([float(f["timestamp_ms"]) for f in fs], dtype=float)
        # Convert ms -> seconds for derivatives.
        t_s = (ts - ts[0]) / 1000.0

        sh_deg = np.array([float(f["shoulder_angle"]) for f in fs], dtype=float)
        hp_deg = np.array([float(f["hip_rotation"]) for f in fs], dtype=float)

        # Smooth raw angles before differentiation (basic noise suppression).
        sh_deg_s = self._moving_average(sh_deg, window=5)
        hp_deg_s = self._moving_average(hp_deg, window=5)

        x_deg = np.abs(sh_deg_s - hp_deg_s)
        peak_idx = int(np.argmax(x_deg))

        t0_ms = float(ts[0])
        t_peak_ms = float(ts[peak_idx])
        t_end_ms = float(ts[-1])

        backswing_ms = max(0.0, float(t_peak_ms - t0_ms))
        downswing_ms = max(1.0, float(t_end_ms - t_peak_ms))
        downswing_time_s = downswing_ms / 1000.0
        swing_tempo_ratio = backswing_ms / downswing_ms if downswing_ms > 0 else 3.0

        x_peak = float(x_deg[peak_idx])
        x_end = float(x_deg[-1])

        # --- Impact (release minimum) detection ---
        # Search for minimal separation after peak within a plausible window.
        # Typical downswing ~0.2-0.6s; we use 0.05s to 0.8s as an envelope.
        min_after_ms = t_peak_ms + 50.0
        max_after_ms = min(t_peak_ms + 800.0, t_end_ms)
        after_mask = (ts >= min_after_ms) & (ts <= max_after_ms)
        after_idx = np.where(after_mask)[0]
        if after_idx.size > 0:
            impact_local = int(after_idx[np.argmin(x_deg[after_idx])])
        else:
            # Fallback: minimal after peak, else last.
            if peak_idx < (len(x_deg) - 1):
                impact_local = int(peak_idx + np.argmin(x_deg[peak_idx + 1 :]))
            else:
                impact_local = int(len(x_deg) - 1)
        impact_idx = int(self._clamp(impact_local, peak_idx, len(x_deg) - 1))

        x_impact = float(x_deg[impact_idx])
        t_impact_ms = float(ts[impact_idx])

        # --- Angular velocities (rad/s) ---
        # Use numerical derivative with uneven time base; then smooth.
        sh_rad = sh_deg_s * (np.pi / 180.0)
        hp_rad = hp_deg_s * (np.pi / 180.0)
        x_rad = x_deg * (np.pi / 180.0)

        # np.gradient handles uneven spacing when provided with time.
        with np.errstate(divide="ignore", invalid="ignore"):
            sh_omega = np.gradient(sh_rad, t_s)
            hp_omega = np.gradient(hp_rad, t_s)
            x_omega = np.gradient(x_rad, t_s)

        sh_omega = self._moving_average(sh_omega, window=5)
        hp_omega = self._moving_average(hp_omega, window=5)
        x_omega = self._moving_average(x_omega, window=5)

        # Down/impact window indices: from peak -> impact (inclusive)
        ds_start = peak_idx
        ds_end = impact_idx if impact_idx > peak_idx else min(len(x_deg) - 1, peak_idx + 1)
        ds_slice = slice(ds_start, ds_end + 1)

        omega_shoulder_peak = float(np.nanmax(np.abs(sh_omega[ds_slice]))) if sh_omega.size else 0.0
        omega_hip_peak = float(np.nanmax(np.abs(hp_omega[ds_slice]))) if hp_omega.size else 0.0
        omega_x_peak = float(np.nanmax(np.abs(x_omega[ds_slice]))) if x_omega.size else 0.0

        # Release rate based on peak-to-impact separation change
        release_deg = max(0.0, x_peak - x_impact)
        release_dt_s = max(0.05, (t_impact_ms - t_peak_ms) / 1000.0)
        release_rate_rad_s = float((release_deg * (np.pi / 180.0)) / release_dt_s)

        # Clamp derived times/ratios into a realistic envelope for stability.
        dt = self._clamp((t_impact_ms - t_peak_ms) / 1000.0, 0.20, 0.80)
        swing_tempo_ratio = float(self._clamp(swing_tempo_ratio, 1.5, 5.0))

        knee_end = fs[-1].get("knee_flexion")
        spine_end = fs[-1].get("spine_angle")

        return {
            "x_factor_peak": x_peak,
            "x_factor_end": x_end,
            "x_factor_impact": x_impact,
            "swing_tempo_ratio": swing_tempo_ratio,
            "downswing_time_s": float(dt),
            "omega_x_peak": omega_x_peak,
            "omega_shoulder_peak": omega_shoulder_peak,
            "omega_hip_peak": omega_hip_peak,
            "release_rate_rad_s": release_rate_rad_s,
            "knee_end": knee_end,
            "spine_end": spine_end,
            "peak_idx": peak_idx,
            "impact_idx": impact_idx,
            "t_peak_ms": t_peak_ms,
            "t_impact_ms": t_impact_ms,
        }

    def build_evaluation(
        self,
        x_factor,
        swing_tempo_ratio,
        knee_flexion,
        spine_angle,
        release_rate_rad_s=None,
        omega_shoulder_peak=None,
        omega_hip_peak=None,
        omega_x_peak=None,
        peak_idx=None,
        impact_idx=None,
    ):
        """
        Return an evaluation breakdown for UI/AI prompt.
        """
        # Component scores (simple, interpretable)
        tempo_penalty = self._range_penalty(swing_tempo_ratio, 2.5, 3.5, weight=20.0)  # ratio too far from ~3
        tempo_score = self._clamp(100.0 - tempo_penalty, 0.0, 100.0)

        x_penalty = self._range_penalty(x_factor, 30.0, 60.0, weight=2.0)
        x_score = self._clamp(100.0 - x_penalty, 0.0, 100.0)

        posture_penalty = self._range_penalty(knee_flexion, 20.0, 30.0, weight=2.0) + self._range_penalty(spine_angle, 35.0, 45.0, weight=2.0)
        posture_score = self._clamp(100.0 - posture_penalty, 0.0, 100.0)

        rotation_score = None
        if release_rate_rad_s is not None:
            rr = float(release_rate_rad_s)
            rot_penalty = self._range_penalty(rr, 2.0, 6.0, weight=25.0)
            rotation_score = float(self._clamp(100.0 - rot_penalty, 0.0, 100.0))

        # Weight rotation if available; otherwise distribute to existing components.
        if rotation_score is None:
            overall = self._clamp(0.45 * x_score + 0.35 * tempo_score + 0.20 * posture_score, 0.0, 100.0)
        else:
            overall = self._clamp(0.35 * x_score + 0.30 * tempo_score + 0.20 * posture_score + 0.15 * rotation_score, 0.0, 100.0)

        flags = []
        if x_factor < 30:
            flags.append("low_x_factor")
        if swing_tempo_ratio < 2.5 or swing_tempo_ratio > 3.5:
            flags.append("tempo_off")
        if knee_flexion is not None and (knee_flexion < 20 or knee_flexion > 30):
            flags.append("knee_out_of_range")
        if spine_angle is not None and (spine_angle < 35 or spine_angle > 45):
            flags.append("spine_out_of_range")
        if release_rate_rad_s is not None and float(release_rate_rad_s) < 2.0:
            flags.append("slow_release")

        recommendations = []
        if "low_x_factor" in flags:
            recommendations.append("상체 회전을 늘리고 하체는 안정적으로 유지해 X-Factor(분리각)를 키우세요.")
        if "tempo_off" in flags:
            recommendations.append("백스윙을 더 천천히(리듬) 유지하고 다운스윙은 과도하게 급하지 않게 3:1 템포에 맞추세요.")
        if "knee_out_of_range" in flags:
            recommendations.append("무릎 굴곡을 20~30° 범위로 유지해 하체 안정성을 확보하세요.")
        if "spine_out_of_range" in flags:
            recommendations.append("척추 각도를 35~45° 범위로 유지해 자세 안정성을 확보하세요.")
        if "slow_release" in flags:
            recommendations.append("다운스윙 구간에서 분리각 릴리즈(회전 가속)가 부족합니다. 하체 리드와 상체 지연(레이트 릴리즈) 드릴을 권장합니다.")

        evaluation = {
            "overall_score": float(overall),
            "components": {
                "x_factor_score": float(x_score),
                "tempo_score": float(tempo_score),
                "posture_score": float(posture_score),
                "rotation_speed_score": rotation_score,
            },
            "inputs": {
                "x_factor": float(x_factor),
                "swing_tempo_ratio": float(swing_tempo_ratio),
                "knee_flexion": knee_flexion,
                "spine_angle": spine_angle,
                "release_rate_rad_s": release_rate_rad_s,
                "omega_x_peak": omega_x_peak,
                "omega_shoulder_peak": omega_shoulder_peak,
                "omega_hip_peak": omega_hip_peak,
            },
            "flags": flags,
            "recommendations": recommendations,
        }
        if peak_idx is not None or impact_idx is not None:
            evaluation["phases"] = {"peak_idx": peak_idx, "impact_idx": impact_idx}
        return evaluation
