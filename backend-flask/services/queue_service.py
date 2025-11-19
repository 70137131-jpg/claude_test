# Queue service for background jobs
# In production, this would use Celery or Redis Queue

import uuid
from datetime import datetime

class QueueService:
    """Service for managing background jobs"""

    def __init__(self):
        self.jobs = {}  # In-memory job storage (use Redis in production)

    def add_analysis_job(self, project_id, local_path):
        """Add analysis job to queue"""
        job_id = str(uuid.uuid4())
        self.jobs[job_id] = {
            'type': 'analysis',
            'project_id': project_id,
            'local_path': local_path,
            'status': 'queued',
            'created_at': datetime.utcnow().isoformat()
        }
        print(f'Analysis job queued: {job_id} for project {project_id}')
        # In production: celery_app.send_task('analyze_project', args=[project_id, local_path])
        return job_id

    def enqueue_documentation_generation(self, project_id, doc_types):
        """Enqueue documentation generation job"""
        job_id = str(uuid.uuid4())
        self.jobs[job_id] = {
            'type': 'documentation_generation',
            'project_id': project_id,
            'doc_types': doc_types,
            'status': 'queued',
            'created_at': datetime.utcnow().isoformat()
        }
        print(f'Documentation generation job queued: {job_id}')
        # In production: celery_app.send_task('generate_documentation', args=[project_id, doc_types])
        return job_id

    def enqueue_drift_check(self, project_id):
        """Enqueue drift check job"""
        job_id = str(uuid.uuid4())
        self.jobs[job_id] = {
            'type': 'drift_check',
            'project_id': project_id,
            'status': 'queued',
            'created_at': datetime.utcnow().isoformat()
        }
        print(f'Drift check job queued: {job_id}')
        # In production: celery_app.send_task('check_drift', args=[project_id])
        return job_id

    def enqueue_documentation_update(self, project_id, changed_files, commit_sha, commit_message):
        """Enqueue documentation update job after commit"""
        job_id = str(uuid.uuid4())
        self.jobs[job_id] = {
            'type': 'documentation_update',
            'project_id': project_id,
            'changed_files': changed_files,
            'commit_sha': commit_sha,
            'commit_message': commit_message,
            'status': 'queued',
            'created_at': datetime.utcnow().isoformat()
        }
        print(f'Documentation update job queued: {job_id}')
        # In production: celery_app.send_task('update_documentation', args=[project_id, changed_files, commit_sha])
        return job_id

    def get_job_status(self, job_id):
        """Get status of a job"""
        return self.jobs.get(job_id, {'status': 'not_found'})

    def mark_job_complete(self, job_id):
        """Mark a job as complete"""
        if job_id in self.jobs:
            self.jobs[job_id]['status'] = 'completed'
            self.jobs[job_id]['completed_at'] = datetime.utcnow().isoformat()

    def mark_job_failed(self, job_id, error):
        """Mark a job as failed"""
        if job_id in self.jobs:
            self.jobs[job_id]['status'] = 'failed'
            self.jobs[job_id]['error'] = error
            self.jobs[job_id]['failed_at'] = datetime.utcnow().isoformat()
