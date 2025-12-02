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

class PDFStatus(enum.Enum):
    UPLOADING = 'uploading'
    PROCESSING = 'processing'
    READY = 'ready'
    FAILED = 'failed'

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
    project_id = db.Column(db.String(36), db.ForeignKey('projects.id'), nullable=True)
    pdf_id = db.Column(db.String(36), db.ForeignKey('pdf_documents.id'), nullable=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    role = db.Column(db.Enum(MessageRole), nullable=False)
    content = db.Column(db.Text, nullable=False)
    created_at = db.Column(db.DateTime, default=datetime.utcnow)

class PDFDocument(db.Model):
    __tablename__ = 'pdf_documents'

    id = db.Column(db.String(36), primary_key=True)
    user_id = db.Column(db.String(36), db.ForeignKey('users.id'), nullable=False)
    filename = db.Column(db.String(255), nullable=False)
    original_filename = db.Column(db.String(255), nullable=False)
    file_path = db.Column(db.String(500), nullable=False)
    file_size = db.Column(db.Integer, nullable=False)
    page_count = db.Column(db.Integer)
    status = db.Column(db.Enum(PDFStatus), default=PDFStatus.UPLOADING)
    error_message = db.Column(db.Text)
    vectorstore_path = db.Column(db.String(500))
    created_at = db.Column(db.DateTime, default=datetime.utcnow)
    updated_at = db.Column(db.DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)

    chat_messages = db.relationship('ChatMessage', backref='pdf_document', lazy=True, cascade='all, delete-orphan')
    user = db.relationship('User', backref='pdf_documents', lazy=True)
