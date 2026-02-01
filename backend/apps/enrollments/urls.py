from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EnrollmentViewSet, get_settings
from .views_coupon import validate_coupon

app_name = 'enrollments'

router = DefaultRouter()
router.register(r'', EnrollmentViewSet, basename='enrollment')

urlpatterns = [
    path('validate-coupon/', validate_coupon, name='validate-coupon'),
    path('settings/', get_settings, name='get-settings'),
    path('', include(router.urls)),
]
