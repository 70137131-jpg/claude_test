from flask import Flask, jsonify
from flask_cors import CORS
from flask_sqlalchemy import SQLAlchemy
from flask_migrate import Migrate
from dotenv import load_dotenv
import os

load_dotenv()

# Initialize Flask app
app = Flask(__name__)

# Configuration
app.config['SECRET_KEY'] = os.getenv('SECRET_KEY', 'dev-secret-key')
app.config['SQLALCHEMY_DATABASE_URI'] = os.getenv('DATABASE_URL', 'postgresql://postgres:postgres@localhost:5432/code_review_db')
app.config['SQLALCHEMY_TRACK_MODIFICATIONS'] = False
app.config['MAX_CONTENT_LENGTH'] = 100 * 1024 * 1024  # 100MB max file size

# Initialize extensions
db = SQLAlchemy(app)
migrate = Migrate(app, db)
CORS(app, origins=os.getenv('CORS_ORIGIN', 'http://localhost:5173'))

# Import routes
from api import auth_routes, project_routes, ai_routes, review_routes, docs_routes

# Register blueprints
app.register_blueprint(auth_routes.bp, url_prefix='/api/auth')
app.register_blueprint(project_routes.bp, url_prefix='/api/projects')
app.register_blueprint(ai_routes.bp, url_prefix='/api/ai')
app.register_blueprint(review_routes.bp, url_prefix='/api/reviews')
app.register_blueprint(docs_routes.bp, url_prefix='/api/docs')

# Health check endpoint
@app.route('/health', methods=['GET'])
def health_check():
    return jsonify({
        'status': 'ok',
        'message': 'Flask backend is running',
        'version': '1.0.0'
    }), 200

# Error handlers
@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    port = int(os.getenv('PORT', 5000))
    app.run(host='0.0.0.0', port=port, debug=os.getenv('FLASK_ENV') == 'development')
