"""
Admin views for managing system data.
"""
from rest_framework import generics, permissions, status
from rest_framework.decorators import api_view, permission_classes
from rest_framework.response import Response
from django.db.models import Count, Sum, Q
from django.utils import timezone
from datetime import timedelta

from .permissions import IsAdminUser
from apps.enrollments.models import Enrollment
from apps.enrollments.serializers import EnrollmentSerializer
from apps.payments.models import Payment
from apps.products.models import Product, Batch
from apps.products.serializers import ProductSerializer, BatchSerializer


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_dashboard_stats(request):
    """Get dashboard statistics for admin."""
    
    # Enrollment stats
    total_enrollments = Enrollment.objects.count()
    pending_enrollments = Enrollment.objects.filter(status='PENDING_PAYMENT').count()
    confirmed_enrollments = Enrollment.objects.filter(status='PAID').count()
    
    # Payment stats
    total_payments = Payment.objects.count()
    confirmed_payments = Payment.objects.filter(
        status__in=['CONFIRMED', 'RECEIVED']
    ).count()
    pending_payments = Payment.objects.filter(status='PENDING').count()
    
    # Revenue stats
    total_revenue = Payment.objects.filter(
        status__in=['CONFIRMED', 'RECEIVED']
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    pending_revenue = Payment.objects.filter(
        status='PENDING'
    ).aggregate(total=Sum('amount'))['total'] or 0
    
    # Recent activity (last 7 days)
    week_ago = timezone.now() - timedelta(days=7)
    recent_enrollments = Enrollment.objects.filter(
        created_at__gte=week_ago
    ).count()
    
    recent_payments = Payment.objects.filter(
        created_at__gte=week_ago,
        status__in=['CONFIRMED', 'RECEIVED']
    ).count()
    
    # Payment methods breakdown
    payment_methods = Enrollment.objects.values('payment_method').annotate(count=Count('id'))
    
    return Response({
        'enrollments': {
            'total': total_enrollments,
            'pending': pending_enrollments,
            'confirmed': confirmed_enrollments,
            'recent': recent_enrollments,
        },
        'payments': {
            'total': total_payments,
            'confirmed': confirmed_payments,
            'pending': pending_payments,
            'recent': recent_payments,
        },
        'revenue': {
            'total': float(total_revenue),
            'pending': float(pending_revenue),
        },
        'payment_methods': list(payment_methods),
    })


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_enrollments_list(request):
    """List all enrollments with filters."""
    
    enrollments = Enrollment.objects.select_related(
        'product', 'batch', 'user'
    ).prefetch_related('payments').order_by('-created_at')
    
    # Filters
    status_filter = request.query_params.get('status')
    product_filter = request.query_params.get('product')
    payment_method_filter = request.query_params.get('payment_method')
    search = request.query_params.get('search')
    
    if status_filter:
        enrollments = enrollments.filter(status=status_filter)
    
    if product_filter:
        enrollments = enrollments.filter(product_id=product_filter)
    
    if payment_method_filter:
        enrollments = enrollments.filter(payment_method=payment_method_filter)
    
    if search:
        enrollments = enrollments.filter(
            Q(user_email__icontains=search) |
            Q(form_data__nome_completo__icontains=search) |
            Q(form_data__cpf__icontains=search)
        )
    
    serializer = EnrollmentSerializer(enrollments, many=True)
    return Response(serializer.data)


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def admin_enrollment_update(request, pk):
    """Update enrollment status."""
    
    try:
        enrollment = Enrollment.objects.get(pk=pk)
    except Enrollment.DoesNotExist:
        return Response(
            {'detail': 'Inscrição não encontrada.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    new_status = request.data.get('status')
    if new_status:
        enrollment.status = new_status
        enrollment.save()
    
    serializer = EnrollmentSerializer(enrollment)
    return Response(serializer.data)


@api_view(['GET'])
@permission_classes([IsAdminUser])
def admin_products_list(request):
    """List all products."""
    
    products = Product.objects.prefetch_related('batches').all()
    serializer = ProductSerializer(products, many=True)
    return Response(serializer.data)


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_product_create(request):
    """Create a new product."""
    
    serializer = ProductSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def admin_product_update(request, pk):
    """Update a product."""
    
    try:
        product = Product.objects.get(pk=pk)
    except Product.DoesNotExist:
        return Response(
            {'detail': 'Produto não encontrado.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = ProductSerializer(product, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_product_delete(request, pk):
    """Delete a product."""
    
    try:
        product = Product.objects.get(pk=pk)
        product.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Product.DoesNotExist:
        return Response(
            {'detail': 'Produto não encontrado.'},
            status=status.HTTP_404_NOT_FOUND
        )


@api_view(['POST'])
@permission_classes([IsAdminUser])
def admin_batch_create(request):
    """Create a new batch."""
    
    serializer = BatchSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['PATCH'])
@permission_classes([IsAdminUser])
def admin_batch_update(request, pk):
    """Update a batch."""
    
    try:
        batch = Batch.objects.get(pk=pk)
    except Batch.DoesNotExist:
        return Response(
            {'detail': 'Lote não encontrado.'},
            status=status.HTTP_404_NOT_FOUND
        )
    
    serializer = BatchSerializer(batch, data=request.data, partial=True)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)


@api_view(['DELETE'])
@permission_classes([IsAdminUser])
def admin_batch_delete(request, pk):
    """Delete a batch."""
    
    try:
        batch = Batch.objects.get(pk=pk)
        batch.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
    except Batch.DoesNotExist:
        return Response(
            {'detail': 'Lote não encontrado.'},
            status=status.HTTP_404_NOT_FOUND
        )
