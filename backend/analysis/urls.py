from django.urls import path
from .views import AnalysisCreateView, AnalysisListView, VideoUploadView

urlpatterns = [
    path('results/', AnalysisListView.as_view(), name='analysis-list'),
    path('analyze/', AnalysisCreateView.as_view(), name='analysis-create'),
]
