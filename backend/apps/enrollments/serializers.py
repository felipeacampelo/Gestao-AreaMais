"""
Enrollment serializers.
"""
from rest_framework import serializers
from .models import Enrollment
from apps.products.serializers import ProductSerializer, BatchSerializer


class EnrollmentSerializer(serializers.ModelSerializer):
    """Serializer for Enrollment model."""
    
    product = ProductSerializer(read_only=True)
    batch = BatchSerializer(read_only=True)
    user_email = serializers.EmailField(source='user.email', read_only=True)
    installment_value = serializers.DecimalField(
        max_digits=10,
        decimal_places=2,
        read_only=True
    )
    payments = serializers.SerializerMethodField()
    
    def get_payments(self, obj):
        """Get payments for this enrollment."""
        try:
            payments = obj.payments.all().order_by('due_date')
            return [{
                'id': p.id,
                'amount': str(p.amount),
                'status': p.status,
                'installment_number': p.installment_number,
                'due_date': p.due_date.isoformat() if p.due_date else None,
                'paid_at': p.paid_at.isoformat() if p.paid_at else None,
                'pix_qr_code': getattr(p, 'pix_qr_code', None),
                'pix_copy_paste': getattr(p, 'pix_copy_paste', None),
            } for p in payments]
        except Exception as e:
            return []
    
    class Meta:
        model = Enrollment
        fields = [
            'id',
            'user_email',
            'product',
            'batch',
            'form_data',
            'status',
            'payment_method',
            'installments',
            'total_amount',
            'discount_amount',
            'final_amount',
            'installment_value',
            'payments',
            'created_at',
            'paid_at',
        ]
        read_only_fields = [
            'id',
            'status',
            'total_amount',
            'discount_amount',
            'final_amount',
            'created_at',
            'paid_at',
        ]


class EnrollmentCreateSerializer(serializers.Serializer):
    """Serializer for creating enrollment."""
    
    product_id = serializers.IntegerField()
    batch_id = serializers.IntegerField()
    form_data = serializers.JSONField(required=False, default=dict)
    
    def validate(self, data):
        """Validate product and batch."""
        from apps.products.models import Product, Batch
        
        try:
            product = Product.objects.get(id=data['product_id'], is_active=True)
        except Product.DoesNotExist:
            raise serializers.ValidationError({'product_id': 'Produto não encontrado ou inativo'})
        
        try:
            batch = Batch.objects.get(id=data['batch_id'], product=product)
        except Batch.DoesNotExist:
            raise serializers.ValidationError({'batch_id': 'Lote não encontrado'})
        
        if batch.is_full:
            raise serializers.ValidationError({'batch_id': 'Lote esgotado'})
        
        if batch.status != 'ACTIVE':
            raise serializers.ValidationError({'batch_id': 'Lote não está ativo'})
        
        # Validate age (minimum 17 years)
        form_data = data.get('form_data', {})
        data_nascimento = form_data.get('data_nascimento')
        
        if data_nascimento:
            from datetime import datetime, date
            try:
                birth_date = datetime.strptime(data_nascimento, '%Y-%m-%d').date()
                today = date.today()
                age = today.year - birth_date.year - ((today.month, today.day) < (birth_date.month, birth_date.day))
                
                if age < 17:
                    raise serializers.ValidationError({
                        'form_data': 'Você precisa ter no mínimo 17 anos para se inscrever.'
                    })
            except ValueError:
                raise serializers.ValidationError({
                    'form_data': 'Data de nascimento inválida. Use o formato AAAA-MM-DD.'
                })
        
        # Check for duplicate enrollment
        request = self.context.get('request')
        
        # If user is authenticated, check by user
        if request and request.user.is_authenticated:
            existing_enrollment = Enrollment.objects.filter(
                user=request.user,
                product=product,
                status__in=['PENDING_PAYMENT', 'PAID']
            ).exists()
            
            if existing_enrollment:
                raise serializers.ValidationError({
                    'form_data': 'Você já possui uma inscrição ativa para este produto. Cada pessoa pode fazer apenas uma inscrição.'
                })
        else:
            # If not authenticated, check by email in form_data
            form_data = data.get('form_data', {})
            email = form_data.get('email', '').lower().strip()
            
            if email:
                existing_enrollment = Enrollment.objects.filter(
                    user__email__iexact=email,
                    product=product,
                    status__in=['PENDING_PAYMENT', 'PAID']
                ).exists()
                
                if existing_enrollment:
                    raise serializers.ValidationError({
                        'form_data': 'Você já possui uma inscrição ativa para este produto. Cada pessoa pode fazer apenas uma inscrição.'
                    })
        
        data['product'] = product
        data['batch'] = batch
        return data
    
    def create(self, validated_data):
        """Create enrollment."""
        from django.contrib.auth import get_user_model
        User = get_user_model()
        
        # Get or create user from request or form_data
        request = self.context.get('request')
        if request and request.user.is_authenticated:
            user = request.user
        else:
            # Create anonymous user or get from email in form_data
            form_data = validated_data.get('form_data', {})
            email = form_data.get('email', 'anonymous@example.com')
            nome_completo = form_data.get('nome_completo', 'Usuário')
            # Split name into first and last
            nome_parts = nome_completo.split(' ', 1)
            first_name = nome_parts[0] if nome_parts else 'Usuário'
            last_name = nome_parts[1] if len(nome_parts) > 1 else ''
            
            user, _ = User.objects.get_or_create(
                email=email,
                defaults={
                    'first_name': first_name,
                    'last_name': last_name
                }
            )
        
        product = validated_data.pop('product')
        batch = validated_data.pop('batch')
        validated_data.pop('product_id')
        validated_data.pop('batch_id')
        
        enrollment = Enrollment.objects.create(
            user=user,
            product=product,
            batch=batch,
            **validated_data
        )
        
        # Calculate amounts
        enrollment.calculate_amounts()
        enrollment.save()
        
        return enrollment


class EnrollmentListSerializer(serializers.ModelSerializer):
    """Simplified serializer for enrollment listing."""
    
    product_name = serializers.CharField(source='product.name', read_only=True)
    batch_name = serializers.CharField(source='batch.name', read_only=True)
    payments = serializers.SerializerMethodField()
    
    def get_payments(self, obj):
        """Get payments for this enrollment."""
        try:
            payments = obj.payments.all().order_by('due_date')
            return [{
                'id': p.id,
                'amount': str(p.amount),
                'status': p.status,
                'installment_number': p.installment_number,
                'due_date': p.due_date.isoformat() if p.due_date else None,
                'paid_at': p.paid_at.isoformat() if p.paid_at else None,
                'pix_qr_code': getattr(p, 'pix_qr_code', None),
                'pix_copy_paste': getattr(p, 'pix_copy_paste', None),
            } for p in payments]
        except Exception as e:
            return []
    
    class Meta:
        model = Enrollment
        fields = [
            'id',
            'product_name',
            'batch_name',
            'status',
            'payment_method',
            'installments',
            'final_amount',
            'payments',
            'paid_at',
            'created_at',
        ]
