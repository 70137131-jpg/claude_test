import os
from typing import List, Dict, Any
from langchain_anthropic import ChatAnthropic
from langchain.chains import RetrievalQA
from langchain.prompts import PromptTemplate
from services.pdf_service import PDFService
from models.models import ChatMessage, MessageRole, PDFDocument
from app import db
import uuid

class QAService:
    """Service for handling Q&A using LangChain and Claude."""

    def __init__(self):
        self.pdf_service = PDFService()

        # Initialize Claude LLM
        anthropic_api_key = os.getenv('ANTHROPIC_API_KEY')
        if not anthropic_api_key:
            raise ValueError("ANTHROPIC_API_KEY environment variable is required")

        self.llm = ChatAnthropic(
            model="claude-3-5-sonnet-20241022",
            anthropic_api_key=anthropic_api_key,
            temperature=0.3,
            max_tokens=2048
        )

        # Custom prompt template for Q&A
        self.qa_prompt_template = """You are a helpful AI assistant that answers questions based on the provided PDF document context.

Use the following pieces of context from the PDF to answer the question at the end.
If you don't know the answer based on the context, just say that you don't know - don't try to make up an answer.
Always cite which section or page the information comes from if possible.

Context:
{context}

Question: {question}

Helpful Answer:"""

    def ask_question(self, pdf_id: str, question: str, user_id: str) -> Dict[str, Any]:
        """
        Answer a question about a PDF document using retrieval-based Q&A.

        Args:
            pdf_id: ID of the PDF document
            question: User's question
            user_id: ID of the user asking the question

        Returns:
            dict: Answer and metadata
        """
        try:
            # Get PDF document
            pdf_doc = PDFDocument.query.get(pdf_id)
            if not pdf_doc:
                raise ValueError(f"PDF document {pdf_id} not found")

            if pdf_doc.status.value != 'ready':
                raise ValueError(f"PDF is not ready. Current status: {pdf_doc.status.value}")

            # Get vectorstore
            vectorstore = self.pdf_service.get_vectorstore(pdf_id)

            # Create retrieval chain
            qa_prompt = PromptTemplate(
                template=self.qa_prompt_template,
                input_variables=["context", "question"]
            )

            qa_chain = RetrievalQA.from_chain_type(
                llm=self.llm,
                chain_type="stuff",
                retriever=vectorstore.as_retriever(
                    search_type="similarity",
                    search_kwargs={"k": 4}
                ),
                chain_type_kwargs={"prompt": qa_prompt},
                return_source_documents=True
            )

            # Get answer
            result = qa_chain.invoke({"query": question})
            answer = result['result']
            source_docs = result.get('source_documents', [])

            # Save question to database
            question_msg = ChatMessage(
                id=str(uuid.uuid4()),
                pdf_id=pdf_id,
                user_id=user_id,
                role=MessageRole.USER,
                content=question
            )
            db.session.add(question_msg)

            # Save answer to database
            answer_msg = ChatMessage(
                id=str(uuid.uuid4()),
                pdf_id=pdf_id,
                user_id=user_id,
                role=MessageRole.ASSISTANT,
                content=answer
            )
            db.session.add(answer_msg)
            db.session.commit()

            # Prepare source information
            sources = []
            for i, doc in enumerate(source_docs):
                sources.append({
                    'chunk_index': i,
                    'content': doc.page_content[:200] + "..." if len(doc.page_content) > 200 else doc.page_content,
                    'metadata': doc.metadata
                })

            return {
                'status': 'success',
                'question': question,
                'answer': answer,
                'sources': sources,
                'pdf_id': pdf_id
            }

        except Exception as e:
            return {
                'status': 'error',
                'error': str(e)
            }

    def get_chat_history(self, pdf_id: str, limit: int = 50) -> List[Dict[str, Any]]:
        """
        Get chat history for a PDF document.

        Args:
            pdf_id: ID of the PDF document
            limit: Maximum number of messages to retrieve

        Returns:
            list: Chat messages
        """
        messages = ChatMessage.query.filter_by(pdf_id=pdf_id)\
            .order_by(ChatMessage.created_at.asc())\
            .limit(limit)\
            .all()

        return [
            {
                'id': msg.id,
                'role': msg.role.value,
                'content': msg.content,
                'created_at': msg.created_at.isoformat()
            }
            for msg in messages
        ]

    def summarize_document(self, pdf_id: str, user_id: str) -> Dict[str, Any]:
        """
        Generate a summary of the entire PDF document.

        Args:
            pdf_id: ID of the PDF document
            user_id: ID of the user requesting the summary

        Returns:
            dict: Summary result
        """
        return self.ask_question(
            pdf_id=pdf_id,
            question="Please provide a comprehensive summary of this document, including the main topics, key points, and conclusions.",
            user_id=user_id
        )
