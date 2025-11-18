from flask import Blueprint, request, jsonify, Response
from api.auth_routes import token_required
from models.models import Project, ChatMessage, MessageRole
from app import db
from services.ai_service import AIService
import uuid

bp = Blueprint('ai', __name__)
ai_service = AIService()

@bp.route('/chat', methods=['POST'])
@token_required
def chat(current_user):
    data = request.get_json()
    project_id = data.get('projectId')
    message = data.get('message')
    context = data.get('context')

    if not project_id or not message:
        return jsonify({'error': 'Project ID and message are required'}), 400

    # Verify project ownership
    project = Project.query.filter_by(id=project_id, user_id=current_user.id).first()

    if not project:
        return jsonify({'error': 'Project not found'}), 404

    # Get AI response
    response_text = ai_service.chat_completion(message, context)

    # Save messages
    user_message = ChatMessage(
        id=str(uuid.uuid4()),
        project_id=project_id,
        user_id=current_user.id,
        role=MessageRole.USER,
        content=message
    )

    ai_message = ChatMessage(
        id=str(uuid.uuid4()),
        project_id=project_id,
        user_id=current_user.id,
        role=MessageRole.ASSISTANT,
        content=response_text
    )

    db.session.add(user_message)
    db.session.add(ai_message)
    db.session.commit()

    return jsonify({
        'role': 'assistant',
        'content': response_text
    }), 200

@bp.route('/chat/stream', methods=['POST'])
@token_required
def stream_chat(current_user):
    data = request.get_json()
    project_id = data.get('projectId')
    message = data.get('message')
    context = data.get('context')

    if not project_id or not message:
        return jsonify({'error': 'Project ID and message are required'}), 400

    # Verify project ownership
    project = Project.query.filter_by(id=project_id, user_id=current_user.id).first()

    if not project:
        return jsonify({'error': 'Project not found'}), 404

    def generate():
        full_response = []

        for chunk in ai_service.stream_chat_completion(message, context):
            full_response.append(chunk)
            yield f"data: {chunk}\n\n"

        yield "data: [DONE]\n\n"

        # Save messages after streaming
        user_message = ChatMessage(
            id=str(uuid.uuid4()),
            project_id=project_id,
            user_id=current_user.id,
            role=MessageRole.USER,
            content=message
        )

        ai_message = ChatMessage(
            id=str(uuid.uuid4()),
            project_id=project_id,
            user_id=current_user.id,
            role=MessageRole.ASSISTANT,
            content=''.join(full_response)
        )

        db.session.add(user_message)
        db.session.add(ai_message)
        db.session.commit()

    return Response(generate(), mimetype='text/event-stream')

@bp.route('/explain', methods=['POST'])
@token_required
def explain_code(current_user):
    data = request.get_json()
    code = data.get('code')
    language = data.get('language')

    if not code or not language:
        return jsonify({'error': 'Code and language are required'}), 400

    explanation = ai_service.explain_code(code, language)

    return jsonify({'explanation': explanation}), 200

@bp.route('/suggestions', methods=['POST'])
@token_required
def get_suggestions(current_user):
    data = request.get_json()
    project_id = data.get('projectId')
    file_path = data.get('filePath')

    if not project_id or not file_path:
        return jsonify({'error': 'Project ID and file path are required'}), 400

    # Verify project ownership
    project = Project.query.filter_by(id=project_id, user_id=current_user.id).first()

    if not project or not project.local_path:
        return jsonify({'error': 'Project not found'}), 404

    import os
    from services.git_service import GitService

    git_service = GitService()
    full_path = os.path.join(project.local_path, file_path)

    # Security check
    if not os.path.abspath(full_path).startswith(os.path.abspath(project.local_path)):
        return jsonify({'error': 'Access denied'}), 403

    # Get file content
    content = git_service.get_file_content(full_path)
    language = git_service.get_language_from_path(full_path)

    # Generate suggestions
    suggestions = ai_service.generate_suggestions(full_path, content, language)

    return jsonify(suggestions), 200
