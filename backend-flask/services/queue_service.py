# Queue service for code analysis jobs
# For Vercel deployment, jobs run synchronously
# For production with longer timeouts, use Celery or similar

import threading
from services.analysis_service import CodeAnalyzer
from models.models import Project, AnalysisResult, ProjectStatus
from app import db
import uuid


def add_analysis_job(project_id, local_path):
    """Add analysis job to queue and process it"""
    print(f'Analysis job queued for project {project_id} at {local_path}')

    # For Vercel, run in background thread (limited to 10s execution time on hobby plan)
    # For longer analyses, consider external queue service
    thread = threading.Thread(target=process_analysis_job, args=(project_id, local_path))
    thread.daemon = True
    thread.start()


def process_analysis_job(project_id, local_path):
    """Process code analysis job"""
    try:
        print(f'Starting analysis for project {project_id}')

        # Update project status
        project = Project.query.get(project_id)
        if not project:
            print(f'Project {project_id} not found')
            return

        project.status = ProjectStatus.ANALYZING
        db.session.commit()

        # Run analysis
        analyzer = CodeAnalyzer(local_path)
        results = analyzer.analyze_project()

        # Store results in database
        for file_result in results['results']:
            analysis_result = AnalysisResult(
                id=str(uuid.uuid4()),
                project_id=project_id,
                file_path=file_result['file_path'],
                language=file_result['language'],
                issues=file_result['issues'],
                suggestions=file_result['suggestions'],
                metrics=file_result['metrics']
            )
            db.session.add(analysis_result)

        # Update project status
        project.status = ProjectStatus.COMPLETED
        project.file_count = results['files_analyzed']
        db.session.commit()

        print(f'Analysis completed for project {project_id}: {results["files_analyzed"]} files, {results["total_issues"]} issues')

    except Exception as e:
        print(f'Error processing analysis job: {e}')
        try:
            project = Project.query.get(project_id)
            if project:
                project.status = ProjectStatus.FAILED
                db.session.commit()
        except Exception as db_error:
            print(f'Error updating project status: {db_error}')
