import os
import csv
from typing import TypedDict, Literal, List
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import pandas as pd
from dotenv import load_dotenv, set_key
import uvicorn

# Load environment variables
load_dotenv()

app = FastAPI(title="NyayaAI API")

# Enable CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],  # In production, specify frontend origin
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Paths
BASE_DIR = os.path.dirname(os.path.abspath(__file__))
RESOURCES_PATH = os.path.join(BASE_DIR, "legal_resources.csv")
LAW_BOOK_PATH = os.path.join(BASE_DIR, "law_book.csv")
ENV_PATH = os.path.join(BASE_DIR, ".env")

# LangGraph State Schema
class LegalState(TypedDict):
    name: str
    location: str
    query: str
    category: str
    reasoning: str
    applicable_law: str
    rights_summary: str
    assigned_entity: str
    assigned_phone: str
    assigned_email: str
    logs: List[str]

# API Schemas
class TriageRequest(BaseModel):
    name: str
    location: str
    query: str
    mock_mode: bool = False

class SettingsRequest(BaseModel):
    api_key: str

# Define LangGraph Nodes and Flow
# Note: Instead of doing graph.invoke() with LangGraph libraries, we can implement the exact
# StateGraph behavior programmatically or using langgraph structure, keeping it robust and debuggable.
# Let's write a programmatically executed StateGraph for full transparency of logs and robustness.

EMERGENCY_KEYWORDS = ["violence", "attack", "bleeding", "threat", "weapon", "kill", "assault", "beating", "help", "rape", "robbery", "kidnap"]

def find_relevant_law_local(category: str, query: str) -> tuple:
    try:
        df_laws = pd.read_csv(LAW_BOOK_PATH)
        law_match = df_laws[df_laws["category"] == category]
        if law_match.empty:
            return "General Legal Code", "Standard constitutional civil rights apply."
        
        # Simple overlap-based keyword search
        query_clean = query.lower().replace(",", " ").replace(".", " ").replace(";", " ")
        query_words = set(w for w in query_clean.split() if len(w) > 3)
        best_match = None
        max_overlap = -1
        
        for idx, row in law_match.iterrows():
            content = f"{row['applicable_act']} {row['rights_summary']}".lower()
            content_clean = content.replace(",", " ").replace(".", " ").replace(";", " ")
            content_words = set(content_clean.split())
            overlap = len(query_words.intersection(content_words))
            if overlap > max_overlap:
                max_overlap = overlap
                best_match = row
                
        if best_match is not None:
            return best_match["applicable_act"], best_match["rights_summary"]
        return law_match.iloc[0]["applicable_act"], law_match.iloc[0]["rights_summary"]
    except Exception as e:
        return "General Legal Code", "Standard constitutional civil rights apply."

