"""
Enrollment views.
"""
from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Enrollment
from .serializers import (
    EnrollmentSerializer,
    EnrollmentCreateSerializer,
    EnrollmentListSerializer
)


class EnrollmentViewSet(viewsets.ModelViewSet):
    """
    ViewSet for enrollments.
    Users can create and view their own enrollments.
    """
    permission_classes = [permissions.AllowAny]
    
    def get_queryset(self):
        """Return enrollments for current user."""
        if self.request.user.is_authenticated:
            return Enrollment.objects.filter(user=self.request.user).select_related(
                'product', 'batch', 'user'
            ).prefetch_related('payments')
        # Return empty queryset if not authenticated
        return Enrollment.objects.none()
    
    def get_serializer_class(self):
        if self.action == 'create':
            return EnrollmentCreateSerializer
        elif self.action == 'list':
            return EnrollmentListSerializer
        return EnrollmentSerializer
    
    def create(self, request, *args, **kwargs):
        """Create new enrollment."""
        from .email_service import send_enrollment_confirmation_email
        
        serializer = self.get_serializer(data=request.data)
        serializer.is_valid(raise_exception=True)
        enrollment = serializer.save()
        
        # TODO: Move email sending to background task (Celery/RQ) to avoid worker timeout
        # Send confirmation email
        # try:
        #     send_enrollment_confirmation_email(enrollment)
        # except Exception as e:
        #     print(f"Erro ao enviar email de confirmação: {e}")
        
        # Return full enrollment data
        response_serializer = EnrollmentSerializer(enrollment)
        return Response(
            response_serializer.data,
            status=status.HTTP_201_CREATED
        )
    
    def update(self, request, *args, **kwargs):
        """Update enrollment form_data."""
        enrollment = self.get_object()
        
        # Only allow updating if no payments have been made
        if enrollment.payments.filter(status__in=['CONFIRMED', 'RECEIVED']).exists():
            return Response(
                {'detail': 'Não é possível editar inscrição com pagamentos confirmados'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        # Update form_data
        if 'form_data' in request.data:
            enrollment.form_data.update(request.data['form_data'])
            enrollment.save()
        
        serializer = self.get_serializer(enrollment)
        return Response(serializer.data)
    
    def partial_update(self, request, *args, **kwargs):
        """Partial update enrollment form_data."""
        return self.update(request, *args, **kwargs)
    
    @action(detail=True, methods=['get'])
    def payments(self, request, pk=None):
        """Get all payments for an enrollment."""
        from apps.payments.serializers import PaymentListSerializer
        
        enrollment = self.get_object()
        payments = enrollment.payments.all().order_by('installment_number')
        serializer = PaymentListSerializer(payments, many=True)
        return Response(serializer.data)
    
    @action(detail=True, methods=['post'])
    def cancel(self, request, pk=None):
        """Cancel an enrollment."""
        enrollment = self.get_object()
        
        if enrollment.status == 'PAID':
            return Response(
                {'detail': 'Inscrições pagas não podem ser canceladas'},
                status=status.HTTP_400_BAD_REQUEST
            )
        
        enrollment.status = 'CANCELLED'
        enrollment.save()
        
        serializer = self.get_serializer(enrollment)
        return Response(serializer.data)
