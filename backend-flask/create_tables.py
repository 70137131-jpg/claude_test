"""
Script to create database tables for Flask backend
Run this once to initialize the database schema
"""
from app import app, db
from models.models import User, Project, AnalysisResult, Review, ReviewComment, ChatMessage

def create_tables():
    """Create all database tables"""
    with app.app_context():
        # Create all tables
        db.create_all()
        print('✓ Database tables created successfully!')
        print('\nTables created:')
        print('  - users')
        print('  - projects')
        print('  - analysis_results')
        print('  - reviews')
        print('  - review_comments')
        print('  - chat_messages')

if __name__ == '__main__':
    create_tables()
