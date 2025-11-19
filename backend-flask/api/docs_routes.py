from flask import Blueprint, request, jsonify
from models.models import Documentation, Project, DocumentationDrift, db, DocumentationType, DocumentationStatus
from services.documentation_service import DocumentationService
from services.drift_detection_service import DriftDetectionService
from services.git_hook_service import GitHookService
from services.dependency_analyzer import DependencyAnalyzer
from services.git_service import GitService
import uuid
import hmac
import hashlib

bp = Blueprint('docs', __name__)

# Initialize services
doc_service = DocumentationService()
drift_service = DriftDetectionService()
git_hook_service = GitHookService()
git_service = GitService()
dependency_analyzer = DependencyAnalyzer()


@bp.route('/generate', methods=['POST'])
def generate_documentation():
    """Generate documentation for a project"""
    data = request.get_json()

    project_id = data.get('project_id')
    doc_types = data.get('doc_types', ['architecture', 'api_reference', 'onboarding'])

    if not project_id:
        return jsonify({'error': 'project_id is required'}), 400

    project = Project.query.get(project_id)

    if not project:
        return jsonify({'error': 'Project not found'}), 404

    # Enqueue documentation generation job
    from services.queue_service import QueueService
    queue_service = QueueService()

    job_id = queue_service.enqueue_documentation_generation(project_id, doc_types)

    return jsonify({
        'message': 'Documentation generation started',
        'job_id': job_id,
        'project_id': project_id,
        'doc_types': doc_types
    }), 202


@bp.route('/project/<project_id>', methods=['GET'])
def get_project_documentation(project_id):
    """Get all documentation for a project"""
    docs = Documentation.query.filter_by(project_id=project_id).all()

    return jsonify({
        'project_id': project_id,
        'documentation': [
            {
                'id': doc.id,
                'type': doc.doc_type.value,
                'title': doc.title,
                'status': doc.status.value,
                'version': doc.version,
                'created_at': doc.created_at.isoformat(),
                'updated_at': doc.updated_at.isoformat(),
                'file_path': doc.file_path
            }
            for doc in docs
        ]
    }), 200


@bp.route('/<doc_id>', methods=['GET'])
def get_documentation(doc_id):
    """Get specific documentation by ID"""
    doc = Documentation.query.get(doc_id)

    if not doc:
        return jsonify({'error': 'Documentation not found'}), 404

    return jsonify({
        'id': doc.id,
        'project_id': doc.project_id,
        'type': doc.doc_type.value,
        'title': doc.title,
        'content': doc.content,
        'status': doc.status.value,
        'version': doc.version,
        'file_path': doc.file_path,
        'metadata': doc.metadata,
        'created_at': doc.created_at.isoformat(),
        'updated_at': doc.updated_at.isoformat()
    }), 200


@bp.route('/<doc_id>', methods=['DELETE'])
def delete_documentation(doc_id):
    """Delete documentation"""
    doc = Documentation.query.get(doc_id)

    if not doc:
        return jsonify({'error': 'Documentation not found'}), 404

    db.session.delete(doc)
    db.session.commit()

    return jsonify({'message': 'Documentation deleted'}), 200


@bp.route('/drift/check', methods=['POST'])
def check_drift():
    """Check for documentation drift"""
    data = request.get_json()

    project_id = data.get('project_id')
    changed_files = data.get('changed_files', [])

    if not project_id:
        return jsonify({'error': 'project_id is required'}), 400

    # Check for drift
    drifts = drift_service.check_project_for_drift(project_id, changed_files)

    return jsonify({
        'project_id': project_id,
        'drift_detected': len(drifts) > 0,
        'drift_count': len(drifts),
        'drifts': [
            {
                'id': drift.id,
                'file_path': drift.file_path,
                'severity': drift.severity,
                'description': drift.drift_description,
                'auto_update_suggested': drift.auto_update_suggested
            }
            for drift in drifts
        ]
    }), 200


@bp.route('/drift/report/<project_id>', methods=['GET'])
def get_drift_report(project_id):
    """Get drift report for a project"""
    report = drift_service.get_drift_report(project_id)

    return jsonify(report), 200


