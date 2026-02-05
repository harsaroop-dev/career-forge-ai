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
        relevant_docs = vector_store.similarity_search(
            data.job_description, k=6)
        resume_context = "\n".join([doc.page_content for doc in relevant_docs])

        prompt = f"""
        SYSTEM: You are a Senior Technical Architect. Return ONLY a JSON object.
        TASK: Analyze RESUME CONTEXT against JOB DESCRIPTION.
        
        RESUME: {resume_context}
        JD: {data.job_description}
        
        FORMAT: 
        {{
            "match_score": int,
            "technical_gaps": [],
            "professional_assessment": "",
            "strategic_project_idea": "",
            "key_strength": ""
        }}
        """

        completion = groq_client.chat.completions.create(
            messages=[{"role": "user", "content": prompt}],
            model="llama-3.3-70b-versatile",
            response_format={"type": "json_object"}
        )
        return json.loads(completion.choices[0].message.content)
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)
