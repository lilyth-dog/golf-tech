from rest_framework import serializers
from .models import AnalysisResult

class VideoUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalysisResult
        fields = ['video_url']
        extra_kwargs = {'video_url': {'required': True, 'allow_null': False}}


class AnalysisResultSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalysisResult
        fields = ['id', 'created_at', 'video_url', 'shoulder_angle', 'hip_rotation', 'knee_flexion', 'spine_angle', 'x_factor', 'angular_momentum', 'physics_score', 'ai_feedback', 'feedback_image', 'feedback_video']
        read_only_fields = ['id', 'created_at', 'x_factor', 'angular_momentum', 'physics_score', 'ai_feedback']
