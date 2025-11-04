"""
Utility functions for payments app.
"""


def validate_cpf(cpf: str) -> bool:
    """
    Validate Brazilian CPF.
    
    Args:
        cpf: CPF string (only numbers)
        
    Returns:
        True if valid, False otherwise
    """
    # Remove non-digits
    cpf = ''.join(filter(str.isdigit, cpf))
    
    # Check if has 11 digits
    if len(cpf) != 11:
        return False
    
    # Check if all digits are the same
    if cpf == cpf[0] * 11:
        return False
    
    # Validate first digit
    sum_digits = sum(int(cpf[i]) * (10 - i) for i in range(9))
    digit1 = (sum_digits * 10 % 11) % 10
    
    if int(cpf[9]) != digit1:
        return False
    
    # Validate second digit
    sum_digits = sum(int(cpf[i]) * (11 - i) for i in range(10))
    digit2 = (sum_digits * 10 % 11) % 10
    
    if int(cpf[10]) != digit2:
        return False
    
    return True
