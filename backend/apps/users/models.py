"""
User models with clean architecture.
"""
from django.contrib.auth.models import AbstractUser, BaseUserManager
from django.db import models
from django.utils.translation import gettext_lazy as _


class UserManager(BaseUserManager):
    """Custom user manager for email-based authentication."""
    
    def create_user(self, email, password=None, **extra_fields):
        """Create and save a regular user."""
        if not email:
            raise ValueError(_('O email é obrigatório'))
        
        email = self.normalize_email(email)
        user = self.model(email=email, **extra_fields)
        user.set_password(password)
        user.save(using=self._db)
        return user
    
    def create_superuser(self, email, password=None, **extra_fields):
        """Create and save a superuser."""
        extra_fields.setdefault('is_staff', True)
        extra_fields.setdefault('is_superuser', True)
        
        if extra_fields.get('is_staff') is not True:
            raise ValueError(_('Superuser deve ter is_staff=True'))
        if extra_fields.get('is_superuser') is not True:
            raise ValueError(_('Superuser deve ter is_superuser=True'))
        
        return self.create_user(email, password, **extra_fields)


class User(AbstractUser):
    """Custom user model using email as username."""
    
    username = None
    email = models.EmailField(_('email'), unique=True)
    
    USERNAME_FIELD = 'email'
    REQUIRED_FIELDS = []
    
    objects = UserManager()
    
    class Meta:
        verbose_name = _('Usuário')
        verbose_name_plural = _('Usuários')
    
    def __str__(self):
        return self.email


class UserProfile(models.Model):
    """Extended user profile with additional information."""
    
    user = models.OneToOneField(
        User,
        on_delete=models.CASCADE,
        related_name='profile',
        verbose_name=_('Usuário')
    )
    
    phone = models.CharField(
        _('Telefone'),
        max_length=20,
        blank=True
    )
    
    cpf = models.CharField(
        _('CPF'),
        max_length=14,
        blank=True,
        unique=True,
        null=True
    )
    
    asaas_customer_id = models.CharField(
        _('ID Cliente Asaas'),
        max_length=100,
        blank=True,
        null=True,
        help_text=_('ID do cliente no sistema Asaas')
    )
    
    created_at = models.DateTimeField(_('Criado em'), auto_now_add=True)
    updated_at = models.DateTimeField(_('Atualizado em'), auto_now=True)
    
    class Meta:
        verbose_name = _('Perfil de Usuário')
        verbose_name_plural = _('Perfis de Usuários')
    
    def __str__(self):
        return f'Perfil de {self.user.email}'
