from rest_framework import serializers
from .models import AnalysisResult

class AnalysisFrameSerializer(serializers.Serializer):
    timestamp_ms = serializers.FloatField()
    shoulder_angle = serializers.FloatField()
    hip_rotation = serializers.FloatField()
    knee_flexion = serializers.FloatField(required=False, allow_null=True)
    spine_angle = serializers.FloatField(required=False, allow_null=True)

class VideoUploadSerializer(serializers.ModelSerializer):
    class Meta:
        model = AnalysisResult
        fields = ['video_url']
        extra_kwargs = {'video_url': {'required': True, 'allow_null': False}}


class AnalysisResultSerializer(serializers.ModelSerializer):
    frames = AnalysisFrameSerializer(many=True, write_only=True, required=False)

    def create(self, validated_data):
        # `frames` is an input-only payload for time-series estimation; it is not stored.
        validated_data.pop("frames", None)
        return super().create(validated_data)

    class Meta:
        model = AnalysisResult
        fields = [
            'id',
            'created_at',
            'video_url',
            'shoulder_angle',
            'hip_rotation',
            'knee_flexion',
            'spine_angle',
            'frames',
            'x_factor',
            'angular_momentum',
            'physics_score',
            'swing_tempo_ratio',
            'downswing_time_s',
            'omega_peak',
            'evaluation',
            'ai_feedback',
            'feedback_image',
            'feedback_video',
        ]
        read_only_fields = [
            'id',
            'created_at',
            'x_factor',
            'angular_momentum',
            'physics_score',
            'swing_tempo_ratio',
            'downswing_time_s',
            'omega_peak',
            'evaluation',
            'ai_feedback',
        ]
