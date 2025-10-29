"""
Product serializers.
"""
from rest_framework import serializers
from .models import Product, Batch


class BatchSerializer(serializers.ModelSerializer):
    """Serializer for Batch model."""
    
    current_enrollments = serializers.IntegerField(read_only=True)
    is_full = serializers.BooleanField(read_only=True)
    pix_price = serializers.SerializerMethodField()
    
    class Meta:
        model = Batch
        fields = [
            'id',
            'name',
            'start_date',
            'end_date',
            'price',
            'pix_discount_percentage',
            'pix_price',
            'max_enrollments',
            'current_enrollments',
            'is_full',
            'status',
        ]
    
    def get_pix_price(self, obj):
        """Get price with PIX discount applied."""
        return float(obj.calculate_pix_price())


class ProductSerializer(serializers.ModelSerializer):
    """Serializer for Product model."""
    
    active_batch = BatchSerializer(read_only=True, source='get_active_batch')
    
    class Meta:
        model = Product
        fields = [
            'id',
            'name',
            'description',
            'image',
            'base_price',
            'max_installments',
            'is_active',
            'event_date',
            'active_batch',
        ]


class ProductListSerializer(serializers.ModelSerializer):
    """Simplified serializer for product listing."""
    
    class Meta:
        model = Product
        fields = ['id', 'name', 'description', 'image', 'base_price', 'is_active', 'event_date']
