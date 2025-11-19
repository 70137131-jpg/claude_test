import os
import hashlib
import json
from anthropic import Anthropic
from pathlib import Path

class DocumentationService:
    def __init__(self):
        api_key = os.getenv('ANTHROPIC_API_KEY')
        if not api_key:
            raise ValueError('ANTHROPIC_API_KEY is not set')

        self.client = Anthropic(api_key=api_key)

    def generate_architecture_overview(self, file_tree, main_files_content):
        """Generate architecture overview from codebase structure"""

        prompt = f"""You are a technical documentation expert. Analyze this codebase and generate a comprehensive architecture overview.

File Structure:
{json.dumps(file_tree, indent=2)}

Key Files Content:
{main_files_content}

Generate an architecture overview that includes:
1. **System Architecture**: High-level architecture and design patterns
2. **Component Breakdown**: What each major component does
3. **Data Flow**: How data flows through the system
4. **Tech Stack**: Technologies and frameworks used
5. **Key Design Decisions**: Important architectural choices and why they were made

Format as markdown. Be thorough but concise. Focus on helping new developers understand the big picture."""

        try:
            message = self.client.messages.create(
                model='claude-3-5-sonnet-20241022',
                max_tokens=8000,
                messages=[{'role': 'user', 'content': prompt}]
            )

            return message.content[0].text

        except Exception as e:
            print(f'Architecture overview generation error: {e}')
            return None

    def generate_api_reference(self, code_content, language):
        """Generate API reference documentation from code"""

        prompt = f"""You are a technical writer. Generate comprehensive API reference documentation for this {language} code.

Code:
```{language}
{code_content}
```

Generate API reference documentation that includes:
1. **Functions/Methods**: Name, parameters, return types, description
2. **Classes**: Purpose, properties, methods
3. **Constants/Config**: Important constants and configuration options
4. **Usage Examples**: Show how to use each major API
5. **Error Handling**: What errors can occur and how to handle them

Format as markdown with clear headings and code examples."""

        try:
            message = self.client.messages.create(
                model='claude-3-5-sonnet-20241022',
                max_tokens=6000,
                messages=[{'role': 'user', 'content': prompt}]
            )

            return message.content[0].text

        except Exception as e:
            print(f'API reference generation error: {e}')
            return None

    def extract_usage_examples(self, test_files_content):
        """Extract and document usage examples from test files"""

        prompt = f"""You are a technical documentation expert. Analyze these test files and extract usage examples.

Test Files:
{test_files_content}

Generate usage examples documentation that includes:
1. **Common Use Cases**: Most common ways to use the code
2. **Code Examples**: Real examples from the tests, simplified and explained
3. **Edge Cases**: How to handle special situations
4. **Best Practices**: Recommended patterns from the tests

Format as markdown with clear, runnable code examples."""

        try:
            message = self.client.messages.create(
                model='claude-3-5-sonnet-20241022',
                max_tokens=5000,
                messages=[{'role': 'user', 'content': prompt}]
            )

            return message.content[0].text

        except Exception as e:
            print(f'Usage examples extraction error: {e}')
            return None

    def generate_onboarding_guide(self, file_tree, readme_content, main_files):
        """Generate onboarding guide for new developers"""

        prompt = f"""You are creating an onboarding guide for new developers joining this project.

File Structure:
{json.dumps(file_tree, indent=2)}

README:
{readme_content}

Key Files:
{main_files}

Generate a comprehensive onboarding guide that includes:
1. **Quick Start**: Get the project running in 5 minutes
2. **Project Overview**: What does this project do?
3. **Codebase Tour**: Start here files and key areas to understand
4. **Development Workflow**: How to make changes
5. **Common Tasks**: Step-by-step guides for common development tasks
6. **Where to Get Help**: Resources and contacts

Make it friendly, practical, and designed to get new developers productive on Day 1.
Format as markdown."""

        try:
            message = self.client.messages.create(
                model='claude-3-5-sonnet-20241022',
                max_tokens=7000,
                messages=[{'role': 'user', 'content': prompt}]
            )

            return message.content[0].text

        except Exception as e:
            print(f'Onboarding guide generation error: {e}')
            return None

    def generate_changelog_from_commits(self, commits):
        """Generate changelog from git commit history"""

        commits_text = '\n'.join([
            f"- {commit['sha'][:7]}: {commit['message']} by {commit['author']}"
            for commit in commits
        ])

        prompt = f"""You are a technical writer. Generate a changelog from these git commits.

Commits:
{commits_text}

Generate a changelog that:
1. Groups commits by type (Features, Bug Fixes, Performance, Refactoring, etc.)
2. Explains WHAT changed and WHY (infer from commit messages)
3. Highlights breaking changes
4. Uses clear, user-friendly language

Format as markdown following Keep a Changelog style."""

        try:
            message = self.client.messages.create(
                model='claude-3-5-sonnet-20241022',
                max_tokens=4000,
                messages=[{'role': 'user', 'content': prompt}]
            )

            return message.content[0].text

        except Exception as e:
            print(f'Changelog generation error: {e}')
            return None

    def analyze_dependency_map(self, files_with_imports):
        """Analyze and document dependency relationships"""

        prompt = f"""You are analyzing code dependencies. Create a dependency map documentation.

Files and their imports:
{json.dumps(files_with_imports, indent=2)}

Generate dependency map documentation that includes:
1. **Dependency Graph**: Text representation of what depends on what
2. **Critical Dependencies**: Most imported modules and why they're important
3. **Dependency Layers**: Logical layers of the application
4. **Circular Dependencies**: Any circular dependencies (red flags)
5. **External Dependencies**: Third-party libraries and their purposes

Format as markdown with clear diagrams (use mermaid syntax for graphs)."""

        try:
            message = self.client.messages.create(
                model='claude-3-5-sonnet-20241022',
                max_tokens=5000,
                messages=[{'role': 'user', 'content': prompt}]
            )

            return message.content[0].text

        except Exception as e:
            print(f'Dependency map generation error: {e}')
            return None

    def detect_documentation_drift(self, old_code, new_code, existing_doc):
        """Detect if code changes have made documentation outdated"""

        prompt = f"""You are analyzing if code changes have made documentation outdated.

Original Code:
```
{old_code}
```

New Code:
```
{new_code}
```

Existing Documentation:
{existing_doc}

Analyze if the documentation is still accurate. Return a JSON object:
{{
    "is_outdated": true/false,
    "severity": "low/medium/high/critical",
    "drift_description": "What changed and why docs are outdated",
    "suggested_updates": "Specific changes needed to documentation",
    "auto_update_safe": true/false
}}"""

        try:
            message = self.client.messages.create(
                model='claude-3-5-sonnet-20241022',
                max_tokens=2000,
                messages=[{'role': 'user', 'content': prompt}]
            )

            response_text = message.content[0].text

            # Extract JSON from response
            import re
            json_match = re.search(r'\{[\s\S]*\}', response_text)

            if json_match:
                return json.loads(json_match.group(0))

            return None

        except Exception as e:
            print(f'Drift detection error: {e}')
            return None

    def generate_function_documentation(self, function_code, language):
        """Generate documentation for a specific function"""

        prompt = f"""Document this {language} function in detail.

Function:
```{language}
{function_code}
```

Generate documentation that includes:
1. **Purpose**: What does this function do?
2. **Parameters**: Each parameter explained
3. **Returns**: What does it return?
4. **Usage Example**: Show how to use it
5. **Edge Cases**: Special cases to be aware of
6. **Time/Space Complexity**: If applicable

Format as markdown."""

        try:
            message = self.client.messages.create(
                model='claude-3-5-sonnet-20241022',
                max_tokens=1500,
                messages=[{'role': 'user', 'content': prompt}]
            )

            return message.content[0].text

        except Exception as e:
            print(f'Function documentation error: {e}')
            return None

    @staticmethod
    def calculate_code_hash(code_content):
        """Calculate hash of code content for drift detection"""
        return hashlib.sha256(code_content.encode('utf-8')).hexdigest()

    @staticmethod
    def extract_imports_from_code(code_content, language):
        """Extract import statements from code"""
        imports = []

        if language in ['javascript', 'typescript']:
            import re
            # Match import statements
            import_pattern = r'import\s+.*?\s+from\s+[\'"]([^\'"]+)[\'"]'
            imports = re.findall(import_pattern, code_content)

        elif language == 'python':
            import re
            # Match import and from...import statements
            import_pattern = r'(?:from\s+(\S+)\s+import|import\s+(\S+))'
            matches = re.findall(import_pattern, code_content)
            imports = [m[0] or m[1] for m in matches]

        return imports

    def suggest_better_names(self, code_content, language):
        """Suggest better variable/function names for clarity"""

        prompt = f"""You are a code clarity expert. Analyze this {language} code and suggest better names for clarity.

Code:
```{language}
{code_content}
```

Identify variable/function names that are unclear and suggest better alternatives.
Return JSON array:
[
  {{
    "original_name": "x",
    "suggested_name": "user_count",
    "reasoning": "More descriptive of what the variable represents",
    "line": 10
  }}
]"""

        try:
            message = self.client.messages.create(
                model='claude-3-5-sonnet-20241022',
                max_tokens=2000,
                messages=[{'role': 'user', 'content': prompt}]
            )

            response_text = message.content[0].text

            # Extract JSON from response
            import re
            json_match = re.search(r'\[[\s\S]*\]', response_text)

            if json_match:
                return json.loads(json_match.group(0))

            return []

        except Exception as e:
            print(f'Name suggestion error: {e}')
            return []
