from backend.solver import parser as netlist_parser
from backend.solver import solver as netlist_solver
from backend.agents import clarify, think, build
from pydantic import BaseModel
from typing import Any
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins = ["*"],
    allow_methods = ["*"],
    allow_headers = ["*"]
)

class NetlistInput(BaseModel):
    nodes: list[str]
    components: list[dict[str, Any]]
class GenerateRequest(BaseModel):
    prompt: str
    answers:dict[str, str] | None = None
    skip_clarifications: bool = False
class ClarifyResponse(BaseModel):
    status: str
    questions:list | None = None
    canvas_state: dict | None = None


@app.get("/")
def root():
    return {"status":"Circuit AI backend is running"}

@app.post("/validate")
def validate(netlist: NetlistInput):
    try:
        data = netlist.model_dump()
        netlist_parser.validate_netlist(data)
        return {"valid": True}
    except ValueError as e:
        raise HTTPException(status_code=400, detail = {"valid": False, "error":str(e)})
@app.post("/solve")
def solve(netlist: NetlistInput):
    try:
        data = netlist.model_dump()
        netlist_parser.validate_netlist(data)
        results = netlist_solver.solve_from_data(data)
        return results
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))
    except Exception as e:
        raise HTTPException(status_code=500, detail = f"solver error: {str(e)}")
    
@app.post("/generate")
def generate(request: GenerateRequest):
    try:
        if not request.skip_clarifications:
            clarification = clarify(request.prompt)
            if not clarification["clear"]:
                return ClarifyResponse(
                    status = "needs_clarification",
                    questions = clarification["questions"]
                )
        spec = think(request.prompt, request.answers)
        canvas_state = build(spec)
        return ClarifyResponse(
            status="success",
            canvas_state = canvas_state
        )
    except Exception as e:
        raise HTTPException(status_code=500, detail = f"generate error:{str(e)}")