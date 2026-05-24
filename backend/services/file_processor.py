import io
from typing import Optional


def extract_text_from_pdf(file_bytes: bytes) -> str:
    """Extract text from PDF file."""
    try:
        import PyPDF2
        reader = PyPDF2.PdfReader(io.BytesIO(file_bytes))
        text = ""
        for page in reader.pages:
            text += page.extract_text() + "\n"
        return text.strip()
    except Exception as e:
        return f"PDF okuma hatası: {str(e)}"


def extract_text_from_docx(file_bytes: bytes) -> str:
    """Extract text from DOCX file."""
    try:
        from docx import Document
        doc = Document(io.BytesIO(file_bytes))
        text = "\n".join([para.text for para in doc.paragraphs if para.text.strip()])
        return text.strip()
    except Exception as e:
        return f"DOCX okuma hatası: {str(e)}"


def extract_text_from_txt(file_bytes: bytes) -> str:
    """Extract text from TXT file."""
    try:
        return file_bytes.decode("utf-8", errors="ignore").strip()
    except Exception as e:
        return f"TXT okuma hatası: {str(e)}"


def extract_text_from_excel(file_bytes: bytes) -> str:
    """Extract text from Excel file."""
    try:
        import pandas as pd
        df = pd.read_excel(io.BytesIO(file_bytes))
        # Convert dataframe to CSV string
        return df.to_csv(index=False)
    except Exception as e:
        return f"Excel okuma hatası: {str(e)}"

def process_file(filename: str, file_bytes: bytes) -> str:
    """Process uploaded file and return extracted text."""
    ext = filename.lower().split(".")[-1]

    if ext == "pdf":
        return extract_text_from_pdf(file_bytes)
    elif ext in ["docx", "doc"]:
        return extract_text_from_docx(file_bytes)
    elif ext in ["xlsx", "xls"]:
        return extract_text_from_excel(file_bytes)
    elif ext in ["txt", "md", "csv", "json", "py", "js", "ts", "html", "css", "xml"]:
        return extract_text_from_txt(file_bytes)
    else:
        return f"Desteklenmeyen dosya formatı: .{ext}"


def truncate_content(content: str, max_chars: int = 12000) -> str:
    """Truncate content to avoid token limits."""
    if len(content) > max_chars:
        return content[:max_chars] + f"\n\n[... Dosya çok uzun, ilk {max_chars} karakter gösteriliyor ...]"
    return content
