from django.db import models
from django.contrib.auth.models import User

class AnalysisResult(models.Model):
    user = models.ForeignKey(User, on_delete=models.CASCADE, related_name='analyses')
    video_url = models.URLField(blank=True, null=True)
    created_at = models.DateTimeField(auto_now_add=True)
    
    # Swing Metrics (Snapshot at Impact/Top)
    shoulder_angle = models.FloatField(help_text="Shoulder rotation angle")
    hip_rotation = models.FloatField(help_text="Hip rotation angle")
    knee_flexion = models.FloatField(help_text="Knee flexion angle")
    spine_angle = models.FloatField(help_text="Spine inclination angle")
    
    # Physics Engine Metrics (Calculated)
    x_factor = models.FloatField(default=0.0, help_text="Shoulder-Hip separation")
    angular_momentum = models.FloatField(default=0.0, help_text="Estimated Angular Momentum")
    physics_score = models.FloatField(default=0.0, help_text="Overall Swing Efficiency Score (0-100)")
    
    # AI Feedback
    ai_feedback = models.TextField(blank=True, help_text="Generated advice from LLM")
    feedback_image = models.ImageField(blank=True, null=True, upload_to='feedback/images/')
    feedback_video = models.FileField(blank=True, null=True, upload_to='feedback/videos/')
    
    def __str__(self):
        return f"Analysis {self.id} - {self.user.username}"
