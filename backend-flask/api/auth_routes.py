from flask import Blueprint, request, jsonify
from functools import wraps
import jwt
import bcrypt
import uuid
from datetime import datetime, timedelta
import os
from models.models import User
from app import db

bp = Blueprint('auth', __name__)

SECRET_KEY = os.getenv('SECRET_KEY', 'dev-secret-key')

def token_required(f):
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')

        if not token:
            return jsonify({'error': 'Token is missing'}), 401

        try:
            if token.startswith('Bearer '):
                token = token[7:]

            data = jwt.decode(token, SECRET_KEY, algorithms=['HS256'])
            current_user = User.query.get(data['user_id'])

            if not current_user:
                return jsonify({'error': 'Invalid token'}), 401

        except Exception as e:
            return jsonify({'error': 'Invalid token'}), 401

        return f(current_user, *args, **kwargs)

    return decorated

@bp.route('/register', methods=['POST'])
def register():
    data = request.get_json()

    email = data.get('email')
    password = data.get('password')
    name = data.get('name')

    if not email or not password or not name:
        return jsonify({'error': 'Missing required fields'}), 400

    # Check if user exists
    if User.query.filter_by(email=email).first():
        return jsonify({'error': 'User already exists'}), 400

    # Hash password
    hashed_password = bcrypt.hashpw(password.encode('utf-8'), bcrypt.gensalt()).decode('utf-8')

    # Create user
    user = User(
        id=str(uuid.uuid4()),
        email=email,
        password=hashed_password,
        name=name
    )

    db.session.add(user)
    db.session.commit()

    # Generate token
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.utcnow() + timedelta(days=7)
    }, SECRET_KEY, algorithm='HS256')

    return jsonify({
        'user': {
            'id': user.id,
            'email': user.email,
            'name': user.name,
            'avatar': user.avatar,
            'created_at': user.created_at.isoformat()
        },
        'token': token
    }), 201

@bp.route('/login', methods=['POST'])
def login():
    data = request.get_json()

    email = data.get('email')
    password = data.get('password')

    if not email or not password:
        return jsonify({'error': 'Missing email or password'}), 400

    user = User.query.filter_by(email=email).first()

    if not user or not user.password:
        return jsonify({'error': 'Invalid credentials'}), 401

    # Verify password
    if not bcrypt.checkpw(password.encode('utf-8'), user.password.encode('utf-8')):
        return jsonify({'error': 'Invalid credentials'}), 401

    # Generate token
    token = jwt.encode({
        'user_id': user.id,
        'exp': datetime.utcnow() + timedelta(days=7)
    }, SECRET_KEY, algorithm='HS256')

    return jsonify({
        'user': {
            'id': user.id,
            'email': user.email,
            'name': user.name,
            'avatar': user.avatar,
            'created_at': user.created_at.isoformat()
        },
        'token': token
    }), 200

@bp.route('/me', methods=['GET'])
@token_required
def get_current_user(current_user):
    return jsonify({
        'id': current_user.id,
        'email': current_user.email,
        'name': current_user.name,
        'avatar': current_user.avatar,
        'github_id': current_user.github_id,
        'created_at': current_user.created_at.isoformat()
    }), 200

@bp.route('/logout', methods=['POST'])
@token_required
def logout(current_user):
    # Since we're using stateless JWT, logout is handled client-side
    # The client should delete the token
    # For enhanced security, you could maintain a blacklist of tokens
    return jsonify({'message': 'Logged out successfully'}), 200

@bp.route('/github', methods=['POST'])
def github_callback():
    data = request.get_json()
    code = data.get('code')

    if not code:
        return jsonify({'error': 'GitHub code is required'}), 400

    # Exchange code for access token (implementation similar to Node.js version)
    # For now, return error
    return jsonify({'error': 'GitHub OAuth not yet implemented in Flask'}), 501
