from rest_framework import generics, permissions
from rest_framework.response import Response
from .models import AnalysisResult
from .serializers import AnalysisResultSerializer, VideoUploadSerializer
from rest_framework.parsers import MultiPartParser, FormParser
from .tasks import process_video_analysis
from core.models import UserProfile

class AnalysisCreateView(generics.CreateAPIView):
    serializer_class = AnalysisResultSerializer
    permission_classes = [permissions.IsAuthenticated]

from .physics import GolfPhysicsEngine
from .services import get_ai_feedback # Updated service function name

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
        
        # 3. Save initial object to get input metrics (but don't commit yet if possible, or update after)
        # For simplicity in DRF, we let it save, then update.
        analysis = serializer.save(user=self.request.user)
        
        # 4. Calculate Physics Metrics
        x_factor = engine.calculate_x_factor(analysis.shoulder_angle, analysis.hip_rotation)
        
        # For MVP, we estimate angular velocity as a function of X-Factor (Elastic Recoil hypothesis)
        # In a real video stream, we'd differentiate frame-by-frame. 
        # Here we approximate: Higher X-factor -> Potential for higher velocity
        estimated_velocity = x_factor * 5.0 # Arbitrary scalar for demo
        angular_momentum = engine.estimate_angular_momentum(estimated_velocity, segment='trunk')
        
        physics_score = engine.assess_impact_efficiency(wrist_angle=0, swing_tempo_ratio=3.0) # Ideal assumptions for single-frame
        
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
            'physics_score': physics_score
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
