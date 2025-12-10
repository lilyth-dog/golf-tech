from django.db import models
from django.contrib.auth.models import User

class UserProfile(models.Model):
    user = models.OneToOneField(User, on_delete=models.CASCADE, related_name='profile')
    nickname = models.CharField(max_length=50, blank=True)
    
    # Physical Stats
    height = models.FloatField(null=True, blank=True, help_text="Height in cm")
    weight = models.FloatField(null=True, blank=True, help_text="Weight in kg")
    skeletal_muscle_mass = models.FloatField(null=True, blank=True, help_text="Skeletal Muscle Mass in kg")
    body_fat_percentage = models.FloatField(null=True, blank=True, help_text="Body Fat Percentage")
    bmi = models.FloatField(null=True, blank=True)
    bone_mineral_density = models.FloatField(null=True, blank=True)
    visceral_fat_level = models.IntegerField(null=True, blank=True)
    body_water_percentage = models.FloatField(null=True, blank=True)
    basal_metabolic_rate = models.FloatField(null=True, blank=True)
    flexibility = models.FloatField(null=True, blank=True, help_text="Sit and reach in cm")
    
    # Golf specific
    handicap = models.IntegerField(default=30)
    years_experience = models.IntegerField(default=0, help_text="Years of playing golf")
    
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)
    
    def __str__(self):
        return f"{self.user.username}'s Profile"
