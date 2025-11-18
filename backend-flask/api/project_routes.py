from flask import Blueprint, request, jsonify
from api.auth_routes import token_required
import uuid
from models.models import Project, AnalysisResult, ProjectStatus
from app import db
from services.git_service import GitService
from services.queue_service import add_analysis_job
import os

bp = Blueprint('projects', __name__)
git_service = GitService()

@bp.route('/', methods=['GET'])
@token_required
def get_projects(current_user):
    projects = Project.query.filter_by(user_id=current_user.id).order_by(Project.created_at.desc()).all()

    return jsonify([{
        'id': p.id,
        'name': p.name,
        'description': p.description,
        'repository_url': p.repository_url,
        'status': p.status.value,
        'file_count': p.file_count,
        'created_at': p.created_at.isoformat(),
        'updated_at': p.updated_at.isoformat()
    } for p in projects]), 200

@bp.route('/<project_id>', methods=['GET'])
@token_required
def get_project(current_user, project_id):
    project = Project.query.filter_by(id=project_id, user_id=current_user.id).first()

    if not project:
        return jsonify({'error': 'Project not found'}), 404

    return jsonify({
        'id': project.id,
        'name': project.name,
        'description': project.description,
        'repository_url': project.repository_url,
        'status': project.status.value,
        'file_count': project.file_count,
        'created_at': project.created_at.isoformat(),
        'updated_at': project.updated_at.isoformat()
    }), 200

@bp.route('/github', methods=['POST'])
@token_required
def create_from_github(current_user):
    data = request.get_json()
    repo_url = data.get('repoUrl')

    if not repo_url:
        return jsonify({'error': 'Repository URL is required'}), 400

    # Extract repo name
    repo_name = repo_url.rstrip('/').split('/')[-1].replace('.git', '')

    # Create project
    project = Project(
        id=str(uuid.uuid4()),
        name=repo_name,
        repository_url=repo_url,
        user_id=current_user.id,
        status=ProjectStatus.PENDING
    )

    db.session.add(project)
    db.session.commit()

    try:
        # Clone repository
        local_path = git_service.clone_repository(repo_url, project.id)

        # Update project
        project.local_path = local_path
        db.session.commit()

        # Add to analysis queue
        add_analysis_job(project.id, local_path)

        return jsonify({
            'id': project.id,
            'name': project.name,
            'repository_url': project.repository_url,
            'status': project.status.value,
            'created_at': project.created_at.isoformat()
        }), 201

    except Exception as e:
        db.session.delete(project)
        db.session.commit()
        return jsonify({'error': str(e)}), 500

@bp.route('/<project_id>', methods=['DELETE'])
@token_required
def delete_project(current_user, project_id):
    project = Project.query.filter_by(id=project_id, user_id=current_user.id).first()

    if not project:
        return jsonify({'error': 'Project not found'}), 404

    # Delete local files
    if project.local_path:
        git_service.delete_project(project.local_path)

    db.session.delete(project)
    db.session.commit()

    return jsonify({'message': 'Project deleted successfully'}), 200

@bp.route('/<project_id>/analysis', methods=['GET'])
@token_required
def get_analysis_results(current_user, project_id):
    project = Project.query.filter_by(id=project_id, user_id=current_user.id).first()

    if not project:
        return jsonify({'error': 'Project not found'}), 404

    results = AnalysisResult.query.filter_by(project_id=project_id).order_by(AnalysisResult.file_path).all()

    return jsonify([{
        'id': r.id,
        'project_id': r.project_id,
        'file_path': r.file_path,
        'language': r.language,
        'issues': r.issues,
        'suggestions': r.suggestions,
        'metrics': r.metrics,
        'created_at': r.created_at.isoformat()
    } for r in results]), 200

@bp.route('/<project_id>/files', methods=['GET'])
@token_required
def get_file_tree(current_user, project_id):
    project = Project.query.filter_by(id=project_id, user_id=current_user.id).first()

    if not project or not project.local_path:
        return jsonify({'error': 'Project not found'}), 404

    file_tree = git_service.get_file_tree(project.local_path)

    return jsonify(file_tree), 200

@bp.route('/<project_id>/files/content', methods=['GET'])
@token_required
def get_file_content(current_user, project_id):
    file_path = request.args.get('path')

    if not file_path:
        return jsonify({'error': 'File path is required'}), 400

    project = Project.query.filter_by(id=project_id, user_id=current_user.id).first()

    if not project or not project.local_path:
        return jsonify({'error': 'Project not found'}), 404

    import os
    full_path = os.path.join(project.local_path, file_path)

    # Security check
    if not os.path.abspath(full_path).startswith(os.path.abspath(project.local_path)):
        return jsonify({'error': 'Access denied'}), 403

    content = git_service.get_file_content(full_path)

    return jsonify({'content': content}), 200

@bp.route('/<project_id>/analyze', methods=['POST'])
@token_required
def trigger_analysis(current_user, project_id):
    project = Project.query.filter_by(id=project_id, user_id=current_user.id).first()

    if not project or not project.local_path:
        return jsonify({'error': 'Project not found'}), 404

    add_analysis_job(project.id, project.local_path)

    return jsonify({'message': 'Analysis started'}), 200
