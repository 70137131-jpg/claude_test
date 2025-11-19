from datetime import datetime
from app import db
import enum

class ProjectStatus(enum.Enum):
    PENDING = 'pending'
    ANALYZING = 'analyzing'
    COMPLETED = 'completed'
    FAILED = 'failed'

class ReviewStatus(enum.Enum):
    IN_PROGRESS = 'in_progress'
    COMPLETED = 'completed'

class MessageRole(enum.Enum):
    USER = 'user'
    ASSISTANT = 'assistant'

class DocumentationType(enum.Enum):
    ARCHITECTURE = 'architecture'
    API_REFERENCE = 'api_reference'
    USAGE_EXAMPLES = 'usage_examples'
    ONBOARDING = 'onboarding'
    CHANGELOG = 'changelog'
    DEPENDENCY_MAP = 'dependency_map'

class DocumentationStatus(enum.Enum):
    CURRENT = 'current'
    OUTDATED = 'outdated'
    NEEDS_REVIEW = 'needs_review'

class User(db.Model):
    __tablename__ = 'users'

    id = db.Column(db.String(36), primary_key=True)
    email = db.Column(db.String(255), unique=True, nullable=False)
    name = db.Column(db.String(255), nullable=False)
    password = db.Column(db.String(255))
    avatar = db.Column(db.String(500))
    github_id = db.Column(db.String(100), unique=True)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    projects = db.relationship('Project', backref='user', lazy=True, cascade='all, delete-orphan')
    reviews = db.relationship('Review', backref='user', lazy=True, cascade='all, delete-orphan')
    comments = db.relationship('ReviewComment', backref='user', lazy=True, cascade='all, delete-orphan')
    chat_messages = db.relationship('ChatMessage', backref='user', lazy=True, cascade='all, delete-orphan')

class Project(db.Model):
    __tablename__ = 'projects'

    id = db.Column(db.String(36), primary_key=True)
    name = db.Column(db.String(255), nullable=False)
    description = db.Column(db.Text)
    repository_url = db.Column(db.String(500))
    local_path = db.Column(db.String(500))
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.Enum(ProjectStatus), default=ProjectStatus.PENDING)
    file_count = db.Column(db.Integer)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    analysis_results = db.relationship('AnalysisResult', backref='project', lazy=True, cascade='all, delete-orphan')
    reviews = db.relationship('Review', backref='project', lazy=True, cascade='all, delete-orphan')
    chat_messages = db.relationship('ChatMessage', backref='project', lazy=True, cascade='all, delete-orphan')
    documentations = db.relationship('Documentation', backref='project', lazy=True, cascade='all, delete-orphan')

class AnalysisResult(db.Model):
    __tablename__ = 'analysis_results'

    id = db.Column(db.String(36), primary_key=True)
    project_id = db.Column(db.String(36), db.ForeignKey('projects.id'), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    language = db.Column(db.String(50), nullable=False)
    issues = db.Column(db.JSON, nullable=False)
    suggestions = db.Column(db.JSON, nullable=False)
    metrics = db.Column(db.JSON, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Review(db.Model):
    __tablename__ = 'reviews'

    id = db.Column(db.String(36), primary_key=True)
    project_id = db.Column(db.String(36), db.ForeignKey('projects.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    status = db.Column(db.Enum(ReviewStatus), default=ReviewStatus.IN_PROGRESS)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    comments = db.relationship('ReviewComment', backref='review', lazy=True, cascade='all, delete-orphan')

class ReviewComment(db.Model):
    __tablename__ = 'review_comments'

    id = db.Column(db.String(36), primary_key=True)
    review_id = db.Column(db.String(36), db.ForeignKey('reviews.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    line = db.Column(db.Integer, nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class ChatMessage(db.Model):
    __tablename__ = 'chat_messages'

    id = db.Column(db.String(36), primary_key=True)
    project_id = db.Column(db.String(36), db.ForeignKey('projects.id'), nullable=False)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    role = db.Column(db.Enum(MessageRole), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class Documentation(db.Model):
    __tablename__ = 'documentations'

    id = db.Column(db.String(36), primary_key=True)
    project_id = db.Column(db.String(36), db.ForeignKey('projects.id'), nullable=False)
    doc_type = db.Column(db.Enum(DocumentationType), nullable=False)
    title = db.Column(db.String(255), nullable=False)
    content = db.Column(db.Text, nullable=False)
    status = db.Column(db.Enum(DocumentationStatus), default=DocumentationStatus.CURRENT)
    file_path = db.Column(db.String(500))  # If associated with a specific file
    version = db.Column(db.Integer, default=1)
    code_hash = db.Column(db.String(64))  # Hash of code when doc was generated
    metadata = db.Column(db.JSON)  # Store additional metadata like dependencies, test coverage, etc.
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    drift_detections = db.relationship('DocumentationDrift', backref='documentation', lazy=True, cascade='all, delete-orphan')

class DocumentationDrift(db.Model):
    __tablename__ = 'documentation_drifts'

    id = db.Column(db.String(36), primary_key=True)
    documentation_id = db.Column(db.String(36), db.ForeignKey('documentations.id'), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    old_code_hash = db.Column(db.String(64), nullable=False)
    new_code_hash = db.Column(db.String(64), nullable=False)
    commit_sha = db.Column(db.String(40))
    drift_description = db.Column(db.Text)
    severity = db.Column(db.String(20))  # low, medium, high, critical
    auto_update_suggested = db.Column(db.Boolean, default=False)
    detected_at = db.Column(db.DateTime, default=datetime.utcnow)

class GitHook(db.Model):
    __tablename__ = 'git_hooks'

    id = db.Column(db.String(36), primary_key=True)
    project_id = db.Column(db.String(36), db.ForeignKey('projects.id'), nullable=False)
    hook_type = db.Column(db.String(50), nullable=False)  # pre-commit, post-commit, pre-push
    enabled = db.Column(db.Boolean, default=True)
    config = db.Column(db.JSON)  # Hook-specific configuration
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
