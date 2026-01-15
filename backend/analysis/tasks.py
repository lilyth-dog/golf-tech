import os
import json
import cv2
from urllib.parse import urlparse
from django.conf import settings
from django.core.files.base import ContentFile
from django.core.files.storage import default_storage
from .models import AnalysisResult
from .physics import GolfPhysicsEngine
from .services import get_ai_feedback
from PIL import Image, ImageDraw, ImageFont
from moviepy import VideoFileClip, TextClip, CompositeVideoClip
from celery import shared_task
from asgiref.sync import async_to_sync
from channels.layers import get_channel_layer
from core.models import UserProfile

@shared_task
def process_video_analysis(analysis_id):
    """Asynchronous pipeline:
    1. Load video file from AnalysisResult.video_url
    2. Extract frames (sample every Nth frame)
    3. For each frame, obtain pose data (placeholder – here we just mock)
    4. Compute physics metrics using GolfPhysicsEngine
    5. Aggregate metrics (average) and call AI service for textual feedback
    6. Generate feedback image (Pillow) and feedback video (moviepy)
    7. Save generated media to AnalysisResult fields.
    """
    try:
        analysis = AnalysisResult.objects.get(id=analysis_id)
    except AnalysisResult.DoesNotExist:
        return

    video_path = analysis.video_url
    if not video_path:
        return

    # If a full URL is stored, keep only the path part.
    if isinstance(video_path, str) and (video_path.startswith("http://") or video_path.startswith("https://")):
        video_path = urlparse(video_path).path

    # Resolve absolute path (MEDIA_ROOT may contain relative URL)
    if video_path.startswith('/'):
        video_path = video_path.lstrip('/')
    if video_path.startswith(settings.MEDIA_URL.lstrip("/")):
        # e.g. "media/uploads/..." -> "uploads/..."
        rel_path = video_path[len(settings.MEDIA_URL.lstrip("/")):].lstrip("/")
    elif video_path.startswith(settings.MEDIA_URL):
        rel_path = video_path[len(settings.MEDIA_URL):].lstrip("/")
    else:
        rel_path = video_path

    abs_video_path = os.path.join(str(settings.MEDIA_ROOT), rel_path)
    if not os.path.exists(abs_video_path):
        return

    cap = cv2.VideoCapture(abs_video_path)
    frame_count = int(cap.get(cv2.CAP_PROP_FRAME_COUNT))
    fps = cap.get(cv2.CAP_PROP_FPS) or 30
    sample_rate = max(1, frame_count // 30)  # sample up to ~30 frames
    metrics_list = []

    # Use user anthropometrics if available (keeps calculations consistent across frames).
    user_data = None
    try:
        profile = analysis.user.profile
        if profile.height and profile.weight:
            user_data = {"height": profile.height, "weight": profile.weight}
    except UserProfile.DoesNotExist:
        user_data = None

    engine = GolfPhysicsEngine(user_profile=user_data)

    for i in range(0, frame_count, sample_rate):
        cap.set(cv2.CAP_PROP_POS_FRAMES, i)
        ret, frame = cap.read()
        if not ret:
            continue
        # ---- Placeholder for pose extraction ----
        # In a real implementation, you would run a pose model (e.g., MediaPipe) here.
        # For now we mock a pose dict with required keys.
        pose = {
            'shoulder_angle': 80,
            'hip_rotation': 30,
            'knee_flexion': 45,
            'spine_angle': 15,
        }
        # Compute physics metrics for this frame
        x_factor = engine.calculate_x_factor(pose['shoulder_angle'], pose['hip_rotation'])
        omega = engine.estimate_angular_velocity_from_x_factor(x_factor, swing_tempo_ratio=3.0)
        angular_momentum = engine.estimate_angular_momentum(omega, segment='trunk')
        physics_score = engine.assess_impact_efficiency(
            wrist_angle=None,
            swing_tempo_ratio=3.0,
            knee_flexion=pose.get("knee_flexion"),
            spine_angle=pose.get("spine_angle"),
        )
        metrics_list.append({
            'x_factor': x_factor,
            'angular_momentum': angular_momentum,
            'physics_score': physics_score,
        })
    cap.release()

    if not metrics_list:
        return
    # Aggregate (average) metrics
    agg = {
        'x_factor': sum(m['x_factor'] for m in metrics_list) / len(metrics_list),
        'angular_momentum': sum(m['angular_momentum'] for m in metrics_list) / len(metrics_list),
        'physics_score': sum(m['physics_score'] for m in metrics_list) / len(metrics_list),
    }

    # Call AI service for textual feedback
    ai_feedback = get_ai_feedback(agg)
    analysis.ai_feedback = ai_feedback

    # ---- Generate feedback image ----
    img = Image.new('RGB', (800, 400), color=(30, 30, 30))
    draw = ImageDraw.Draw(img)
    try:
        font = ImageFont.truetype('arial.ttf', 24)
    except Exception:
        font = ImageFont.load_default()
    text = f"X‑Factor: {agg['x_factor']:.2f}\nAngular Momentum: {agg['angular_momentum']:.2f}\nPhysics Score: {agg['physics_score']:.1f}\n\nAI Advice:\n{ai_feedback}"
    draw.multiline_text((20, 20), text, fill=(255, 255, 255), font=font, spacing=6)
    img_bytes = ContentFile(b'')
    img.save(img_bytes, format='PNG')
    img_name = f'feedback/images/analysis_{analysis.id}_feedback.png'
    analysis.feedback_image.save(img_name, img_bytes, save=False)

    # ---- Generate feedback video (simple overlay) ----
    try:
        clip = VideoFileClip(abs_video_path)
        txt = TextClip(text, fontsize=24, color='white', bg_color='black', method='caption')
        txt = txt.set_position(('center', 'bottom')).set_duration(clip.duration)
        composite = CompositeVideoClip([clip, txt])
        video_path = f'feedback/videos/analysis_{analysis.id}_feedback.mp4'
        # Save to a temporary location first
        temp_path = os.path.join(settings.MEDIA_ROOT, video_path)
        os.makedirs(os.path.dirname(temp_path), exist_ok=True)
        composite.write_videofile(temp_path, codec='libx264', audio=False, fps=fps, logger=None)
        # Store in model field
        with open(temp_path, 'rb') as f:
            analysis.feedback_video.save(video_path, ContentFile(f.read()), save=False)
        # Cleanup temp file
        os.remove(temp_path)
    except Exception as e:
        # If video generation fails, we just skip it
        pass

    analysis.save()
    # Notify front‑end via WebSocket that analysis is complete
    channel_layer = get_channel_layer()
    async_to_sync(channel_layer.group_send)(
        "pose_data",
        {
            "type": "analysis_complete",
            "data": {
                "analysis_id": analysis.id,
                "feedback_image_url": analysis.feedback_image.url if analysis.feedback_image else None,
                "feedback_video_url": analysis.feedback_video.url if analysis.feedback_video else None,
            },
        },
    )
