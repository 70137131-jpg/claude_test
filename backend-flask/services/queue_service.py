# Placeholder for Celery queue service
# In production, this would use Celery for background jobs

def add_analysis_job(project_id, local_path):
    """Add analysis job to queue"""
    # For now, just log
    print(f'Analysis job queued for project {project_id} at {local_path}')
    # In production: celery_app.send_task('analyze_project', args=[project_id, local_path])
    pass
