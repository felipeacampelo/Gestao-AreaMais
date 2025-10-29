from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import ProductViewSet, BatchViewSet

app_name = 'products'

router = DefaultRouter()
router.register(r'products', ProductViewSet, basename='product')
router.register(r'batches', BatchViewSet, basename='batch')

urlpatterns = [
    path('', include(router.urls)),
]
