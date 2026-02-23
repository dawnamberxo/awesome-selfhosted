import os
import uuid
import base64
import tempfile
from datetime import datetime, timezone
from typing import Optional

from dotenv import load_dotenv
load_dotenv()

from fastapi import FastAPI, HTTPException, UploadFile, File, Form
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field
from motor.motor_asyncio import AsyncIOMotorClient
from emergentintegrations.llm.chat import LlmChat, UserMessage, ImageContent

app = FastAPI(title="Nudge API")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

MONGO_URL = os.environ.get("MONGO_URL")
DB_NAME = os.environ.get("DB_NAME")
EMERGENT_LLM_KEY = os.environ.get("EMERGENT_LLM_KEY")

client = AsyncIOMotorClient(MONGO_URL)
db = client[DB_NAME]
sessions_col = db["sessions"]


# --- Models ---
class SessionCreate(BaseModel):
    name: Optional[str] = "My Space"

class TaskUpdate(BaseModel):
    completed: bool

class ItemSort(BaseModel):
    decision: str  # keep, sell, donate

class AnalyzeRequest(BaseModel):
    session_id: str
    image_base64: str

class GenerateTasksRequest(BaseModel):
    session_id: str

class IdentifyItemsRequest(BaseModel):
    session_id: str
    image_base64: str


def serialize_doc(doc):
    if doc and "_id" in doc:
        doc["_id"] = str(doc["_id"])
    return doc


# --- AI Helpers ---
async def analyze_space_with_ai(image_base64: str) -> dict:
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"analyze-{uuid.uuid4().hex[:8]}",
        system_message="""You are Nudge, a gentle and encouraging cleaning assistant designed for neurodivergent people who struggle with task paralysis. 
        
When analyzing a photo of a space, you should:
1. Assess the overall state warmly and without judgment
2. Identify the easiest area to start with (the "quick win")
3. Rate the difficulty from 1-5 (1=light tidying, 5=major declutter)
4. Identify 3-6 distinct zones/areas that need attention
5. For each zone, give a brief, encouraging description

ALWAYS respond in valid JSON with this exact structure:
{
  "overview": "A warm, non-judgmental description of the space",
  "encouragement": "A short motivational message",
  "difficulty": 3,
  "quick_win": "The easiest thing to tackle first",
  "zones": [
    {"name": "Zone name", "description": "What needs doing here", "priority": 1, "estimated_minutes": 10}
  ]
}"""
    ).with_model("openai", "gpt-5.2")

    image_content = ImageContent(image_base64=image_base64)
    user_msg = UserMessage(
        text="Please analyze this space and help me figure out where to start cleaning. Remember to be gentle and encouraging - I might be feeling overwhelmed! Respond ONLY with valid JSON.",
        file_contents=[image_content]
    )
    response = await chat.send_message(user_msg)
    
    import json
    cleaned = response.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    if cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    return json.loads(cleaned.strip())


async def generate_tasks_with_ai(analysis: dict) -> list:
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"tasks-{uuid.uuid4().hex[:8]}",
        system_message="""You are Nudge, a gentle cleaning coach. Based on a space analysis, create a list of small, manageable cleaning tasks.

RULES:
- Each task should take 2-10 minutes MAX
- Start with the easiest tasks (quick wins first!)
- Use encouraging, gentle language
- Be specific: "Pick up the 3 cups on the desk" not "Clean the desk"
- Include small celebration moments between groups of tasks

Respond ONLY with valid JSON array:
[
  {"title": "Short task title", "description": "Gentle detailed instruction", "estimated_minutes": 5, "category": "pickup|wipe|organize|sort|celebrate", "encouragement": "You're doing great!"}
]"""
    ).with_model("openai", "gpt-5.2")

    import json
    user_msg = UserMessage(
        text=f"Based on this space analysis, create a step-by-step cleaning plan with small, manageable tasks. Here's the analysis:\n{json.dumps(analysis)}\n\nRespond ONLY with valid JSON array."
    )
    response = await chat.send_message(user_msg)
    
    cleaned = response.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    if cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    return json.loads(cleaned.strip())


async def identify_items_with_ai(image_base64: str) -> list:
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"items-{uuid.uuid4().hex[:8]}",
        system_message="""You are Nudge, a gentle decluttering assistant. When shown a photo of items/clutter, identify individual items that the user might want to sort into Keep, Sell, or Donate.

Group similar items together. Be specific but kind.

Respond ONLY with valid JSON array:
[
  {"name": "Item name", "description": "Brief description", "category": "clothing|electronics|books|kitchenware|decor|toys|misc", "suggestion": "keep|sell|donate", "reason": "Why you suggest this"}
]"""
    ).with_model("openai", "gpt-5.2")

    image_content = ImageContent(image_base64=image_base64)
    user_msg = UserMessage(
        text="Please identify the items in this photo that I could sort into Keep, Sell, or Donate categories. Be gentle and helpful! Respond ONLY with valid JSON array.",
        file_contents=[image_content]
    )
    response = await chat.send_message(user_msg)
    
    import json
    cleaned = response.strip()
    if cleaned.startswith("```json"):
        cleaned = cleaned[7:]
    if cleaned.startswith("```"):
        cleaned = cleaned[3:]
    if cleaned.endswith("```"):
        cleaned = cleaned[:-3]
    return json.loads(cleaned.strip())


