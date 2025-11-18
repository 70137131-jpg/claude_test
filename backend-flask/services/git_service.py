import git
import os
import shutil
from pathlib import Path

class GitService:
    def __init__(self):
        self.upload_dir = os.getenv('UPLOAD_DIR', './uploads')
        os.makedirs(self.upload_dir, exist_ok=True)

    def clone_repository(self, repo_url, project_id):
        """Clone a git repository"""
        local_path = os.path.join(self.upload_dir, project_id)

        try:
            git.Repo.clone_from(repo_url, local_path, depth=1)
            return local_path
        except Exception as e:
            raise Exception(f'Failed to clone repository: {str(e)}')

    def get_file_tree(self, local_path):
        """Get file tree structure"""
        def build_tree(path):
            name = os.path.basename(path)

            if os.path.isdir(path):
                children = []
                try:
                    entries = os.listdir(path)

                    for entry in entries:
                        # Skip hidden files and node_modules
                        if entry.startswith('.') or entry == 'node_modules':
                            continue

                        entry_path = os.path.join(path, entry)
                        child = build_tree(entry_path)
                        if child:
                            children.append(child)

                    # Sort: directories first, then alphabetically
                    children.sort(key=lambda x: (x['type'] != 'directory', x['name']))

                    return {
                        'path': path,
                        'name': name,
                        'type': 'directory',
                        'children': children
                    }

                except PermissionError:
                    return None
            else:
                return {
                    'path': path,
                    'name': name,
                    'type': 'file',
                    'size': os.path.getsize(path),
                    'language': self.get_language_from_path(path)
                }

        return build_tree(local_path)

    def get_file_content(self, file_path):
        """Read file content"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                return f.read()
        except Exception as e:
            raise Exception(f'Failed to read file: {str(e)}')

    def get_language_from_path(self, file_path):
        """Determine language from file extension"""
        ext = Path(file_path).suffix.lower()

        lang_map = {
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.py': 'python',
            '.java': 'java',
            '.cpp': 'cpp',
            '.c': 'c',
            '.cs': 'csharp',
            '.go': 'go',
            '.rs': 'rust',
            '.rb': 'ruby',
            '.php': 'php',
            '.swift': 'swift',
            '.kt': 'kotlin',
            '.scala': 'scala',
        }

        return lang_map.get(ext, 'plaintext')

    def delete_project(self, local_path):
        """Delete project directory"""
        try:
            if os.path.exists(local_path):
                shutil.rmtree(local_path)
        except Exception as e:
            print(f'Failed to delete project: {e}')

    def get_all_code_files(self, local_path):
        """Get all code files in project"""
        code_extensions = [
            '.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.cpp', '.c',
            '.cs', '.go', '.rs', '.rb', '.php', '.swift', '.kt', '.scala',
        ]

        code_files = []

        for root, dirs, files in os.walk(local_path):
            # Skip hidden directories and node_modules
            dirs[:] = [d for d in dirs if not d.startswith('.') and d != 'node_modules']

            for file in files:
                if Path(file).suffix.lower() in code_extensions:
                    code_files.append(os.path.join(root, file))

        return code_files
