import os
import json
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel
from dotenv import load_dotenv
from groq import Groq
from supabase.client import create_client
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import SupabaseVectorStore
from langchain_core.documents import Document
from fastapi.middleware.cors import CORSMiddleware
import traceback
from fastapi import UploadFile, File
from pypdf import PdfReader
import io


load_dotenv()

app = FastAPI()
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


def fixed_similarity_search(self, query, k=6, **kwargs):
    embedding = self._embedding.embed_query(query)
    res = self._client.rpc(self.query_name, {
        "query_embedding": embedding,
        "match_threshold": 0.4,
        "match_count": k,
    }).execute()
    return [Document(page_content=row["content"], metadata=row["metadata"]) for row in res.data]


SupabaseVectorStore.similarity_search = fixed_similarity_search


supabase = create_client(os.environ.get("SUPABASE_URL"),
                         os.environ.get("SUPABASE_KEY"))
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")
vector_store = SupabaseVectorStore(
    client=supabase, embedding=embeddings, table_name="documents", query_name="match_documents")


class JDRequest(BaseModel):
    job_description: str


@app.post("/analyze")
async def analyze_jd(data: JDRequest):
    try:
        print(f"Received request for JD: {data.job_description[:50]}...")

        relevant_docs = vector_store.similarity_search(
            data.job_description, k=6)
        print(f"Found {len(relevant_docs)} relevant document chunks.")

        resume_context = "\n".join([doc.page_content for doc in relevant_docs])

        prompt = f"""
SYSTEM: You are an expert Technical Recruiter.
TASK: Compare the provided RESUME CONTEXT against the JOB DESCRIPTION.

SCALING RULE: 
- Provide a match_score as an INTEGER between 0 and 100.
- 0 means no match; 100 means a perfect candidate.
- If the candidate has the primary tech stack, the score should generally be above 70.

RESUME CONTEXT:
{resume_context}

JOB DESCRIPTION:
{data.job_description}

Return ONLY a JSON object in this format:
{{
    "match_score": int,
    "technical_gaps": ["skill1", "skill2"],
    "professional_assessment": "Short paragraph summary",
    "strategic_project_idea": "One specific project to bridge gaps",
    "key_strength": "Primary reason for hire"
}}
"""

        print("Sending to Groq...")
        completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content)

    except Exception as e:
        print("ERROR DETECTED:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/upload-resume")
async def upload_resume(file: UploadFile = File(...)):
    try:
        content = await file.read()
        pdf_reader = PdfReader(io.BytesIO(content))

        text = ""
        for page in pdf_reader.pages:
            text += page.extract_text()

        from langchain_text_splitters import RecursiveCharacterTextSplitter
        text_splitter = RecursiveCharacterTextSplitter(
            chunk_size=1000, chunk_overlap=100)
        chunks = text_splitter.split_text(text)

        supabase.table("documents").delete().neq("content", "").execute()

        vector_store.add_texts(chunks)

        return {"message": f"Successfully processed {len(chunks)} chunks from {file.filename}"}

    except Exception as e:
        print(f"Upload Error: {e}")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


class RoadmapRequest(BaseModel):
    project_idea: str
    technical_gaps: list


@app.post("/generate-roadmap")
async def generate_roadmap(data: RoadmapRequest):
    try:
        prompt = f"""
        SYSTEM: You are a Senior Technical Architect. 
        TASK: Create a 3-phase implementation roadmap for the following project idea.
        PROJECT: {data.project_idea}
        GAPS TO BRIDGE: {", ".join(data.technical_gaps)}

        Return ONLY a JSON object in this format:
        {{
            "phases": [
                {{ "title": "Phase 1: Setup & MVP", "task": "Specific task using a gap skill" }},
                {{ "title": "Phase 2: Core Logic", "task": "How to implement the main feature" }},
                {{ "title": "Phase 3: Optimization", "task": "Advanced refinement" }}
            ]
        }}
        """

        completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"}
        )

        return json.loads(completion.choices[0].message.content)

    except Exception as e:
        print("ROADMAP ERROR:")
        traceback.print_exc()
        raise HTTPException(status_code=500, detail=str(e))


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