# --- Endpoints ---
@app.get("/api/health")
async def health():
    return {"status": "ok", "service": "nudge"}


@app.post("/api/sessions")
async def create_session(body: SessionCreate):
    session_id = uuid.uuid4().hex
    session = {
        "session_id": session_id,
        "name": body.name,
        "status": "created",
        "analysis": None,
        "tasks": [],
        "items": [],
        "completed_tasks": 0,
        "total_tasks": 0,
        "streak": 0,
        "created_at": datetime.now(timezone.utc).isoformat(),
        "updated_at": datetime.now(timezone.utc).isoformat(),
    }
    await sessions_col.insert_one({**session})
    return session


@app.get("/api/sessions/{session_id}")
async def get_session(session_id: str):
    doc = await sessions_col.find_one({"session_id": session_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Session not found")
    return doc


@app.post("/api/analyze-space")
async def analyze_space(body: AnalyzeRequest):
    doc = await sessions_col.find_one({"session_id": body.session_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Session not found")

    analysis = await analyze_space_with_ai(body.image_base64)
    
    await sessions_col.update_one(
        {"session_id": body.session_id},
        {"$set": {
            "analysis": analysis,
            "status": "analyzed",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )
    
    updated = await sessions_col.find_one({"session_id": body.session_id}, {"_id": 0})
    return updated


@app.post("/api/generate-tasks")
async def generate_tasks(body: GenerateTasksRequest):
    doc = await sessions_col.find_one({"session_id": body.session_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Session not found")
    if not doc.get("analysis"):
        raise HTTPException(status_code=400, detail="Space must be analyzed first")

    tasks_raw = await generate_tasks_with_ai(doc["analysis"])
    tasks = []
    for i, t in enumerate(tasks_raw):
        tasks.append({
            "task_id": f"task-{i}",
            "title": t.get("title", "Task"),
            "description": t.get("description", ""),
            "estimated_minutes": t.get("estimated_minutes", 5),
            "category": t.get("category", "pickup"),
            "encouragement": t.get("encouragement", "You're doing amazing!"),
            "completed": False,
        })

    await sessions_col.update_one(
        {"session_id": body.session_id},
        {"$set": {
            "tasks": tasks,
            "total_tasks": len(tasks),
            "completed_tasks": 0,
            "status": "in_progress",
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )

    updated = await sessions_col.find_one({"session_id": body.session_id}, {"_id": 0})
    return updated


@app.put("/api/sessions/{session_id}/tasks/{task_id}")
async def update_task(session_id: str, task_id: str, body: TaskUpdate):
    doc = await sessions_col.find_one({"session_id": session_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Session not found")

    tasks = doc.get("tasks", [])
    found = False
    for task in tasks:
        if task["task_id"] == task_id:
            task["completed"] = body.completed
            found = True
            break

    if not found:
        raise HTTPException(status_code=404, detail="Task not found")

    completed_count = sum(1 for t in tasks if t["completed"])
    total = len(tasks)
    status = "completed" if completed_count == total else "in_progress"
    streak = doc.get("streak", 0)
    if body.completed:
        streak += 1

    await sessions_col.update_one(
        {"session_id": session_id},
        {"$set": {
            "tasks": tasks,
            "completed_tasks": completed_count,
            "status": status,
            "streak": streak,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )

    updated = await sessions_col.find_one({"session_id": session_id}, {"_id": 0})
    return updated


@app.post("/api/identify-items")
async def identify_items(body: IdentifyItemsRequest):
    doc = await sessions_col.find_one({"session_id": body.session_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Session not found")

    items_raw = await identify_items_with_ai(body.image_base64)
    items = []
    for i, item in enumerate(items_raw):
        items.append({
            "item_id": f"item-{i}",
            "name": item.get("name", "Item"),
            "description": item.get("description", ""),
            "category": item.get("category", "misc"),
            "suggestion": item.get("suggestion", "keep"),
            "reason": item.get("reason", ""),
            "decision": None,
        })

    await sessions_col.update_one(
        {"session_id": body.session_id},
        {"$set": {
            "items": items,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )

    updated = await sessions_col.find_one({"session_id": body.session_id}, {"_id": 0})
    return updated


@app.put("/api/sessions/{session_id}/items/{item_id}")
async def sort_item(session_id: str, item_id: str, body: ItemSort):
    if body.decision not in ["keep", "sell", "donate"]:
        raise HTTPException(status_code=400, detail="Decision must be keep, sell, or donate")

    doc = await sessions_col.find_one({"session_id": session_id}, {"_id": 0})
    if not doc:
        raise HTTPException(status_code=404, detail="Session not found")

    items = doc.get("items", [])
    found = False
    for item in items:
        if item["item_id"] == item_id:
            item["decision"] = body.decision
            found = True
            break

    if not found:
        raise HTTPException(status_code=404, detail="Item not found")

    await sessions_col.update_one(
        {"session_id": session_id},
        {"$set": {
            "items": items,
            "updated_at": datetime.now(timezone.utc).isoformat()
        }}
    )

    updated = await sessions_col.find_one({"session_id": session_id}, {"_id": 0})
    return updated