@bp.route('/drift/<drift_id>/auto-update', methods=['POST'])
def auto_update_drift(drift_id):
    """Automatically update documentation based on drift"""
    updated_doc = drift_service.auto_update_documentation(drift_id)

    if not updated_doc:
        return jsonify({'error': 'Auto-update not available for this drift'}), 400

    return jsonify({
        'message': 'Documentation updated automatically',
        'documentation_id': updated_doc.id,
        'new_version': updated_doc.version
    }), 200


@bp.route('/hooks/install', methods=['POST'])
def install_git_hook():
    """Install Git hook for auto-documentation"""
    data = request.get_json()

    project_id = data.get('project_id')
    hook_type = data.get('hook_type', 'post-commit')

    if not project_id:
        return jsonify({'error': 'project_id is required'}), 400

    try:
        hook = git_hook_service.install_hook(project_id, hook_type)

        return jsonify({
            'message': 'Git hook installed successfully',
            'hook_id': hook.id,
            'hook_type': hook.hook_type
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/hooks/<project_id>', methods=['GET'])
def get_project_hooks(project_id):
    """Get all hooks for a project"""
    hooks = git_hook_service.get_project_hooks(project_id)

    return jsonify({
        'project_id': project_id,
        'hooks': [
            {
                'id': hook.id,
                'hook_type': hook.hook_type,
                'enabled': hook.enabled,
                'created_at': hook.created_at.isoformat()
            }
            for hook in hooks
        ]
    }), 200


@bp.route('/hooks/<hook_id>/uninstall', methods=['DELETE'])
def uninstall_git_hook(hook_id):
    """Uninstall a Git hook"""
    hook = db.session.query('GitHook').get(hook_id)

    if not hook:
        return jsonify({'error': 'Hook not found'}), 404

    success = git_hook_service.uninstall_hook(hook.project_id, hook.hook_type)

    if success:
        return jsonify({'message': 'Hook uninstalled successfully'}), 200
    else:
        return jsonify({'error': 'Failed to uninstall hook'}), 500


@bp.route('/dependencies/<project_id>', methods=['GET'])
def analyze_dependencies(project_id):
    """Analyze project dependencies"""
    project = Project.query.get(project_id)

    if not project:
        return jsonify({'error': 'Project not found'}), 404

    # Analyze dependencies
    analysis = dependency_analyzer.analyze_project(project.local_path)

    # Generate Mermaid diagram
    diagram = dependency_analyzer.generate_mermaid_diagram()

    # Get health score
    health_score = dependency_analyzer.get_dependency_health_score()

    return jsonify({
        'project_id': project_id,
        'analysis': analysis,
        'diagram': diagram,
        'health_score': health_score
    }), 200


@bp.route('/auto-update', methods=['POST'])
def auto_update_from_hook():
    """Handle auto-update triggered by Git hook"""
    data = request.get_json()

    project_id = data.get('project_id')
    changed_files = data.get('changed_files', [])
    hook_type = data.get('hook_type')

    if not project_id:
        return jsonify({'error': 'project_id is required'}), 400

    # Prepare file data
    file_data = []
    project = Project.query.get(project_id)

    if not project:
        return jsonify({'error': 'Project not found'}), 404

    for file_path in changed_files:
        full_path = f"{project.local_path}/{file_path}"

        try:
            new_content = git_service.get_file_content(full_path)
            file_data.append({
                'path': file_path,
                'new_content': new_content,
                'old_content': ''  # Would need git history to get this
            })
        except:
            continue

    # Check for drift
    drifts = drift_service.check_project_for_drift(project_id, file_data)

    # If significant drift, trigger doc regeneration
    if len(drifts) > 0:
        from services.queue_service import QueueService
        queue_service = QueueService()

        job_id = queue_service.enqueue_documentation_generation(
            project_id,
            ['api_reference', 'changelog']
        )

        return jsonify({
            'message': 'Documentation update triggered',
            'drift_count': len(drifts),
            'job_id': job_id
        }), 202

    return jsonify({'message': 'No documentation updates needed'}), 200


@bp.route('/github-webhook', methods=['POST'])
def github_webhook():
    """Handle GitHub webhook events"""
    # Verify webhook signature
    signature = request.headers.get('X-Hub-Signature-256')
    # webhook_secret would be stored in GitHook config

    event_type = request.headers.get('X-GitHub-Event')
    payload = request.get_json()

    if event_type == 'push':
        # Handle push event
        commits = payload.get('commits', [])
        repo_full_name = payload.get('repository', {}).get('full_name')

        # Find project by repo
        project = Project.query.filter_by(repository_url=f"https://github.com/{repo_full_name}").first()

        if project:
            commit_data = {
                'commit_sha': payload.get('after'),
                'commit_message': commits[0].get('message') if commits else '',
                'changed_files': []
            }

            for commit in commits:
                commit_data['changed_files'].extend(commit.get('added', []))
                commit_data['changed_files'].extend(commit.get('modified', []))

            job_id = git_hook_service.handle_commit_event(project.id, commit_data)

            return jsonify({'message': 'Push event processed', 'job_id': job_id}), 200

    elif event_type == 'pull_request':
        # Handle PR event
        pr_number = payload.get('number')
        repo_full_name = payload.get('repository', {}).get('full_name')

        project = Project.query.filter_by(repository_url=f"https://github.com/{repo_full_name}").first()

        if project:
            pr_data = {
                'pr_number': pr_number,
                'changed_files': []  # Would need to fetch from GitHub API
            }

            drift_result = git_hook_service.handle_pr_event(project.id, pr_data)

            return jsonify({
                'message': 'PR event processed',
                'drift_detected': drift_result.get('has_drift', False)
            }), 200

    return jsonify({'message': 'Event received'}), 200


@bp.route('/generate/architecture/<project_id>', methods=['POST'])
def generate_architecture_docs(project_id):
    """Generate architecture documentation for a project"""
    project = Project.query.get(project_id)

    if not project:
        return jsonify({'error': 'Project not found'}), 404

    # Get file tree
    file_tree = git_service.get_file_tree(project.local_path)

    # Get main files content
    main_files = ['README.md', 'package.json', 'setup.py', 'Cargo.toml']
    main_content = ""

    for file_name in main_files:
        try:
            file_path = f"{project.local_path}/{file_name}"
            content = git_service.get_file_content(file_path)
            main_content += f"\n\n--- {file_name} ---\n{content[:1000]}"
        except:
            continue

    # Generate architecture overview
    arch_content = doc_service.generate_architecture_overview(file_tree, main_content)

    if not arch_content:
        return jsonify({'error': 'Failed to generate architecture documentation'}), 500

    # Save to database
    doc = Documentation(
        id=str(uuid.uuid4()),
        project_id=project_id,
        doc_type=DocumentationType.ARCHITECTURE,
        title=f"{project.name} - Architecture Overview",
        content=arch_content,
        status=DocumentationStatus.CURRENT,
        version=1,
        metadata={'generated_from': 'file_tree'}
    )

    db.session.add(doc)
    db.session.commit()

    return jsonify({
        'message': 'Architecture documentation generated',
        'documentation_id': doc.id,
        'content_preview': arch_content[:500]
    }), 201


@bp.route('/stats/<project_id>', methods=['GET'])
def get_documentation_stats(project_id):
    """Get documentation statistics for a project"""
    docs = Documentation.query.filter_by(project_id=project_id).all()

    stats = {
        'total': len(docs),
        'by_type': {},
        'by_status': {},
        'total_versions': sum(doc.version for doc in docs),
        'latest_update': max((doc.updated_at for doc in docs), default=None)
    }

    for doc in docs:
        doc_type = doc.doc_type.value
        status = doc.status.value

        stats['by_type'][doc_type] = stats['by_type'].get(doc_type, 0) + 1
        stats['by_status'][status] = stats['by_status'].get(status, 0) + 1

    if stats['latest_update']:
        stats['latest_update'] = stats['latest_update'].isoformat()

    return jsonify(stats), 200
