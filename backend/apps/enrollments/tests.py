from decimal import Decimal
from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.urls import reverse
from django.utils import timezone
from rest_framework import status
from rest_framework.test import APITestCase

from apps.products.models import Batch, Product


User = get_user_model()


class EnrollmentSecurityTests(APITestCase):
    def setUp(self):
        self.user = User.objects.create_user(
            email='participant@example.com',
            password='password123',
            first_name='Participant',
            last_name='User',
        )

        self.product = Product.objects.create(
            name='Produto Teste',
            description='Produto para teste',
            base_price=Decimal('100.00'),
            max_installments=8,
            is_active=True,
        )

        now = timezone.now()
        self.batch = Batch.objects.create(
            product=self.product,
            name='Lote Teste',
            start_date=now - timedelta(days=1),
            end_date=now + timedelta(days=10),
            price=Decimal('100.00'),
            pix_installment_price=Decimal('120.00'),
            credit_card_price=Decimal('130.00'),
            status='ACTIVE',
        )

    def test_anonymous_cannot_list_enrollments(self):
        response = self.client.get(reverse('enrollments:enrollment-list'))

        self.assertEqual(response.status_code, status.HTTP_401_UNAUTHORIZED)

    @patch('apps.enrollments.email_service.send_enrollment_confirmation_email')
    def test_authenticated_user_can_create_enrollment(self, mock_send_email):
        self.client.force_authenticate(user=self.user)

        response = self.client.post(
            reverse('enrollments:enrollment-list'),
            {
                'product_id': self.product.id,
                'batch_id': self.batch.id,
                'form_data': {
                    'email': self.user.email,
                    'nome_completo': 'Participant User',
                },
            },
            format='json',
        )

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response.data['product']['id'], self.product.id)
        self.assertEqual(response.data['batch']['id'], self.batch.id)
