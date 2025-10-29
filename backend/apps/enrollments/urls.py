from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EnrollmentViewSet

app_name = 'enrollments'

router = DefaultRouter()
router.register(r'', EnrollmentViewSet, basename='enrollment')

urlpatterns = [
    path('', include(router.urls)),
]
