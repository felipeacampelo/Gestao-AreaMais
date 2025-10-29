from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import PaymentViewSet, AsaasWebhookView, calculate_payment, simulate_pix_payment

app_name = 'payments'

router = DefaultRouter()
router.register(r'', PaymentViewSet, basename='payment')

urlpatterns = [
    path('calculate/', calculate_payment, name='calculate'),
    path('simulate-pix/', simulate_pix_payment, name='simulate-pix'),
    path('webhooks/asaas/', AsaasWebhookView.as_view(), name='asaas-webhook'),
    path('', include(router.urls)),
]