def run_agentic_workflow(state: LegalState, mock_mode: bool) -> LegalState:
    state["logs"] = []
    
    # 1. Intake Node
    state["logs"].append("📥 [Intake Node] Captured citizen details and statement.")
    state["logs"].append(f"👤 Name: {state['name']} | Location: {state['location']}")
    
    # 2. Router & Guardrails Node
    state["logs"].append("🧠 [Router Node] Checking safety guardrails...")
    query_lower = state["query"].lower()
    
    # Check deterministic keywords
    triggered_keywords = [kw for kw in EMERGENCY_KEYWORDS if kw in query_lower]
    if triggered_keywords:
        category = "emergency_police"
        reasoning = f"⚠️ HARD SAFETY GUARDRAIL TRIGGERED: Detected emergency keywords: {', '.join(triggered_keywords)}. Overriding LLM logic for instant routing."
        state["logs"].append(reasoning)
    else:
        state["logs"].append("🔍 No immediate physical danger keywords detected. Proceeding to legal category classification.")
        if mock_mode:
            # Rule-based fallback
            if any(w in query_lower for w in ["landlord", "rent", "tenant", "evict", "property", "house", "land", "boundary"]):
                category = "property_civil"
                reasoning = "🤖 Rule-based Router: Classified dispute as 'Property & Civil' based on keyword matches."
            elif any(w in query_lower for w in ["wage", "salary", "job", "terminate", "boss", "workplace", "harassment", "labor"]):
                category = "labor_employment"
                reasoning = "🤖 Rule-based Router: Classified dispute as 'Labor & Employment' based on keyword matches."
            else:
                category = "property_civil"
                reasoning = "🤖 Rule-based Router: Default fallback to 'Property & Civil'."
            state["logs"].append(reasoning)
        else:
            # Groq LLM Routing
            api_key = os.environ.get("GROQ_API_KEY")
            if not api_key:
                state["logs"].append("❌ GROQ_API_KEY is missing. Falling back to local classifier.")
                # Fallback to rules
                if any(w in query_lower for w in ["landlord", "rent", "tenant", "evict", "property", "house", "land"]):
                    category = "property_civil"
                elif any(w in query_lower for w in ["wage", "salary", "job", "terminate", "boss", "workplace", "harassment"]):
                    category = "labor_employment"
                else:
                    category = "property_civil"
                reasoning = "🤖 Fallback Router: Classified case due to missing API Key."
                state["logs"].append(reasoning)
            else:
                try:
                    from langchain_groq import ChatGroq
                    from langchain_core.messages import SystemMessage, HumanMessage
                    
                    llm = ChatGroq(model="llama-3.3-70b-versatile", temperature=0, groq_api_key=api_key)
                    ROUTER_SYSTEM_PROMPT = """You are an official legal aid classification router. Based on the citizen's description, classify their dispute into EXACTLY ONE of these categories:
- emergency_police: ongoing physical threats, assault, domestic violence, active burglary, immediate danger.
- property_civil: property disputes, illegal eviction, landlord-tenant issues, boundary disputes, civil contracts.
- labor_employment: unpaid wages, illegal job termination, workplace harassment, union disputes.

Respond with ONLY one word: emergency_police, property_civil, or labor_employment."""
                    
                    response = llm.invoke([
                        SystemMessage(content=ROUTER_SYSTEM_PROMPT),
                        HumanMessage(content=f"Location: {state['location']}\nDescription: {state['query']}")
                    ])
                    raw_output = response.content.strip().lower()
                    
                    if "emergency" in raw_output or "police" in raw_output:
                        category = "emergency_police"
                    elif "property" in raw_output or "civil" in raw_output:
                        category = "property_civil"
                    elif "labor" in raw_output or "employment" in raw_output:
                        category = "labor_employment"
                    else:
                        category = "property_civil"
                        
                    reasoning = f"🤖 Llama 3.3 classified input into category '{category}' based on semantic analysis."
                    state["logs"].append(reasoning)
                except Exception as e:
                    state["logs"].append(f"⚠️ Groq API request failed: {str(e)}. Falling back to local rules.")
                    if any(w in query_lower for w in ["landlord", "rent", "tenant", "evict", "property", "house", "land"]):
                        category = "property_civil"
                    elif any(w in query_lower for w in ["wage", "salary", "job", "terminate", "boss", "workplace", "harassment"]):
                        category = "labor_employment"
                    else:
                        category = "property_civil"
                    reasoning = "🤖 Fallback Router: Groq API Error fallback."
    
    state["category"] = category
    state["reasoning"] = reasoning

    # 3. Law Book Search Node
    api_key = os.environ.get("GROQ_API_KEY")
    if not mock_mode and api_key:
        state["logs"].append("📖 [Law Finder Node] Initializing AI Legal Search on Llama 3.3 for real laws...")
        try:
            from langchain_groq import ChatGroq
            from langchain_core.messages import SystemMessage
            import json as pyjson
            
            llm_law = ChatGroq(model="llama-3.3-70b-versatile", temperature=0.1, groq_api_key=api_key)
            
            LAW_FINDER_PROMPT = """You are an expert legal scholar. Given a citizen's dispute description, identify the exact real laws, acts, or sections that apply (e.g. Indian Penal Code/BNS sections, Rent Control Acts, Industrial Disputes Act, etc.).
Also, formulate a clear, actionable rights summary and legal orientation guidance for the citizen based on those laws.

Dispute Category: {category}
Citizen Statement: {query}

You must return your response in EXACT JSON format with two keys:
"applicable_act": (a concise string citing the specific real laws/acts/sections)
"rights_summary": (a detailed paragraph summarizing the citizen's legal rights and recommended immediate actions)

Return ONLY valid raw JSON. Do not include markdown wraps or explanations."""
            
            response = llm_law.invoke([
                SystemMessage(content=LAW_FINDER_PROMPT.format(category=category, query=state["query"]))
            ])
            
            res_content = response.content.strip()
            if res_content.startswith("```"):
                lines = res_content.split("\n")
                if lines[0].startswith("```json"):
                    res_content = "\n".join(lines[1:-1])
                elif lines[0].startswith("```"):
                    res_content = "\n".join(lines[1:-1])
            
            law_data = pyjson.loads(res_content)
            state["applicable_law"] = law_data.get("applicable_act", "General Legal Act")
            state["rights_summary"] = law_data.get("rights_summary", "Constitutional civil protections apply.")
            state["logs"].append(f"✅ AI Search complete. Citing Real Law: {state['applicable_law']}")
        except Exception as e:
            state["logs"].append(f"⚠️ AI Legal Search failed ({str(e)}). Falling back to local law search.")
            app_law, rights_sum = find_relevant_law_local(category, state["query"])
            state["applicable_law"] = app_law
            state["rights_summary"] = rights_sum
    else:
        state["logs"].append(f"📖 [Law Finder Node] Performing local RAG keywords search in law_book.csv under '{category}'...")
        app_law, rights_sum = find_relevant_law_local(category, state["query"])
        state["applicable_law"] = app_law
        state["rights_summary"] = rights_sum
        state["logs"].append(f"✅ Found Local Act Match: {state['applicable_law']}")

    # 4. Domain Handlers Node
    if category == "emergency_police":
        state["logs"].append("🚨 [Emergency Ward] Activating priority emergency channel and checking nearby police stations...")
    elif category == "property_civil":
        state["logs"].append("⚖️ [Civil Ward] Directing case to civil advocate directories...")
    elif category == "labor_employment":
        state["logs"].append("💼 [Labor Ward] Routing case to labor rights advocacy council...")

    # 5. Resource Allocator Node
    state["logs"].append("📌 [Resource Allocator Node] Querying resource pool for available entity...")
    try:
        df_resources = pd.read_csv(RESOURCES_PATH)
        available = df_resources[(df_resources["jurisdiction"] == category) & (df_resources["status"] == "available")]
        
        if not available.empty:
            assigned_name = available.iloc[0]["entity_name"]
            assigned_loc = available.iloc[0]["location"]
            state["assigned_entity"] = f"{assigned_name} ({assigned_loc})"
            state["assigned_phone"] = str(available.iloc[0]["phone"])
            state["assigned_email"] = str(available.iloc[0]["email"])
            state["logs"].append(f"✅ Resource Assigned: {state['assigned_entity']}")
            
            # Update status to busy in database
            df_resources.loc[df_resources["entity_name"] == assigned_name, "status"] = "busy"
            df_resources.to_csv(RESOURCES_PATH, index=False)
            state["logs"].append(f"🔒 Resource status updated to 'busy' to prevent double booking.")
        else:
            state["assigned_entity"] = "No active resource available — Request placed on high-priority queue."
            state["assigned_phone"] = "112" if category == "emergency_police" else "+919999999999"
            state["assigned_email"] = "dispatch@nyaya.gov.in"
            state["logs"].append("⚠️ No available resource found in the current pool. Placed in queue.")
    except Exception as e:
        state["assigned_entity"] = "Emergency Hotline / General Legal Aid Desk"
        state["assigned_phone"] = "112" if category == "emergency_police" else "+919999999999"
        state["assigned_email"] = "dispatch@nyaya.gov.in"
        state["logs"].append(f"❌ Error allocating resource: {str(e)}")

    state["logs"].append("🏁 [Workflow End] Dispatch pass generated successfully.")
    return state

