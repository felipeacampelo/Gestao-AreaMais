from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import EnrollmentViewSet
from .views_coupon import validate_coupon

app_name = 'enrollments'

router = DefaultRouter()
router.register(r'', EnrollmentViewSet, basename='enrollment')

urlpatterns = [
    path('validate-coupon/', validate_coupon, name='validate-coupon'),
    path('', include(router.urls)),
]
