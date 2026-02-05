import os
import json
from dotenv import load_dotenv
from langchain_huggingface import HuggingFaceEmbeddings
from langchain_community.vectorstores import SupabaseVectorStore
from supabase.client import create_client
from groq import Groq
from langchain_core.documents import Document


def fixed_similarity_search(self, query, k=6, **kwargs):
    embedding = self._embedding.embed_query(query)
    rpc_params = {
        "query_embedding": embedding,
        "match_threshold": 0.4,
        "match_count": k,
    }
    res = self._client.rpc(self.query_name, rpc_params).execute()
    return [Document(page_content=row["content"], metadata=row["metadata"]) for row in res.data]


SupabaseVectorStore.similarity_search = fixed_similarity_search


load_dotenv()

supabase = create_client(os.environ.get("SUPABASE_URL"),
                         os.environ.get("SUPABASE_KEY"))
groq_client = Groq(api_key=os.environ.get("GROQ_API_KEY"))
embeddings = HuggingFaceEmbeddings(model_name="all-MiniLM-L6-v2")

vector_store = SupabaseVectorStore(
    client=supabase,
    embedding=embeddings,
    table_name="documents",
    query_name="match_documents"
)


def analyze_job_fit(job_description):

    relevant_docs = vector_store.similarity_search(job_description, k=6)
    resume_context = "\n".join([doc.page_content for doc in relevant_docs])

    prompt = f"""
    SYSTEM: You are a Senior Technical Architect and Hiring Manager. 
    You evaluate candidates based on technical evidence, architectural depth, and stack alignment.
    Your tone is objective, professional, and highly analytical.

    TASK: Perform a detailed Gap Analysis between the provided RESUME CONTEXT and the JOB DESCRIPTION.
    1. Identify exact technical misalignments.
    2. Acknowledge foundational strengths 
    3. Suggest high-impact architectural improvements.

    RESUME CONTEXT:
    {resume_context}

    JOB DESCRIPTION:
    {job_description}

    RESPONSE FORMAT: You MUST return ONLY a valid JSON object. No intro, no outro.
    {{
        "match_score": <integer 0-100>,
        "technical_gaps": [<list of specific missing technologies or concepts>],
        "professional_assessment": "<2-3 sentences of objective feedback on technical fit and experience depth>",
        "strategic_project_idea": "<one specific, complex project idea that would bridge the identified gaps>",
        "key_strength": "<the most impressive technical accomplishment found in the context>"
    }}
    """

    chat_completion = groq_client.chat.completions.create(
        messages=[{"role": "user", "content": prompt}],
        model="llama-3.3-70b-versatile",
        response_format={"type": "json_object"}
    )

    return chat_completion.choices[0].message.content


if __name__ == "__main__":
    sample_jd = "Looking for a React Developer with experience in Node.js and building AI-powered applications using RAG."
    print("Running Ruthless Analysis...")
    result = analyze_job_fit(sample_jd)

    parsed_result = json.loads(result)
    print(json.dumps(parsed_result, indent=4))