# API endpoints
@app.post("/api/triage")
def post_triage(req: TriageRequest):
    initial_state = {
        "name": req.name,
        "location": req.location,
        "query": req.query,
        "category": "",
        "reasoning": "",
        "applicable_law": "",
        "rights_summary": "",
        "assigned_entity": "",
        "assigned_phone": "",
        "assigned_email": "",
        "logs": []
    }
    try:
        final_state = run_agentic_workflow(initial_state, req.mock_mode)
        return final_state
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/resources")
def get_resources():
    try:
        df = pd.read_csv(RESOURCES_PATH)
        return df.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/resources/reset")
def post_resources_reset():
    try:
        resources_data = """jurisdiction,entity_name,location,status,phone,email
emergency_police,Karukachal Police Station,Karukachal,available,+914812486010,karukachalps.pol@kerala.gov.in
emergency_police,Ponkunnam Police Station,Ponkunnam,available,+914828221235,ponkunnamps.pol@kerala.gov.in
emergency_police,Kanjirapally Police Station PRO,Kanjirappally,busy,+914828202355,kanjirapallyps.pol@kerala.gov.in
property_civil,Adv. Rajesh Kumar (Property Law),District Court,available,+919447123456,adv.rajesh.kumar@gmail.com
property_civil,Adv. Anita Roy (Land Disputes),High Court Bar,available,+919846123456,anita.roy.associates@outlook.com
labor_employment,Adv. Suresh Nair (Labor Rights),Labor Tribunal,available,+919447987654,sureshnair.labor@gmail.com
labor_employment,Adv. Priya Sharma (Workplace Harassment),District Court,available,+919846987654,priya.sharma.legal@yahoo.com
"""
        with open(RESOURCES_PATH, "w") as f:
            f.write(resources_data)
        return {"status": "success", "message": "Resources reset to default availability state."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.get("/api/laws")
def get_laws():
    try:
        df = pd.read_csv(LAW_BOOK_PATH)
        return df.to_dict(orient="records")
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/api/settings")
def post_settings(req: SettingsRequest):
    try:
        # Set API Key in environment and write to .env
        os.environ["GROQ_API_KEY"] = req.api_key
        # Check if file exists, write or update
        if not os.path.exists(ENV_PATH):
            with open(ENV_PATH, "w") as f:
                f.write(f"GROQ_API_KEY={req.api_key}\n")
        else:
            set_key(ENV_PATH, "GROQ_API_KEY", req.api_key)
        return {"status": "success", "message": "Groq API key updated successfully."}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to save setting: {str(e)}")

@app.get("/api/config")
def get_config():
    api_key_set = bool(os.environ.get("GROQ_API_KEY"))
    return {"api_key_configured": api_key_set}

# Serve React static files in production if needed
# We will focus on running backend on 8000 and Vite on 5173 for development
if __name__ == "__main__":
    uvicorn.run("main:app", host="127.0.0.1", port=8000, reload=True)
