"""Code analysis service for static code analysis"""
import os
import re
import json
from typing import Dict, List, Any
from pathlib import Path


class CodeAnalyzer:
    """Static code analyzer for detecting code issues and metrics"""

    # File extensions to analyze
    SUPPORTED_EXTENSIONS = {
        '.py': 'python',
        '.js': 'javascript',
        '.jsx': 'javascript',
        '.ts': 'typescript',
        '.tsx': 'typescript',
        '.java': 'java',
        '.cpp': 'cpp',
        '.c': 'c',
        '.go': 'go',
        '.rb': 'ruby',
        '.php': 'php',
        '.rs': 'rust',
        '.swift': 'swift',
        '.kt': 'kotlin',
        '.cs': 'csharp'
    }

    # Common code smell patterns
    CODE_SMELLS = {
        'long_function': {
            'pattern': r'def\s+\w+\([^)]*\):|function\s+\w+\([^)]*\)\s*{',
            'threshold': 50,  # lines
            'severity': 'medium',
            'message': 'Function is too long (>50 lines)'
        },
        'deep_nesting': {
            'pattern': r'(\s{4,})(if|for|while|switch)',
            'threshold': 4,  # levels
            'severity': 'medium',
            'message': 'Deep nesting detected (>4 levels)'
        },
        'magic_numbers': {
            'pattern': r'[^a-zA-Z_]\d{2,}[^a-zA-Z_]',
            'severity': 'low',
            'message': 'Magic number detected - consider using named constant'
        },
        'console_log': {
            'pattern': r'console\.(log|debug|info|warn|error)',
            'severity': 'low',
            'message': 'Console statement found - remove before production'
        },
        'todo_comment': {
            'pattern': r'(TODO|FIXME|HACK|XXX):?',
            'severity': 'low',
            'message': 'TODO/FIXME comment found'
        },
        'empty_catch': {
            'pattern': r'catch\s*\([^)]*\)\s*{\s*}',
            'severity': 'high',
            'message': 'Empty catch block - errors are being silently ignored'
        }
    }

    # Security patterns
    SECURITY_ISSUES = {
        'sql_injection': {
            'pattern': r'(execute|query)\s*\(\s*["\'].*\+.*["\']',
            'severity': 'critical',
            'message': 'Potential SQL injection - use parameterized queries'
        },
        'hardcoded_password': {
            'pattern': r'(password|pwd|passwd)\s*=\s*["\'][^"\']+["\']',
            'severity': 'critical',
            'message': 'Hardcoded password detected'
        },
        'eval_usage': {
            'pattern': r'\beval\s*\(',
            'severity': 'critical',
            'message': 'eval() usage detected - potential security risk'
        },
        'weak_crypto': {
            'pattern': r'(md5|sha1)\s*\(',
            'severity': 'high',
            'message': 'Weak cryptographic function - use SHA-256 or better'
        }
    }

    def __init__(self, project_path: str):
        self.project_path = project_path

    def analyze_project(self) -> Dict[str, Any]:
        """Analyze entire project and return results"""
        results = []
        total_issues = 0
        total_files = 0

        for root, dirs, files in os.walk(self.project_path):
            # Skip common directories
            dirs[:] = [d for d in dirs if d not in ['.git', 'node_modules', '__pycache__', 'venv', '.venv', 'dist', 'build']]

            for file in files:
                ext = os.path.splitext(file)[1]
                if ext in self.SUPPORTED_EXTENSIONS:
                    file_path = os.path.join(root, file)
                    relative_path = os.path.relpath(file_path, self.project_path)

                    try:
                        analysis = self.analyze_file(file_path, relative_path)
                        if analysis:
                            results.append(analysis)
                            total_issues += len(analysis['issues'])
                            total_files += 1
                    except Exception as e:
                        print(f'Error analyzing {relative_path}: {e}')

        return {
            'files_analyzed': total_files,
            'total_issues': total_issues,
            'results': results
        }

    def analyze_file(self, file_path: str, relative_path: str) -> Dict[str, Any]:
        """Analyze a single file"""
        try:
            with open(file_path, 'r', encoding='utf-8', errors='ignore') as f:
                content = f.read()
                lines = content.split('\n')

            ext = os.path.splitext(file_path)[1]
            language = self.SUPPORTED_EXTENSIONS.get(ext, 'unknown')

            issues = []
            suggestions = []

            # Detect code smells
            for smell_name, smell_config in self.CODE_SMELLS.items():
                detected = self._detect_pattern(content, lines, smell_config, smell_name)
                issues.extend(detected)

            # Detect security issues
            for sec_name, sec_config in self.SECURITY_ISSUES.items():
                detected = self._detect_pattern(content, lines, sec_config, sec_name)
                issues.extend(detected)

            # Calculate metrics
            metrics = self._calculate_metrics(content, lines)

            # Generate suggestions based on issues
            if len(issues) > 0:
                suggestions.append({
                    'type': 'refactor',
                    'message': f'Found {len(issues)} issues that could be addressed',
                    'priority': self._calculate_priority(issues)
                })

            return {
                'file_path': relative_path,
                'language': language,
                'issues': issues,
                'suggestions': suggestions,
                'metrics': metrics
            }

        except Exception as e:
            return None

    def _detect_pattern(self, content: str, lines: List[str], config: Dict, issue_type: str) -> List[Dict]:
        """Detect issues based on regex pattern"""
        issues = []
        pattern = config['pattern']

        for i, line in enumerate(lines, start=1):
            matches = re.finditer(pattern, line)
            for match in matches:
                # Special handling for deep nesting
                if issue_type == 'deep_nesting':
                    indent_level = len(match.group(1)) // 4
                    if indent_level >= config.get('threshold', 4):
                        issues.append({
                            'type': issue_type,
                            'line': i,
                            'column': match.start() + 1,
                            'severity': config['severity'],
                            'message': config['message'],
                            'code': line.strip()
                        })
                # Special handling for long functions
                elif issue_type == 'long_function':
                    func_lines = self._count_function_lines(lines, i - 1)
                    if func_lines > config.get('threshold', 50):
                        issues.append({
                            'type': issue_type,
                            'line': i,
                            'column': match.start() + 1,
                            'severity': config['severity'],
                            'message': f'Function is {func_lines} lines long',
                            'code': line.strip()
                        })
                else:
                    issues.append({
                        'type': issue_type,
                        'line': i,
                        'column': match.start() + 1,
                        'severity': config['severity'],
                        'message': config['message'],
                        'code': line.strip()
                    })

        return issues

    def _count_function_lines(self, lines: List[str], start_idx: int) -> int:
        """Count lines in a function starting from start_idx"""
        count = 0
        brace_count = 0
        in_function = False

        for i in range(start_idx, len(lines)):
            line = lines[i].strip()
            if not in_function and ('{' in line or ':' in line):
                in_function = True

            if in_function:
                count += 1
                brace_count += line.count('{') - line.count('}')

                # Python function end detection
                if ':' in lines[start_idx] and i > start_idx:
                    if line and not line.startswith(' ') and not line.startswith('\t'):
                        break

                # Brace-based language function end
                if brace_count == 0 and '{' in lines[start_idx]:
                    break

                if count > 200:  # Safety limit
                    break

        return count

    def _calculate_metrics(self, content: str, lines: List[str]) -> Dict[str, Any]:
        """Calculate code metrics"""
        non_empty_lines = [l for l in lines if l.strip() and not l.strip().startswith(('/', '#', '*'))]

        return {
            'lines_of_code': len(non_empty_lines),
            'total_lines': len(lines),
            'comment_lines': len(lines) - len(non_empty_lines),
            'complexity_estimate': self._estimate_complexity(content),
            'average_line_length': sum(len(l) for l in lines) / max(len(lines), 1)
        }

    def _estimate_complexity(self, content: str) -> int:
        """Rough cyclomatic complexity estimate"""
        complexity = 1  # Base complexity

        # Count decision points
        complexity += len(re.findall(r'\bif\b', content))
        complexity += len(re.findall(r'\belse\b', content))
        complexity += len(re.findall(r'\bfor\b', content))
        complexity += len(re.findall(r'\bwhile\b', content))
        complexity += len(re.findall(r'\bcase\b', content))
        complexity += len(re.findall(r'\bcatch\b', content))
        complexity += len(re.findall(r'\b&&\b', content))
        complexity += len(re.findall(r'\b\|\|\b', content))

        return complexity

    def _calculate_priority(self, issues: List[Dict]) -> str:
        """Calculate priority based on issue severity"""
        severity_counts = {
            'critical': 0,
            'high': 0,
            'medium': 0,
            'low': 0
        }

        for issue in issues:
            severity = issue.get('severity', 'low')
            severity_counts[severity] = severity_counts.get(severity, 0) + 1

        if severity_counts['critical'] > 0:
            return 'critical'
        elif severity_counts['high'] > 2:
            return 'high'
        elif severity_counts['medium'] > 5:
            return 'medium'
        else:
            return 'low'
