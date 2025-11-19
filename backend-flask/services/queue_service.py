"""
Background job service for analyzing code projects
For serverless environments, runs synchronously
For production with workers, use Celery or RQ
"""
import os
import re
from models.models import Project, AnalysisResult, ProjectStatus
from app import db
from services.git_service import GitService
from services.ai_service import AIService

git_service = GitService()

def add_analysis_job(project_id, local_path):
    """Add analysis job to queue and execute it"""
    try:
        # In serverless environment (Vercel), execute synchronously
        # For production with workers, replace with: celery_app.send_task()
        _analyze_project(project_id, local_path)
    except Exception as e:
        print(f'Analysis job failed for project {project_id}: {e}')
        # Update project status to failed
        project = Project.query.filter_by(id=project_id).first()
        if project:
            project.status = ProjectStatus.FAILED
            db.session.commit()

def _analyze_project(project_id, local_path):
    """Analyze project code and store results"""
    project = Project.query.filter_by(id=project_id).first()

    if not project:
        print(f'Project {project_id} not found')
        return

    # Update status to analyzing
    project.status = ProjectStatus.ANALYZING
    db.session.commit()

    try:
        # Get all code files
        code_files = git_service.get_all_code_files(local_path)
        project.file_count = len(code_files)
        db.session.commit()

        # Initialize AI service if API key is available
        ai_service = None
        try:
            if os.getenv('ANTHROPIC_API_KEY'):
                ai_service = AIService()
        except:
            print('AI service not available, skipping AI suggestions')

        # Analyze each file
        for file_path in code_files:
            try:
                _analyze_file(project_id, file_path, local_path, ai_service)
            except Exception as e:
                print(f'Failed to analyze {file_path}: {e}')
                continue

        # Mark project as completed
        project.status = ProjectStatus.COMPLETED
        db.session.commit()

        print(f'Analysis completed for project {project_id}: {len(code_files)} files')

    except Exception as e:
        print(f'Analysis failed for project {project_id}: {e}')
        project.status = ProjectStatus.FAILED
        db.session.commit()

def _analyze_file(project_id, file_path, local_path, ai_service=None):
    """Analyze a single file"""
    # Read file content
    try:
        content = git_service.get_file_content(file_path)
    except:
        return  # Skip files that can't be read

    # Get relative path
    rel_path = os.path.relpath(file_path, local_path)

    # Get language
    language = git_service.get_language_from_path(file_path)

    # Detect issues
    issues = _detect_issues(content, language)

    # Calculate metrics
    metrics = _calculate_metrics(content, language)

    # Generate AI suggestions if available
    suggestions = []
    if ai_service and len(content) < 10000:  # Only for reasonably sized files
        try:
            suggestions = ai_service.generate_suggestions(rel_path, content, language)
        except Exception as e:
            print(f'AI suggestions failed for {rel_path}: {e}')

    # Check if result already exists
    existing = AnalysisResult.query.filter_by(
        project_id=project_id,
        file_path=rel_path
    ).first()

    if existing:
        # Update existing result
        existing.language = language
        existing.issues = issues
        existing.suggestions = suggestions
        existing.metrics = metrics
    else:
        # Create new result
        import uuid
        result = AnalysisResult(
            id=str(uuid.uuid4()),
            project_id=project_id,
            file_path=rel_path,
            language=language,
            issues=issues,
            suggestions=suggestions,
            metrics=metrics
        )
        db.session.add(result)

    db.session.commit()

def _detect_issues(content, language):
    """Detect code issues using static analysis"""
    issues = []
    lines = content.split('\n')

    # Common patterns for all languages
    patterns = [
        {
            'pattern': r'\beval\s*\(',
            'type': 'security',
            'severity': 'high',
            'message': 'Use of eval() is a security risk'
        },
        {
            'pattern': r'console\.(log|debug|info|warn|error)',
            'type': 'style',
            'severity': 'low',
            'message': 'Console statement found - remove before production'
        },
        {
            'pattern': r'debugger\s*;',
            'type': 'style',
            'severity': 'medium',
            'message': 'Debugger statement found - remove before production'
        },
        {
            'pattern': r'TODO|FIXME|XXX',
            'type': 'maintainability',
            'severity': 'low',
            'message': 'TODO comment found'
        }
    ]

    # Language-specific patterns
    if language in ['javascript', 'typescript']:
        patterns.extend([
            {
                'pattern': r'var\s+\w+',
                'type': 'modernization',
                'severity': 'low',
                'message': 'Use const or let instead of var'
            },
            {
                'pattern': r'==(?!=)',
                'type': 'style',
                'severity': 'medium',
                'message': 'Use === instead of =='
            }
        ])
    elif language == 'python':
        patterns.extend([
            {
                'pattern': r'except:',
                'type': 'style',
                'severity': 'medium',
                'message': 'Bare except clause - specify exception type'
            }
        ])

    # Check each line
    for line_num, line in enumerate(lines, start=1):
        for pattern_def in patterns:
            if re.search(pattern_def['pattern'], line):
                issues.append({
                    'type': pattern_def['type'],
                    'severity': pattern_def['severity'],
                    'message': pattern_def['message'],
                    'line': line_num,
                    'code': line.strip()
                })

    return issues

def _calculate_metrics(content, language):
    """Calculate code metrics"""
    lines = content.split('\n')

    # Basic metrics
    total_lines = len(lines)
    code_lines = len([l for l in lines if l.strip() and not l.strip().startswith(('#', '//'))])
    blank_lines = len([l for l in lines if not l.strip()])
    comment_lines = total_lines - code_lines - blank_lines

    # Calculate cyclomatic complexity (simplified)
    complexity = _calculate_complexity(content, language)

    # Calculate maintainability index (0-100, higher is better)
    # Simplified formula based on lines of code and complexity
    import math
    if code_lines > 0:
        volume = code_lines * math.log2(max(code_lines, 2))
        maintainability = max(0, min(100, 171 - 5.2 * math.log(volume) - 0.23 * complexity))
    else:
        maintainability = 100

    return {
        'total_lines': total_lines,
        'code_lines': code_lines,
        'blank_lines': blank_lines,
        'comment_lines': comment_lines,
        'cyclomatic_complexity': complexity,
        'maintainability_index': round(maintainability, 2),
        'average_line_length': round(sum(len(l) for l in lines) / max(total_lines, 1), 2)
    }

def _calculate_complexity(content, language):
    """Calculate cyclomatic complexity"""
    # Count decision points
    complexity = 1  # Base complexity

    # Language-specific keywords that increase complexity
    if language in ['javascript', 'typescript']:
        keywords = r'\b(if|while|for|case|catch|\?\?|\|\||&&)\b'
    elif language == 'python':
        keywords = r'\b(if|while|for|except|elif|and|or)\b'
    elif language == 'java':
        keywords = r'\b(if|while|for|case|catch)\b'
    else:
        keywords = r'\b(if|while|for|case|catch)\b'

    complexity += len(re.findall(keywords, content))

    return complexity
