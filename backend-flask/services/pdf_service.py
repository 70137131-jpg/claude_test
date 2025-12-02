import os
import uuid
from typing import List, Dict, Any
from werkzeug.utils import secure_filename
from pypdf import PdfReader
from langchain.text_splitter import RecursiveCharacterTextSplitter
from langchain_community.vectorstores import Chroma
from langchain_community.embeddings import HuggingFaceEmbeddings
from models.models import PDFDocument, PDFStatus
from app import db

class PDFService:
    """Service for handling PDF upload, processing, and vectorization."""

    def __init__(self, upload_folder: str = './uploads', vectorstore_folder: str = './vectorstores'):
        self.upload_folder = upload_folder
        self.vectorstore_folder = vectorstore_folder
        self._ensure_folders()
        self.embeddings = HuggingFaceEmbeddings(
            model_name="all-MiniLM-L6-v2",
            model_kwargs={'device': 'cpu'}
        )
        self.text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000,
            chunk_overlap=200,
            length_function=len
        )

    def _ensure_folders(self):
        """Create necessary folders if they don't exist."""
        os.makedirs(self.upload_folder, exist_ok=True)
        os.makedirs(self.vectorstore_folder, exist_ok=True)

    def save_pdf(self, file, user_id: str) -> PDFDocument:
        """
        Save uploaded PDF file and create database record.

        Args:
            file: FileStorage object from Flask request
            user_id: ID of the user uploading the file

        Returns:
            PDFDocument: Database record for the uploaded PDF
        """
        # Generate unique filename
        original_filename = secure_filename(file.filename)
        file_id = str(uuid.uuid4())
        filename = f"{file_id}_{original_filename}"
        file_path = os.path.join(self.upload_folder, filename)

        # Save file
        file.save(file_path)
        file_size = os.path.getsize(file_path)

        # Create database record
        pdf_doc = PDFDocument(
            id=file_id,
            user_id=user_id,
            filename=filename,
            original_filename=original_filename,
            file_path=file_path,
            file_size=file_size,
            status=PDFStatus.UPLOADING
        )

        db.session.add(pdf_doc)
        db.session.commit()

        return pdf_doc

    def extract_text_from_pdf(self, pdf_path: str) -> tuple[str, int]:
        """
        Extract text content from PDF file.

        Args:
            pdf_path: Path to the PDF file

        Returns:
            tuple: (extracted_text, page_count)
        """
        reader = PdfReader(pdf_path)
        page_count = len(reader.pages)

        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n\n"

        return text, page_count

    def process_pdf(self, pdf_id: str) -> Dict[str, Any]:
        """
        Process PDF: extract text, chunk it, create embeddings, and store in vector DB.

        Args:
            pdf_id: ID of the PDF document

        Returns:
            dict: Processing results including status and metadata
        """
        try:
            # Get PDF document from database
            pdf_doc = PDFDocument.query.get(pdf_id)
            if not pdf_doc:
                raise ValueError(f"PDF document {pdf_id} not found")

            # Update status to processing
            pdf_doc.status = PDFStatus.PROCESSING
            db.session.commit()

            # Extract text from PDF
            text, page_count = self.extract_text_from_pdf(pdf_doc.file_path)
            pdf_doc.page_count = page_count
            db.session.commit()

            # Split text into chunks
            chunks = self.text_splitter.split_text(text)

            # Create vectorstore
            vectorstore_path = os.path.join(self.vectorstore_folder, pdf_id)
            vectorstore = Chroma.from_texts(
                texts=chunks,
                embedding=self.embeddings,
                persist_directory=vectorstore_path,
                collection_name=pdf_id
            )

            # Update PDF document status
            pdf_doc.vectorstore_path = vectorstore_path
            pdf_doc.status = PDFStatus.READY
            db.session.commit()

            return {
                'status': 'success',
                'pdf_id': pdf_id,
                'page_count': page_count,
                'chunk_count': len(chunks),
                'vectorstore_path': vectorstore_path
            }

        except Exception as e:
            # Update status to failed
            if pdf_doc:
                pdf_doc.status = PDFStatus.FAILED
                pdf_doc.error_message = str(e)
                db.session.commit()

            return {
                'status': 'error',
                'pdf_id': pdf_id,
                'error': str(e)
            }

    def get_vectorstore(self, pdf_id: str) -> Chroma:
        """
        Load vectorstore for a specific PDF.

        Args:
            pdf_id: ID of the PDF document

        Returns:
            Chroma: Vector store instance
        """
        pdf_doc = PDFDocument.query.get(pdf_id)
        if not pdf_doc or not pdf_doc.vectorstore_path:
            raise ValueError(f"Vectorstore not found for PDF {pdf_id}")

        vectorstore = Chroma(
            persist_directory=pdf_doc.vectorstore_path,
            embedding_function=self.embeddings,
            collection_name=pdf_id
        )

        return vectorstore

    def delete_pdf(self, pdf_id: str) -> bool:
        """
        Delete PDF file and associated data.

        Args:
            pdf_id: ID of the PDF document

        Returns:
            bool: True if successful
        """
        pdf_doc = PDFDocument.query.get(pdf_id)
        if not pdf_doc:
            return False

        # Delete file
        if os.path.exists(pdf_doc.file_path):
            os.remove(pdf_doc.file_path)

        # Delete vectorstore directory
        if pdf_doc.vectorstore_path and os.path.exists(pdf_doc.vectorstore_path):
            import shutil
            shutil.rmtree(pdf_doc.vectorstore_path)

        # Delete database record
        db.session.delete(pdf_doc)
        db.session.commit()

        return True
