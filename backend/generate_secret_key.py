#!/usr/bin/env python3
"""
Script para gerar Django SECRET_KEY seguro
"""
from django.core.management.utils import get_random_secret_key

if __name__ == '__main__':
    secret_key = get_random_secret_key()
    print("\n" + "="*70)
    print("🔐 Django SECRET_KEY Gerado:")
    print("="*70)
    print(f"\n{secret_key}\n")
    print("="*70)
    print("\n⚠️  Copie e cole no Railway Dashboard como DJANGO_SECRET_KEY")
    print("="*70 + "\n")
