import os
from anthropic import Anthropic
import json

class AIService:
    def __init__(self):
        api_key = os.getenv('ANTHROPIC_API_KEY')
        if not api_key:
            raise ValueError('ANTHROPIC_API_KEY is not set')

        self.client = Anthropic(api_key=api_key)

    def generate_suggestions(self, file_path, content, language):
        """Generate AI-powered refactoring suggestions"""
        prompt = f"""You are a senior software engineer reviewing code. Analyze the following {language} code and provide specific, actionable refactoring suggestions.

For each suggestion:
1. Identify the exact code block to refactor
2. Provide the improved version
3. Explain why the change improves the code
4. Classify the suggestion type (refactor/optimization/modernization/cleanup)

Code to analyze:
```{language}
{content}
```

Respond in JSON format as an array of suggestions:
[
  {{
    "type": "refactor",
    "title": "Brief title",
    "description": "What to improve",
    "originalCode": "Code to replace",
    "suggestedCode": "Improved code",
    "line": 10,
    "endLine": 15,
    "reasoning": "Why this is better"
  }}
]"""

        try:
            message = self.client.messages.create(
                model='claude-3-5-sonnet-20241022',
                max_tokens=4096,
                messages=[{'role': 'user', 'content': prompt}]
            )

            response_text = message.content[0].text

            # Extract JSON from response
            import re
            json_match = re.search(r'\[[\s\S]*\]', response_text)

            if not json_match:
                return []

            suggestions = json.loads(json_match.group(0))

            # Add IDs and status
            for i, s in enumerate(suggestions):
                s['id'] = f'suggestion-{i}'
                s['status'] = 'pending'

            return suggestions

        except Exception as e:
            print(f'AI suggestion error: {e}')
            return []

    def chat_completion(self, message, context=None):
        """Get AI chat response"""
        system_prompt = 'You are an expert software engineer assistant. Help users understand and improve their code. Be concise and practical.'

        user_message = f"Context:\n{context}\n\nQuestion: {message}" if context else message

        try:
            response = self.client.messages.create(
                model='claude-3-5-sonnet-20241022',
                max_tokens=2048,
                system=system_prompt,
                messages=[{'role': 'user', 'content': user_message}]
            )

            return response.content[0].text

        except Exception as e:
            print(f'AI chat error: {e}')
            return 'I apologize, but I could not generate a response.'

    def stream_chat_completion(self, message, context=None):
        """Stream AI chat response"""
        system_prompt = 'You are an expert software engineer assistant. Help users understand and improve their code. Be concise and practical.'

        user_message = f"Context:\n{context}\n\nQuestion: {message}" if context else message

        try:
            with self.client.messages.stream(
                model='claude-3-5-sonnet-20241022',
                max_tokens=2048,
                system=system_prompt,
                messages=[{'role': 'user', 'content': user_message}]
            ) as stream:
                for text in stream.text_stream:
                    yield text

        except Exception as e:
            print(f'AI stream error: {e}')
            yield 'Error generating response'

    def explain_code(self, code, language):
        """Explain what code does"""
        prompt = f"""Explain what this {language} code does in simple terms:

```{language}
{code}
```

Provide a clear, concise explanation suitable for someone learning to code."""

        try:
            message = self.client.messages.create(
                model='claude-3-5-sonnet-20241022',
                max_tokens=1024,
                messages=[{'role': 'user', 'content': prompt}]
            )

            return message.content[0].text

        except Exception as e:
            print(f'Code explanation error: {e}')
            return 'Could not explain the code.'
