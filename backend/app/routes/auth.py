from flask import Blueprint, request, jsonify
from werkzeug.security import check_password_hash
from flask_jwt_extended import create_access_token, jwt_required, get_jwt_identity
from app.models.outlet import Outlet
from datetime import timedelta

auth_bp = Blueprint('auth', __name__)


@auth_bp.route('/login', methods=['POST'])
def login():
    """Login outlet and return JWT token"""
    data = request.get_json()
    
    if not data or 'email' not in data or 'password' not in data:
        return jsonify({
            'success': False,
            'error': 'Email and password required'
        }), 400
    
    outlet = Outlet.query.filter_by(email=data['email']).first()
    
    if not outlet or not check_password_hash(outlet.password_hash, data['password']):
        return jsonify({
            'success': False,
            'error': 'Invalid email or password'
        }), 401
    
    if not outlet.is_active:
        return jsonify({
            'success': False,
            'error': 'Outlet account is deactivated'
        }), 401
    
    # Create JWT token
    access_token = create_access_token(
        identity=outlet.id,
        expires_delta=timedelta(days=7)
    )
    
    return jsonify({
        'success': True,
        'access_token': access_token,
        'outlet': outlet.to_dict(),
        'message': 'Login successful'
    })


@auth_bp.route('/me', methods=['GET'])
@jwt_required()
def get_current_outlet():
    """Get currently logged in outlet"""
    outlet_id = get_jwt_identity()
    outlet = Outlet.query.get_or_404(outlet_id)
    
    return jsonify({
        'success': True,
        'data': outlet.to_dict()
    })


@auth_bp.route('/verify', methods=['GET'])
@jwt_required()
def verify_token():
    """Verify if token is valid"""
    outlet_id = get_jwt_identity()
    outlet = Outlet.query.get(outlet_id)
    
    if not outlet:
        return jsonify({
            'success': False,
            'error': 'Invalid token'
        }), 401
    
    return jsonify({
        'success': True,
        'valid': True,
        'outlet_id': outlet_id
    })
