import json
import math
import random
import requests
import datetime
import traceback

def execute_python_skill(code: str, args: dict) -> str:
    """
    Executes a Python script with the given arguments in a restricted scope.
    The script must define a `main(args)` function.
    """
    # Define the scope with allowed libraries
    scope = {
        "requests": requests,
        "json": json,
        "math": math,
        "random": random,
        "datetime": datetime,
        "print": print, # Allow print for debugging (captured in stdout if we wanted, but here just for safety)
    }
    
    try:
        # Execute the code in the restricted scope
        exec(code, scope)
        
        # Check if 'main' function is defined
        if "main" not in scope or not callable(scope["main"]):
            return "Error: The code must define a 'main(args)' function."
            
        # Call the main function
        result = scope["main"](args)
        
        # Ensure result is a string
        return str(result)
        
    except Exception as e:
        # Capture traceback for debugging
        tb = traceback.format_exc()
        return f"Error executing skill: {str(e)}\n\nTraceback:\n{tb}"
