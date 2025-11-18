from flask import Blueprint, request, jsonify
from api.auth_routes import token_required
import uuid
from models.models import Review, ReviewComment, Project, ReviewStatus
from app import db

bp = Blueprint('reviews', __name__)

@bp.route('/', methods=['POST'])
@token_required
def create_review(current_user):
    data = request.get_json()
    project_id = data.get('projectId')

    if not project_id:
        return jsonify({'error': 'Project ID is required'}), 400

    # Verify project ownership
    project = Project.query.filter_by(id=project_id, user_id=current_user.id).first()

    if not project:
        return jsonify({'error': 'Project not found'}), 404

    review = Review(
        id=str(uuid.uuid4()),
        project_id=project_id,
        user_id=current_user.id,
        status=ReviewStatus.IN_PROGRESS
    )

    db.session.add(review)
    db.session.commit()

    return jsonify({
        'id': review.id,
        'project_id': review.project_id,
        'user_id': review.user_id,
        'status': review.status.value,
        'created_at': review.created_at.isoformat()
    }), 201

@bp.route('/', methods=['GET'])
@token_required
def get_reviews(current_user):
    project_id = request.args.get('projectId')

    query = Review.query.filter_by(user_id=current_user.id)

    if project_id:
        query = query.filter_by(project_id=project_id)

    reviews = query.order_by(Review.created_at.desc()).all()

    return jsonify([{
        'id': r.id,
        'project_id': r.project_id,
        'user_id': r.user_id,
        'status': r.status.value,
        'created_at': r.created_at.isoformat(),
        'updated_at': r.updated_at.isoformat()
    } for r in reviews]), 200

@bp.route('/<review_id>', methods='GET'])
@token_required
def get_review(current_user, review_id):
    review = Review.query.filter_by(id=review_id, user_id=current_user.id).first()

    if not review:
        return jsonify({'error': 'Review not found'}), 404

    comments = ReviewComment.query.filter_by(review_id=review_id).order_by(ReviewComment.created_at).all()

    return jsonify({
        'id': review.id,
        'project_id': review.project_id,
        'user_id': review.user_id,
        'status': review.status.value,
        'created_at': review.created_at.isoformat(),
        'updated_at': review.updated_at.isoformat(),
        'comments': [{
            'id': c.id,
            'file_path': c.file_path,
            'line': c.line,
            'content': c.content,
            'created_at': c.created_at.isoformat()
        } for c in comments]
    }), 200
