from rest_framework import generics, permissions
from .models import AnalysisResult
from .serializers import AnalysisResultSerializer, VideoUploadSerializer
from rest_framework.parsers import MultiPartParser, FormParser
from .tasks import process_video_analysis
from core.models import UserProfile
from .physics import GolfPhysicsEngine
from .services import get_ai_feedback
import numpy as np

class AnalysisCreateView(generics.CreateAPIView):
    serializer_class = AnalysisResultSerializer
    permission_classes = [permissions.IsAuthenticated]

    def perform_create(self, serializer):
        # 1. Get User Profile for Anthropometrics
        try:
            profile = self.request.user.profile
            user_data = {
                'height': profile.height,
                'weight': profile.weight
            }
        except UserProfile.DoesNotExist:
            profile = UserProfile.objects.create(user=self.request.user)
            user_data = None
            
        # 2. Instantiate Physics Engine
        engine = GolfPhysicsEngine(user_data)

        # Optional time-series payload from client (frame-by-frame angles)
        frames = serializer.validated_data.get("frames") or []
        
        # 3. Save initial object to get input metrics (but don't commit yet if possible, or update after)
        # For simplicity in DRF, we let it save, then update.
        analysis = serializer.save(user=self.request.user)
        
        # 4. Calculate Physics Metrics
        x_factor = engine.calculate_x_factor(analysis.shoulder_angle, analysis.hip_rotation)
        swing_tempo_ratio = 3.0
        downswing_time_s = 0.30

        # If we have a time series, estimate tempo and angular velocity from it.
        if frames and len(frames) >= 3:
            try:
                ts = [float(f.get("timestamp_ms")) for f in frames if f.get("timestamp_ms") is not None]
                sh = [float(f.get("shoulder_angle")) for f in frames if f.get("shoulder_angle") is not None]
                hp = [float(f.get("hip_rotation")) for f in frames if f.get("hip_rotation") is not None]
                if len(ts) == len(sh) == len(hp) and len(ts) >= 3:
                    x_series = [engine.calculate_x_factor(s, h) for s, h in zip(sh, hp)]
                    peak_idx = int(np.argmax(x_series))
                    # Ensure chronological order for timing calculations
                    t0 = ts[0]
                    t_peak = ts[peak_idx]
                    t_end = ts[-1]
                    backswing_ms = max(0.0, t_peak - t0)
                    downswing_ms = max(1.0, t_end - t_peak)
                    downswing_time_s = downswing_ms / 1000.0
                    swing_tempo_ratio = backswing_ms / downswing_ms if downswing_ms > 0 else 3.0

                    x_peak = x_series[peak_idx]
                    x_end = x_series[-1]
                    x_factor = x_peak  # store peak separation as the representative X-Factor

                    # Angular velocity from how much separation "releases" over downswing duration
                    delta_deg = max(0.0, x_peak - x_end)
                    if downswing_time_s > 0:
                        omega = (delta_deg * (np.pi / 180.0)) / downswing_time_s
                    else:
                        omega = engine.estimate_angular_velocity_from_x_factor(
                            x_peak, swing_tempo_ratio=swing_tempo_ratio, downswing_time_s=downswing_time_s
                        )
                else:
                    omega = engine.estimate_angular_velocity_from_x_factor(x_factor, swing_tempo_ratio=swing_tempo_ratio)
            except Exception:
                omega = engine.estimate_angular_velocity_from_x_factor(x_factor, swing_tempo_ratio=swing_tempo_ratio)
        else:
            omega = engine.estimate_angular_velocity_from_x_factor(x_factor, swing_tempo_ratio=swing_tempo_ratio, downswing_time_s=downswing_time_s)

        angular_momentum = engine.estimate_angular_momentum(omega, segment='trunk')
        
        # Prefer last-frame posture if available, else fall back to snapshot.
        last_knee = None
        last_spine = None
        if frames:
            last = frames[-1] or {}
            last_knee = last.get("knee_flexion")
            last_spine = last.get("spine_angle")

        physics_score = engine.assess_impact_efficiency(
            wrist_angle=None,
            swing_tempo_ratio=swing_tempo_ratio,
            knee_flexion=last_knee if last_knee is not None else analysis.knee_flexion,
            spine_angle=last_spine if last_spine is not None else analysis.spine_angle,
        )
        
        # 5. Update Analysis Object
        analysis.x_factor = x_factor
        analysis.angular_momentum = angular_momentum
        analysis.physics_score = physics_score
        
        # 6. Call AI Service with Enhanced Data
        metrics = {
            'shoulder_angle': analysis.shoulder_angle,
            'hip_rotation': analysis.hip_rotation,
            'knee_flexion': analysis.knee_flexion,
            'spine_angle': analysis.spine_angle,
            'x_factor': x_factor,
            'angular_momentum': f"{angular_momentum:.2f} kg·m²/s",
            'physics_score': physics_score,
            'swing_tempo_ratio': swing_tempo_ratio,
            'downswing_time_s': downswing_time_s,
        }
        
        ai_advice = get_ai_feedback(metrics)
        analysis.ai_feedback = ai_advice
        analysis.save()

class AnalysisListView(generics.ListAPIView):
    serializer_class = AnalysisResultSerializer
    permission_classes = [permissions.IsAuthenticated]
    
    def get_queryset(self):
        return AnalysisResult.objects.filter(user=self.request.user).order_by('-created_at')


class VideoUploadView(generics.CreateAPIView):
    serializer_class = VideoUploadSerializer
    permission_classes = [permissions.IsAuthenticated]
    parser_classes = [MultiPartParser, FormParser]

    def perform_create(self, serializer):
        # Save the uploaded video and associate with the user
        analysis = serializer.save(user=self.request.user)
        # Trigger async processing (Celery) to analyze video and generate feedback
        process_video_analysis.delay(analysis.id)
        return analysis
