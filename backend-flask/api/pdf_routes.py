from flask import Blueprint, request, jsonify
from werkzeug.exceptions import BadRequest
from services.pdf_service import PDFService
from services.qa_service import QAService
from models.models import PDFDocument, User
from functools import wraps
import jwt
import os

bp = Blueprint('pdf', __name__)
pdf_service = PDFService()
qa_service = QAService()

def token_required(f):
    """Decorator to require JWT token authentication."""
    @wraps(f)
    def decorated(*args, **kwargs):
        token = request.headers.get('Authorization')

        if not token:
            return jsonify({'error': 'Token is missing'}), 401

        try:
            # Remove 'Bearer ' prefix if present
            if token.startswith('Bearer '):
                token = token[7:]

            # Decode token
            secret_key = os.getenv('SECRET_KEY', 'dev-secret-key')
            data = jwt.decode(token, secret_key, algorithms=['HS256'])
            current_user_id = data['user_id']

            # Verify user exists
            user = User.query.get(current_user_id)
            if not user:
                return jsonify({'error': 'Invalid token'}), 401

        except jwt.ExpiredSignatureError:
            return jsonify({'error': 'Token has expired'}), 401
        except jwt.InvalidTokenError:
            return jsonify({'error': 'Invalid token'}), 401

        return f(current_user_id, *args, **kwargs)

    return decorated


@bp.route('/upload', methods=['POST'])
@token_required
def upload_pdf(current_user_id):
    """
    Upload a PDF file.

    Expected: multipart/form-data with 'file' field
    Returns: PDF document information
    """
    if 'file' not in request.files:
        return jsonify({'error': 'No file provided'}), 400

    file = request.files['file']

    if file.filename == '':
        return jsonify({'error': 'No file selected'}), 400

    if not file.filename.lower().endswith('.pdf'):
        return jsonify({'error': 'File must be a PDF'}), 400

    try:
        # Save PDF
        pdf_doc = pdf_service.save_pdf(file, current_user_id)

        # Process PDF in background (for MVP, we'll do it synchronously)
        result = pdf_service.process_pdf(pdf_doc.id)

        if result['status'] == 'error':
            return jsonify({
                'error': 'Failed to process PDF',
                'details': result.get('error')
            }), 500

        return jsonify({
            'message': 'PDF uploaded and processed successfully',
            'pdf': {
                'id': pdf_doc.id,
                'filename': pdf_doc.original_filename,
                'status': pdf_doc.status.value,
                'page_count': pdf_doc.page_count,
                'created_at': pdf_doc.created_at.isoformat()
            },
            'processing_result': result
        }), 201

    except Exception as e:
        return jsonify({'error': str(e)}), 500


@bp.route('/<pdf_id>/ask', methods=['POST'])
@token_required
def ask_question(current_user_id, pdf_id):
    """
    Ask a question about a PDF.

    Expected JSON: {'question': 'your question here'}
    Returns: Answer with sources
    """
    data = request.get_json()

    if not data or 'question' not in data:
        return jsonify({'error': 'Question is required'}), 400

    question = data['question'].strip()
    if not question:
        return jsonify({'error': 'Question cannot be empty'}), 400

    # Verify PDF exists and belongs to user
    pdf_doc = PDFDocument.query.get(pdf_id)
    if not pdf_doc:
        return jsonify({'error': 'PDF not found'}), 404

    if pdf_doc.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    # Get answer
    result = qa_service.ask_question(pdf_id, question, current_user_id)

    if result['status'] == 'error':
        return jsonify({'error': result['error']}), 500

    return jsonify(result), 200


@bp.route('/<pdf_id>/history', methods=['GET'])
@token_required
def get_chat_history(current_user_id, pdf_id):
    """
    Get chat history for a PDF.

    Returns: List of messages
    """
    # Verify PDF exists and belongs to user
    pdf_doc = PDFDocument.query.get(pdf_id)
    if not pdf_doc:
        return jsonify({'error': 'PDF not found'}), 404

    if pdf_doc.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    # Get history
    limit = request.args.get('limit', 50, type=int)
    messages = qa_service.get_chat_history(pdf_id, limit)

    return jsonify({
        'pdf_id': pdf_id,
        'messages': messages
    }), 200


@bp.route('/<pdf_id>', methods=['GET'])
@token_required
def get_pdf(current_user_id, pdf_id):
    """
    Get PDF document information.

    Returns: PDF metadata
    """
    pdf_doc = PDFDocument.query.get(pdf_id)
    if not pdf_doc:
        return jsonify({'error': 'PDF not found'}), 404

    if pdf_doc.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    return jsonify({
        'id': pdf_doc.id,
        'filename': pdf_doc.original_filename,
        'status': pdf_doc.status.value,
        'page_count': pdf_doc.page_count,
        'file_size': pdf_doc.file_size,
        'created_at': pdf_doc.created_at.isoformat(),
        'updated_at': pdf_doc.updated_at.isoformat(),
        'error_message': pdf_doc.error_message
    }), 200


@bp.route('', methods=['GET'])
@token_required
def list_pdfs(current_user_id):
    """
    List all PDFs for the current user.

    Returns: List of PDF documents
    """
    pdfs = PDFDocument.query.filter_by(user_id=current_user_id)\
        .order_by(PDFDocument.created_at.desc())\
        .all()

    return jsonify({
        'pdfs': [
            {
                'id': pdf.id,
                'filename': pdf.original_filename,
                'status': pdf.status.value,
                'page_count': pdf.page_count,
                'file_size': pdf.file_size,
                'created_at': pdf.created_at.isoformat()
            }
            for pdf in pdfs
        ]
    }), 200


@bp.route('/<pdf_id>', methods=['DELETE'])
@token_required
def delete_pdf(current_user_id, pdf_id):
    """
    Delete a PDF document.

    Returns: Success message
    """
    # Verify PDF exists and belongs to user
    pdf_doc = PDFDocument.query.get(pdf_id)
    if not pdf_doc:
        return jsonify({'error': 'PDF not found'}), 404

    if pdf_doc.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    # Delete PDF
    success = pdf_service.delete_pdf(pdf_id)

    if not success:
        return jsonify({'error': 'Failed to delete PDF'}), 500

    return jsonify({'message': 'PDF deleted successfully'}), 200


@bp.route('/<pdf_id>/summary', methods=['POST'])
@token_required
def summarize_pdf(current_user_id, pdf_id):
    """
    Generate a summary of the PDF document.

    Returns: Document summary
    """
    # Verify PDF exists and belongs to user
    pdf_doc = PDFDocument.query.get(pdf_id)
    if not pdf_doc:
        return jsonify({'error': 'PDF not found'}), 404

    if pdf_doc.user_id != current_user_id:
        return jsonify({'error': 'Unauthorized'}), 403

    # Generate summary
    result = qa_service.summarize_document(pdf_id, current_user_id)

    if result['status'] == 'error':
        return jsonify({'error': result['error']}), 500

    return jsonify(result), 200
