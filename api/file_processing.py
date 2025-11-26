import pdfplumber
import pytesseract
from PIL import Image
import io
from fastapi import UploadFile, HTTPException

async def extract_text_from_file(file: UploadFile) -> str:
    """
    Extracts text from an uploaded file based on its content type.
    Supports: text/plain, application/pdf, image/png, image/jpeg
    """
    content_type = file.content_type
    
    try:
        if content_type == "text/plain":
            content = await file.read()
            return content.decode("utf-8")
            
        elif content_type == "application/pdf":
            content = await file.read()
            return extract_text_from_pdf(content)
            
        elif content_type in ["image/png", "image/jpeg", "image/jpg"]:
            content = await file.read()
            return extract_text_from_image(content)
            
        else:
            raise HTTPException(status_code=400, detail=f"Unsupported file type: {content_type}")
            
    except Exception as e:
        print(f"Error extracting text: {e}")
        raise HTTPException(status_code=500, detail=f"Failed to process file: {str(e)}")

def extract_text_from_pdf(file_bytes: bytes) -> str:
    text = ""
    with pdfplumber.open(io.BytesIO(file_bytes)) as pdf:
        for page in pdf.pages:
            page_text = page.extract_text()
            if page_text:
                text += page_text + "\n"
    return text.strip()

def extract_text_from_image(file_bytes: bytes) -> str:
    try:
        image = Image.open(io.BytesIO(file_bytes))
        text = pytesseract.image_to_string(image)
        return text.strip()
    except Exception as e:
        print(f"OCR Error: {e}")
        return "[Error: Could not extract text from image. Ensure Tesseract is installed.]"
