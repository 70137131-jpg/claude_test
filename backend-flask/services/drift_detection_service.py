import hashlib
from datetime import datetime
from models.models import Documentation, DocumentationDrift, db
from services.documentation_service import DocumentationService
import uuid

class DriftDetectionService:
    """Service for detecting when code changes make documentation outdated"""

    def __init__(self):
        self.doc_service = DocumentationService()

    def check_project_for_drift(self, project_id, changed_files):
        """
        Check if any changed files have made documentation outdated

        Args:
            project_id: The project to check
            changed_files: List of dicts with 'path' and 'new_content'

        Returns:
            List of drift detections
        """
        drift_detections = []

        for file_info in changed_files:
            file_path = file_info['path']
            new_content = file_info['new_content']
            old_content = file_info.get('old_content', '')

            # Find documentation related to this file
            docs = Documentation.query.filter_by(
                project_id=project_id,
                file_path=file_path
            ).all()

            for doc in docs:
                drift = self.detect_drift_for_file(
                    doc,
                    old_content,
                    new_content,
                    file_info.get('commit_sha')
                )

                if drift:
                    drift_detections.append(drift)

        return drift_detections

    def detect_drift_for_file(self, documentation, old_code, new_code, commit_sha=None):
        """
        Detect if a specific documentation has drifted from the code

        Args:
            documentation: Documentation model instance
            old_code: Previous version of code
            new_code: New version of code
            commit_sha: Git commit SHA if available

        Returns:
            DocumentationDrift model instance or None
        """
        # Calculate hashes
        old_hash = hashlib.sha256(old_code.encode('utf-8')).hexdigest()
        new_hash = hashlib.sha256(new_code.encode('utf-8')).hexdigest()

        # If code hasn't changed, no drift
        if old_hash == new_hash:
            return None

        # Check if hash matches what's stored in documentation
        if documentation.code_hash == new_hash:
            return None

        # Use AI to analyze the drift
        drift_analysis = self.doc_service.detect_documentation_drift(
            old_code,
            new_code,
            documentation.content
        )

        if not drift_analysis or not drift_analysis.get('is_outdated'):
            return None

        # Create drift detection record
        drift = DocumentationDrift(
            id=str(uuid.uuid4()),
            documentation_id=documentation.id,
            file_path=documentation.file_path,
            old_code_hash=old_hash,
            new_code_hash=new_hash,
            commit_sha=commit_sha,
            drift_description=drift_analysis.get('drift_description'),
            severity=drift_analysis.get('severity', 'medium'),
            auto_update_suggested=drift_analysis.get('auto_update_safe', False)
        )

        # Update documentation status
        from models.models import DocumentationStatus
        if drift_analysis.get('severity') in ['high', 'critical']:
            documentation.status = DocumentationStatus.OUTDATED
        else:
            documentation.status = DocumentationStatus.NEEDS_REVIEW

        db.session.add(drift)
        db.session.commit()

        return drift

    def get_drift_report(self, project_id):
        """
        Get a comprehensive drift report for a project

        Args:
            project_id: Project to analyze

        Returns:
            Dict with drift statistics and details
        """
        # Get all documentation for project
        docs = Documentation.query.filter_by(project_id=project_id).all()

        total_docs = len(docs)
        outdated_docs = sum(1 for d in docs if d.status.value == 'outdated')
        needs_review = sum(1 for d in docs if d.status.value == 'needs_review')
        current_docs = sum(1 for d in docs if d.status.value == 'current')

        # Get recent drift detections
        recent_drifts = []
        for doc in docs:
            drifts = DocumentationDrift.query.filter_by(
                documentation_id=doc.id
            ).order_by(DocumentationDrift.detected_at.desc()).limit(5).all()

            for drift in drifts:
                recent_drifts.append({
                    'id': drift.id,
                    'file_path': drift.file_path,
                    'severity': drift.severity,
                    'description': drift.drift_description,
                    'detected_at': drift.detected_at.isoformat(),
                    'doc_title': doc.title,
                    'doc_type': doc.doc_type.value
                })

        return {
            'total_documentation': total_docs,
            'current': current_docs,
            'outdated': outdated_docs,
            'needs_review': needs_review,
            'drift_percentage': round((outdated_docs + needs_review) / total_docs * 100, 1) if total_docs > 0 else 0,
            'recent_drifts': sorted(recent_drifts, key=lambda x: x['detected_at'], reverse=True)[:10]
        }

    def auto_update_documentation(self, drift_id):
        """
        Automatically update documentation based on drift detection

        Args:
            drift_id: ID of the drift to resolve

        Returns:
            Updated documentation or None
        """
        drift = DocumentationDrift.query.get(drift_id)

        if not drift or not drift.auto_update_suggested:
            return None

        doc = Documentation.query.get(drift.documentation_id)

        if not doc:
            return None

        # Get the new code content
        from services.git_service import GitService
        git_service = GitService()

        try:
            new_code = git_service.get_file_content(drift.file_path)

            # Re-generate the documentation based on type
            new_content = None

            if doc.doc_type.value == 'api_reference':
                language = git_service.get_language_from_path(drift.file_path)
                new_content = self.doc_service.generate_api_reference(new_code, language)

            elif doc.doc_type.value == 'usage_examples':
                new_content = self.doc_service.extract_usage_examples(new_code)

            if new_content:
                # Update documentation
                doc.content = new_content
                doc.code_hash = drift.new_code_hash
                doc.version += 1
                doc.status = DocumentationStatus.CURRENT
                doc.updated_at = datetime.utcnow()

                db.session.commit()

                return doc

        except Exception as e:
            print(f'Auto-update error: {e}')

        return None

    def schedule_drift_checks(self, project_id):
        """
        Schedule periodic drift checks for a project

        Args:
            project_id: Project to check

        Returns:
            Job ID
        """
        from services.queue_service import QueueService
        queue_service = QueueService()

        # Schedule drift check job
        job_id = queue_service.enqueue_drift_check(project_id)

        return job_id
