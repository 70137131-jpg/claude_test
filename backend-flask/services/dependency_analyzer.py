import os
import re
import json
from pathlib import Path
from collections import defaultdict, deque

class DependencyAnalyzer:
    """Analyze and visualize code dependencies"""

    def __init__(self):
        self.dependencies = defaultdict(set)
        self.reverse_dependencies = defaultdict(set)
        self.external_deps = set()

    def analyze_project(self, local_path):
        """
        Analyze all dependencies in a project

        Args:
            local_path: Path to the project

        Returns:
            Dict with dependency information
        """
        code_files = self._get_code_files(local_path)

        for file_path in code_files:
            self._analyze_file(file_path, local_path)

        return {
            'dependency_graph': self._build_dependency_graph(),
            'critical_modules': self._find_critical_modules(),
            'circular_dependencies': self._find_circular_dependencies(),
            'external_dependencies': list(self.external_deps),
            'dependency_layers': self._identify_layers(),
            'metrics': self._calculate_metrics()
        }

    def _get_code_files(self, local_path):
        """Get all code files in the project"""
        code_extensions = ['.js', '.jsx', '.ts', '.tsx', '.py', '.java', '.go', '.rs']
        code_files = []

        for root, dirs, files in os.walk(local_path):
            # Skip node_modules, venv, etc.
            dirs[:] = [d for d in dirs if d not in ['node_modules', 'venv', '__pycache__', '.git', 'dist', 'build']]

            for file in files:
                if Path(file).suffix in code_extensions:
                    code_files.append(os.path.join(root, file))

        return code_files

    def _analyze_file(self, file_path, project_root):
        """Analyze a single file for dependencies"""
        try:
            with open(file_path, 'r', encoding='utf-8') as f:
                content = f.read()

            language = self._get_language(file_path)
            imports = self._extract_imports(content, language)

            # Normalize file path relative to project
            rel_path = os.path.relpath(file_path, project_root)

            for import_path in imports:
                if self._is_external_dependency(import_path, language):
                    self.external_deps.add(import_path)
                else:
                    # Internal dependency
                    self.dependencies[rel_path].add(import_path)
                    self.reverse_dependencies[import_path].add(rel_path)

        except Exception as e:
            print(f'Error analyzing {file_path}: {e}')

    def _get_language(self, file_path):
        """Determine language from file extension"""
        ext = Path(file_path).suffix.lower()

        lang_map = {
            '.js': 'javascript',
            '.jsx': 'javascript',
            '.ts': 'typescript',
            '.tsx': 'typescript',
            '.py': 'python',
            '.java': 'java',
            '.go': 'go',
            '.rs': 'rust'
        }

        return lang_map.get(ext, 'unknown')

    def _extract_imports(self, content, language):
        """Extract import statements from code"""
        imports = []

        if language in ['javascript', 'typescript']:
            # ES6 imports
            es6_pattern = r'import\s+.*?\s+from\s+[\'"]([^\'"]+)[\'"]'
            imports.extend(re.findall(es6_pattern, content))

            # CommonJS require
            cjs_pattern = r'require\([\'"]([^\'"]+)[\'"]\)'
            imports.extend(re.findall(cjs_pattern, content))

        elif language == 'python':
            # from...import statements
            from_pattern = r'from\s+(\S+)\s+import'
            imports.extend(re.findall(from_pattern, content))

            # import statements
            import_pattern = r'^import\s+(\S+)'
            imports.extend(re.findall(import_pattern, content, re.MULTILINE))

        elif language == 'java':
            # Java imports
            java_pattern = r'import\s+([^;]+);'
            imports.extend(re.findall(java_pattern, content))

        elif language == 'go':
            # Go imports
            go_pattern = r'import\s+[\'"]([^\'"]+)[\'"]'
            imports.extend(re.findall(go_pattern, content))

        return imports

    def _is_external_dependency(self, import_path, language):
        """Check if an import is an external dependency"""

        # Check if it's a relative import (internal)
        if import_path.startswith('.') or import_path.startswith('/'):
            return False

        # Language-specific external dependency detection
        if language in ['javascript', 'typescript']:
            # If it doesn't start with . or /, it's likely external
            return not import_path.startswith('.')

        elif language == 'python':
            # Common standard library modules
            stdlib = {'os', 'sys', 'json', 're', 'datetime', 'collections', 'math', 'random'}
            root_module = import_path.split('.')[0]

            # If not in stdlib and not a relative import, it's external
            return root_module not in stdlib and not import_path.startswith('.')

        return True

    def _build_dependency_graph(self):
        """Build a dependency graph representation"""
        graph = {}

        for module, deps in self.dependencies.items():
            graph[module] = {
                'dependencies': list(deps),
                'dependents': list(self.reverse_dependencies.get(module, [])),
                'depth': self._calculate_depth(module)
            }

        return graph

    def _calculate_depth(self, module):
        """Calculate dependency depth (how many layers down)"""
        if module not in self.dependencies or not self.dependencies[module]:
            return 0

        max_depth = 0
        for dep in self.dependencies[module]:
            if dep != module:  # Avoid self-references
                max_depth = max(max_depth, self._calculate_depth(dep) + 1)

        return max_depth

    def _find_critical_modules(self, top_n=10):
        """Find most critical modules (most dependents)"""
        module_scores = []

        for module, dependents in self.reverse_dependencies.items():
            score = len(dependents)
            module_scores.append({
                'module': module,
                'dependent_count': score,
                'dependents': list(dependents)
            })

        # Sort by dependent count
        module_scores.sort(key=lambda x: x['dependent_count'], reverse=True)

        return module_scores[:top_n]

    def _find_circular_dependencies(self):
        """Detect circular dependencies"""
        visited = set()
        rec_stack = set()
        cycles = []

        def dfs(node, path):
            if node in rec_stack:
                # Found a cycle
                cycle_start = path.index(node)
                cycle = path[cycle_start:] + [node]
                cycles.append(cycle)
                return

            if node in visited:
                return

            visited.add(node)
            rec_stack.add(node)

            for neighbor in self.dependencies.get(node, []):
                dfs(neighbor, path + [node])

            rec_stack.remove(node)

        for module in self.dependencies.keys():
            if module not in visited:
                dfs(module, [])

        # Deduplicate cycles
        unique_cycles = []
        seen_cycles = set()

        for cycle in cycles:
            # Create a normalized representation
            cycle_set = frozenset(cycle)
            if cycle_set not in seen_cycles:
                seen_cycles.add(cycle_set)
                unique_cycles.append(cycle)

        return unique_cycles

    def _identify_layers(self):
        """Identify architectural layers based on dependencies"""
        layers = defaultdict(list)

        for module in self.dependencies.keys():
            depth = self._calculate_depth(module)
            layers[depth].append(module)

        return {
            f'Layer {depth}': modules
            for depth, modules in sorted(layers.items())
        }

    def _calculate_metrics(self):
        """Calculate dependency metrics"""
        total_modules = len(self.dependencies)

        if total_modules == 0:
            return {}

        total_internal_deps = sum(len(deps) for deps in self.dependencies.values())
        avg_dependencies = total_internal_deps / total_modules if total_modules > 0 else 0

        # Find modules with no dependents (potentially unused)
        all_modules = set(self.dependencies.keys()) | set(self.reverse_dependencies.keys())
        orphan_modules = [m for m in all_modules if not self.reverse_dependencies.get(m)]

        # Find modules with no dependencies (leaf modules)
        leaf_modules = [m for m in self.dependencies.keys() if not self.dependencies[m]]

        return {
            'total_modules': total_modules,
            'total_internal_dependencies': total_internal_deps,
            'total_external_dependencies': len(self.external_deps),
            'average_dependencies_per_module': round(avg_dependencies, 2),
            'orphan_modules_count': len(orphan_modules),
            'leaf_modules_count': len(leaf_modules),
            'max_dependency_depth': max((self._calculate_depth(m) for m in self.dependencies.keys()), default=0)
        }

    def generate_mermaid_diagram(self, max_nodes=20):
        """Generate a Mermaid diagram of dependencies"""

        # Get most critical modules to keep diagram readable
        critical = self._find_critical_modules(top_n=max_nodes)
        critical_modules = {m['module'] for m in critical}

        mermaid = ['graph TD']

        # Add nodes and edges
        for module in critical_modules:
            # Sanitize module name for Mermaid
            node_id = self._sanitize_node_id(module)

            for dep in self.dependencies.get(module, []):
                if dep in critical_modules:
                    dep_id = self._sanitize_node_id(dep)
                    mermaid.append(f'    {node_id}[{module}] --> {dep_id}[{dep}]')

        return '\n'.join(mermaid)

    def _sanitize_node_id(self, name):
        """Sanitize name for use as Mermaid node ID"""
        # Remove special characters and replace with underscores
        return re.sub(r'[^a-zA-Z0-9]', '_', name)

    def get_dependency_health_score(self):
        """Calculate overall dependency health score (0-100)"""
        metrics = self._calculate_metrics()
        score = 100

        # Penalize for high average dependencies (coupling)
        avg_deps = metrics.get('average_dependencies_per_module', 0)
        if avg_deps > 10:
            score -= 20
        elif avg_deps > 5:
            score -= 10

        # Penalize for circular dependencies
        circular = self._find_circular_dependencies()
        score -= len(circular) * 15

        # Penalize for orphan modules
        orphan_count = metrics.get('orphan_modules_count', 0)
        score -= orphan_count * 2

        # Penalize for deep dependency chains
        max_depth = metrics.get('max_dependency_depth', 0)
        if max_depth > 10:
            score -= 15
        elif max_depth > 5:
            score -= 5

        return max(0, min(100, score))
