from flask import jsonify
from typing import Dict, List, Optional, Any

def validate_required_fields(data: Dict, required_fields: List[str]) -> Optional[Any]:
    """
    Validate that all required fields are present in the data.
    
    Args:
        data: Dictionary containing the request data
        required_fields: List of required field names
        
    Returns:
        None if validation passes, or a tuple (response, status_code) if validation fails
    """
    if not data:
        return jsonify({"error": "No data provided"}), 400
        
    missing_fields = [field for field in required_fields if field not in data]
    
    if missing_fields:
        return jsonify({
            "error": f"Missing required fields: {', '.join(missing_fields)}"
        }), 400
        
    return None